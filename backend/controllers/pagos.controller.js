import pool from "../config/db.js";
import Stripe from "stripe";
import crypto from "crypto";
import { getLlavePrivada } from "./integraciones.controller.js";
import { enviarEmailEstadoPedido } from "../utils/email.js";

// ── Función central: procesar pago aprobado (igual para todas las pasarelas) ─
async function procesarPagoAprobado({ empresa_id, pedido_id, proveedor, referencia, monto, datos_respuesta }) {
  const client = await pool.connect();
  let notificarCliente = false;
  try {
    await client.query("BEGIN");

    const { rows: [pedido] } = await client.query(
      "SELECT total, empresa_id, estado FROM pedidos_online WHERE id = $1 FOR UPDATE", [pedido_id]
    );
    // Un pago menor al total del pedido (o de otra tienda) no confirma el pedido
    if (!pedido || Number(pedido.empresa_id) !== Number(empresa_id) || Number(monto) + 0.5 < Number(pedido.total)) {
      await client.query("ROLLBACK");
      console.error(`Pago inconsistente — pedido #${pedido_id}: pagado ${monto}, esperado ${pedido?.total}`);
      await procesarPagoRechazado({
        pedido_id, proveedor, referencia,
        datos_respuesta: { ...datos_respuesta, motivo_rechazo: "monto_o_empresa_no_coinciden", monto_pagado: monto },
      });
      return;
    }

    // 1. Registrar pago en tabla pagos_online
    await client.query(
      `INSERT INTO pagos_online (pedido_id, empresa_id, proveedor, referencia, estado, monto, datos_respuesta)
       VALUES ($1, $2, $3, $4, 'aprobado', $5, $6)
       ON CONFLICT (pedido_id) DO UPDATE SET
         estado = 'aprobado', referencia = EXCLUDED.referencia,
         datos_respuesta = EXCLUDED.datos_respuesta, fecha_actualizacion = NOW()`,
      [pedido_id, empresa_id, proveedor, referencia, monto, JSON.stringify(datos_respuesta)]
    );

    // 2. Actualizar estado del pedido a "confirmado" (ya pagado)
    await client.query(
      `UPDATE pedidos_online
       SET estado = 'confirmado', fecha_actualizacion = NOW()
       WHERE id = $1`,
      [pedido_id]
    );

    // Solo el primer pago aprobado notifica; un reintento del webhook no repite el correo
    notificarCliente = pedido.estado === "pendiente";

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error procesarPagoAprobado:", error);
    throw error;
  } finally {
    client.release();
  }

  // 📧 Email de confirmación al cliente (fuera de transacción — fire-and-forget)
  if (notificarCliente) {
    pool.query(
      `SELECT p.nombre, p.usuario AS email, e.nombre AS empresa_nombre
       FROM pedidos_online po
       JOIN persona p ON p.id = po.cliente_id
       JOIN empresas e ON e.id = po.empresa_id
       WHERE po.id = $1`,
      [pedido_id]
    ).then(({ rows }) => {
      if (rows.length === 0) return;
      const { nombre, email, empresa_nombre } = rows[0];
      return enviarEmailEstadoPedido({
        destinatario: email,
        nombre,
        numeroPedido: pedido_id,
        estado: "confirmado",
        empresaNombre: empresa_nombre,
      });
    }).catch(err => console.error("Error enviando email de pago confirmado:", err));
  }
}

async function procesarPagoRechazado({ pedido_id, proveedor, referencia, datos_respuesta }) {
  await pool.query(
    `INSERT INTO pagos_online (pedido_id, empresa_id, proveedor, referencia, estado, monto, datos_respuesta)
     SELECT $1, empresa_id, $2, $3, 'rechazado', total, $4
     FROM pedidos_online WHERE id = $1
     ON CONFLICT (pedido_id) DO UPDATE SET
       estado = 'rechazado', datos_respuesta = EXCLUDED.datos_respuesta, fecha_actualizacion = NOW()`,
    [pedido_id, proveedor, referencia, JSON.stringify(datos_respuesta)]
  );
}

// =========================
// 🔹 CREAR PAYMENT INTENT (Stripe)
// El frontend llama esto antes de mostrar el formulario de tarjeta
// =========================
export const crearPaymentIntent = async (req, res) => {
  try {
    const { empresa_id, pedido_id } = req.body;

    // El monto sale del pedido guardado, nunca del navegador
    const { rows: [pedido] } = await pool.query(
      `SELECT total, estado FROM pedidos_online
       WHERE id = $1 AND empresa_id = $2 AND cliente_id = $3`,
      [pedido_id, empresa_id, req.user.id]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (pedido.estado !== "pendiente") {
      return res.status(400).json({ error: "Este pedido ya no está pendiente de pago" });
    }
    const monto = parseFloat(pedido.total);

    // Obtener llave privada de Stripe de esta empresa
    const llavePrivada = await getLlavePrivada(empresa_id, "stripe");
    if (!llavePrivada) {
      return res.status(400).json({ error: "Esta empresa no tiene Stripe configurado" });
    }

    const stripe = new Stripe(llavePrivada);

    const paymentIntent = await stripe.paymentIntents.create({
      // COP en Stripe usa centavos igual que USD — se multiplica por 100
      amount:   Math.round(monto * 100),
      currency: "cop",
      metadata: { pedido_id: String(pedido_id), empresa_id: String(empresa_id) },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error crearPaymentIntent:", error);
    // Errores de Stripe (llave inválida, moneda no soportada, etc.) → 400, no 500
    const esErrorStripe = error.type && error.type.startsWith("Stripe");
    res.status(esErrorStripe ? 400 : 500).json({
      error: error.message || "Error al crear intención de pago",
    });
  }
};

// =========================
// 🔹 WEBHOOK STRIPE
// Stripe llama esto cuando el pago cambia de estado
// =========================
export const webhookStripe = async (req, res) => {
  const sig       = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // whsec_...

  let event;
  try {
    // req.body debe ser el raw body (Buffer), no JSON parseado
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_DEFAULT || "sk_test_placeholder");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook Stripe signature error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const pedido_id  = Number(pi.metadata.pedido_id);
    const empresa_id = Number(pi.metadata.empresa_id);

    try {
      await procesarPagoAprobado({
        empresa_id,
        pedido_id,
        proveedor:        "stripe",
        referencia:       pi.id,
        monto:            pi.amount / 100,
        datos_respuesta:  pi,
      });
      console.log(`✅ Pago Stripe aprobado — pedido #${pedido_id}`);
    } catch (error) {
      console.error("Error procesando pago Stripe:", error);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    const pedido_id = Number(pi.metadata.pedido_id);
    try {
      await procesarPagoRechazado({
        pedido_id,
        proveedor:       "stripe",
        referencia:      pi.id,
        datos_respuesta: pi,
      });
      console.log(`❌ Pago Stripe rechazado — pedido #${pedido_id}`);
    } catch (error) {
      console.error("Error procesando pago rechazado Stripe:", error);
    }
  }

  res.json({ received: true });
};

// =========================
// 🔹 WEBHOOK WOMPI
// TODO: implementar cuando se tenga cuenta Wompi
// =========================
export const webhookWompi = async (req, res) => {
  try {
    const { event, data } = req.body;
    const empresa_id = Number(req.query.empresa_id); // se pasa como query param

    // Verificar firma HMAC-SHA256
    const signature  = req.headers["x-wompi-signature"];
    const llavePrivada = await getLlavePrivada(empresa_id, "wompi");
    if (!llavePrivada) return res.status(400).json({ error: "Wompi no configurado" });

    const hmac     = crypto.createHmac("sha256", llavePrivada);
    const computed = hmac.update(JSON.stringify(req.body)).digest("hex");
    if (computed !== signature) {
      return res.status(401).json({ error: "Firma inválida" });
    }

    if (event?.type === "transaction.updated" && data?.transaction?.status === "APPROVED") {
      const tx = data.transaction;
      await procesarPagoAprobado({
        empresa_id,
        pedido_id:       Number(tx.reference),
        proveedor:       "wompi",
        referencia:      tx.id,
        monto:           tx.amount_in_cents / 100,
        datos_respuesta: tx,
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error webhook Wompi:", error);
    res.status(500).json({ error: "Error procesando webhook" });
  }
};

// =========================
// 🔹 WEBHOOK PAYU
// TODO: implementar cuando se tenga cuenta PayU
// =========================
export const webhookPayU = async (req, res) => {
  try {
    const { transactionState, referenceCode, TX_VALUE, currency, sign } = req.body;
    const empresa_id = Number(req.query.empresa_id);

    // Verificar firma MD5
    const llavePrivada = await getLlavePrivada(empresa_id, "payu");
    const llavePublica = await getLlavePrivada(empresa_id, "payu"); // API Key
    if (!llavePrivada) return res.status(400).json({ error: "PayU no configurado" });

    const cadena   = `${llavePrivada}~${llavePublica}~${referenceCode}~${TX_VALUE}~${currency}~${transactionState}`;
    const computed = crypto.createHash("md5").update(cadena).digest("hex");
    if (computed !== sign) {
      return res.status(401).json({ error: "Firma inválida" });
    }

    // Estado 4 = aprobado en PayU
    if (transactionState === "4") {
      await procesarPagoAprobado({
        empresa_id,
        pedido_id:       Number(referenceCode),
        proveedor:       "payu",
        referencia:      req.body.transactionId,
        monto:           Number(TX_VALUE),
        datos_respuesta: req.body,
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error webhook PayU:", error);
    res.status(500).json({ error: "Error procesando webhook" });
  }
};

// =========================
// 🔹 WEBHOOK MERCADOPAGO
// TODO: implementar cuando se tenga cuenta MercadoPago
// =========================
export const webhookMercadoPago = async (req, res) => {
  try {
    const { type, data } = req.body;
    const empresa_id = Number(req.query.empresa_id);

    if (type === "payment") {
      // Verificar firma
      const xSignature  = req.headers["x-signature"];
      const xRequestId  = req.headers["x-request-id"];
      const llavePrivada = await getLlavePrivada(empresa_id, "mercadopago");
      if (!llavePrivada) return res.status(400).json({ error: "MercadoPago no configurado" });

      const [tsPart, v1Part] = xSignature.split(",");
      const ts = tsPart?.split("=")?.[1];
      const v1 = v1Part?.split("=")?.[1];
      const manifest = `id:${data?.id};request-id:${xRequestId};ts:${ts};`;
      const computed  = crypto.createHmac("sha256", llavePrivada).update(manifest).digest("hex");

      if (computed !== v1) {
        return res.status(401).json({ error: "Firma inválida" });
      }

      // TODO: llamar API de MP para obtener detalles del pago y verificar estado
      // Por ahora solo registramos
      console.log(`MercadoPago webhook recibido — payment id: ${data?.id}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error webhook MercadoPago:", error);
    res.status(500).json({ error: "Error procesando webhook" });
  }
};

// =========================
// 🔹 GET ESTADO PAGO de un pedido
// El frontend consulta esto para saber si el pago fue aprobado
// =========================
export const getEstadoPago = async (req, res) => {
  try {
    const { pedido_id } = req.params;
    const cliente_id    = req.user.id;

    const result = await pool.query(
      `SELECT po.estado, po.proveedor, po.referencia, po.fecha_creacion
       FROM pagos_online po
       JOIN pedidos_online ped ON ped.id = po.pedido_id
       WHERE po.pedido_id = $1 AND ped.cliente_id = $2`,
      [pedido_id, cliente_id]
    );

    if (result.rows.length === 0) {
      return res.json({ estado: "sin_pago" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getEstadoPago:", error);
    res.status(500).json({ error: "Error al obtener estado del pago" });
  }
};