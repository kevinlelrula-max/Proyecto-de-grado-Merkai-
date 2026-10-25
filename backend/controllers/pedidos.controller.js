import pool from "../config/db.js";
import { crearNotificacion } from "../utils/notificaciones.js";
import { procesarReferidoPrimeraCompra } from "./referidos.controller.js";
import { enviarEmailEstadoPedido, enviarEmailNuevoPedido } from "../utils/email.js";
import { calcularPedido, ErrorPedido } from "../utils/calcularPedido.js";

// =========================
// 🛒 CREAR PEDIDO ONLINE
// El cliente crea su pedido desde la tienda
// =========================
export const crearPedido = async (req, res) => {
  const client = await pool.connect();
  let enTransaccion = false;
  try {
    const {
      empresa_id,
      metodo_pago_id,
      direccion_entrega,
      notas,
      detalle, // [{ producto_id, cantidad }] — precios y total se calculan en el servidor
      cupon_id,
      departamento_id,
      total: totalMostrado,
    } = req.body;

    if (req.user.rol_id !== 4) {
      return res.status(403).json({ error: "Solo los clientes pueden crear pedidos en la tienda" });
    }
    const cliente_id = req.user.id;

    if (!detalle || detalle.length === 0) {
      return res.status(400).json({ error: "El pedido debe tener al menos un producto" });
    }

    const calculo = await calcularPedido({ empresa_id, cliente_id, detalle, cupon_id, departamento_id }, client);
    const total = calculo.total;

    // Nunca cobrar más de lo que el cliente vio; si los precios o descuentos cambiaron, debe revisar
    if (totalMostrado !== undefined && total > Number(totalMostrado) + 1) {
      return res.status(409).json({
        code: "TOTAL_CAMBIO",
        error: `El total de tu pedido cambió a $${total.toLocaleString("es-CO")} ` +
               "(se actualizaron precios o descuentos). Revisa tu carrito antes de confirmar.",
        total_actual: total,
      });
    }

    await client.query("BEGIN");
    enTransaccion = true;

    const pedidoResult = await client.query(
      `INSERT INTO pedidos_online
        (empresa_id, cliente_id, metodo_pago_id, direccion_entrega, notas, total, estado, cupon_id, descuento)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7, $8)
       RETURNING *`,
      [empresa_id, cliente_id, metodo_pago_id, direccion_entrega, notas || null, total,
       calculo.cupon?.id || null, calculo.descuento_cupon + calculo.descuento_referido]
    );

    const pedido = pedidoResult.rows[0];

    for (const item of calculo.items) {
      await client.query(
        `INSERT INTO detalle_pedido_online (pedido_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedido.id, item.producto_id, item.cantidad, item.precio_unitario]
      );

      // Descuento atómico: si otro pedido se llevó el stock en este instante, se rechaza
      const { rowCount } = await client.query(
        `UPDATE productos SET stock = stock - $1
         WHERE id = $2 AND empresa_id = $3 AND stock >= $1`,
        [item.cantidad, item.producto_id, empresa_id]
      );
      if (rowCount === 0) throw new ErrorPedido(409, "Un producto del carrito se quedó sin stock. Actualiza tu carrito.");
    }

    if (calculo.cupon) {
      // Condición en el UPDATE para que dos pedidos simultáneos no superen el límite de usos
      const { rowCount } = await client.query(
        `UPDATE cupones SET usos_actuales = usos_actuales + 1
         WHERE id = $1 AND (usos_totales IS NULL OR usos_actuales < usos_totales)`,
        [calculo.cupon.id]
      );
      if (rowCount === 0) throw new ErrorPedido(409, "El cupón acaba de alcanzar su límite de usos. Quítalo e intenta de nuevo.");

      await client.query(
        `INSERT INTO cupones_usos (cupon_id, cliente_id, pedido_id, descuento_aplicado)
         VALUES ($1, $2, $3, $4)`,
        [calculo.cupon.id, cliente_id, pedido.id, calculo.descuento_cupon]
      );
    }

    await client.query("COMMIT");
    enTransaccion = false;

    // 🤝 Procesar referido (primera compra del amigo)
    procesarReferidoPrimeraCompra({ cliente_id, empresa_id, pedido_id: pedido.id });

    // 🔔 Notificación: nuevo pedido online
    await crearNotificacion({
      empresa_id,
      tipo: "nuevo_pedido",
      titulo: `Nuevo pedido online #${pedido.id}`,
      mensaje: `Total: $${Number(total).toFixed(2)}`,
      seccion: "pedidos",
      referencia_id: pedido.id,
    });

    // 📧 Email al dueño de la tienda
    try {
      const infoRes = await pool.query(
        `SELECT e.email, e.nombre AS empresa_nombre,
                p.nombre AS cliente_nombre,
                json_agg(json_build_object(
                  'nombre',          pr.nombre,
                  'cantidad',        dp.cantidad,
                  'precio_unitario', dp.precio_unitario
                )) AS productos
         FROM empresas e
         JOIN persona p ON p.id = $2
         JOIN detalle_pedido_online dp ON dp.pedido_id = $3
         JOIN productos pr ON pr.id = dp.producto_id
         WHERE e.id = $1
         GROUP BY e.email, e.nombre, p.nombre`,
        [empresa_id, cliente_id, pedido.id]
      );
      if (infoRes.rows.length > 0 && infoRes.rows[0].email) {
        const { email, empresa_nombre, cliente_nombre, productos: prods } = infoRes.rows[0];
        enviarEmailNuevoPedido({
          destinatario:  email,
          empresaNombre: empresa_nombre,
          numeroPedido:  pedido.id,
          total,
          clienteNombre: cliente_nombre,
          productos:     prods,
        }).catch(err => console.error("Error enviando email nuevo pedido:", err));
      }
    } catch (emailErr) {
      console.error("Error preparando email nuevo pedido:", emailErr);
    }

    res.json({ id: pedido.id, estado: pedido.estado, total: Number(pedido.total) });
  } catch (error) {
    if (enTransaccion) await client.query("ROLLBACK");
    if (error instanceof ErrorPedido) {
      return res.status(error.status).json({ error: error.message, ...error.extra });
    }
    console.error("Error crearPedido:", error);
    res.status(500).json({ error: "Error al crear el pedido" });
  } finally {
    client.release();
  }
};

// =========================
// 🛒 MIS PEDIDOS (cliente)
// El cliente ve todos sus pedidos con detalle
// =========================
export const getMisPedidos = async (req, res) => {
  try {
    const cliente_id = req.user.id;

    const result = await pool.query(
      `SELECT 
         p.id,
         p.estado,
         p.total,
         p.direccion_entrega,
         p.notas,
         p.fecha_pedido,
         p.fecha_actualizacion,
         e.nombre AS empresa_nombre,
         e.telefono AS empresa_telefono,
         e.slug AS empresa_slug,
         mp.metodo AS metodo_pago,
         json_agg(
           json_build_object(
             'producto_id',    dp.producto_id,
             'nombre',         pr.nombre,
             'cantidad',       dp.cantidad,
             'unidad',         pr.unidad,
             'precio_unitario', dp.precio_unitario,
             'subtotal',       dp.subtotal
           )
         ) AS detalle
       FROM pedidos_online p
       JOIN empresas e       ON e.id = p.empresa_id
       JOIN metodo_pago mp   ON mp.id = p.metodo_pago_id
       JOIN detalle_pedido_online dp ON dp.pedido_id = p.id
       JOIN productos pr      ON pr.id = dp.producto_id
       WHERE p.cliente_id = $1
       GROUP BY p.id, e.nombre, e.telefono, e.slug, mp.metodo
       ORDER BY p.fecha_pedido DESC`,
      [cliente_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getMisPedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};

// =========================
// 🛒 ESTADO DE UN PEDIDO (polling)
// El cliente consulta el estado de un pedido específico
// =========================
export const getEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente_id = req.user.id;

    const result = await pool.query(
      `SELECT id, estado, fecha_actualizacion
       FROM pedidos_online
       WHERE id = $1 AND cliente_id = $2`,
      [id, cliente_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getEstadoPedido:", error);
    res.status(500).json({ error: "Error al obtener estado del pedido" });
  }
};

// =========================
// 🔥 PEDIDOS ONLINE (panel cajero)
// El cajero ve los pedidos de su empresa
// =========================
export const getPedidosEmpresa = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT 
         p.id,
         p.estado,
         p.total,
         p.direccion_entrega,
         p.notas,
         p.fecha_pedido,
         p.fecha_actualizacion,
         per.nombre    AS cliente_nombre,
         per.apellido  AS cliente_apellido,
         per.telefono  AS cliente_telefono,
         mp.metodo     AS metodo_pago,
         json_agg(
           json_build_object(
             'producto_id',     dp.producto_id,
             'nombre',          pr.nombre,
             'cantidad',        dp.cantidad,
             'unidad',          pr.unidad,
             'precio_unitario', dp.precio_unitario,
             'subtotal',        dp.subtotal
           )
         ) AS detalle
       FROM pedidos_online p
       JOIN persona per          ON per.id = p.cliente_id
       JOIN metodo_pago mp       ON mp.id = p.metodo_pago_id
       JOIN detalle_pedido_online dp ON dp.pedido_id = p.id
       JOIN productos pr          ON pr.id = dp.producto_id
       WHERE p.empresa_id = $1
       GROUP BY p.id, per.nombre, per.apellido, per.telefono, mp.metodo
       ORDER BY p.fecha_pedido DESC`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getPedidosEmpresa:", error);
    res.status(500).json({ error: "Error al obtener pedidos de la empresa" });
  }
};

// =========================
// 🔥 ACTUALIZAR ESTADO (cajero)
// pendiente → confirmado → en_preparacion → enviado → entregado → cancelado
// =========================
export const actualizarEstadoPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const empresa_id = req.user.empresa_id;

    const estadosValidos = [
      "pendiente",
      "confirmado",
      "en_preparacion",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    await client.query("BEGIN");

    const { rows: [actual] } = await client.query(
      "SELECT estado FROM pedidos_online WHERE id = $1 AND empresa_id = $2 FOR UPDATE",
      [id, empresa_id]
    );
    if (!actual) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    // Un pedido cancelado ya devolvió su stock; reabrirlo o cancelarlo otra vez lo descuadraría
    if (actual.estado === "cancelado") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El pedido ya está cancelado y no se puede modificar" });
    }

    const result = await client.query(
      `UPDATE pedidos_online
       SET estado = $1, fecha_actualizacion = NOW()
       WHERE id = $2 AND empresa_id = $3
       RETURNING id, estado, fecha_actualizacion`,
      [estado, id, empresa_id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Registrar en historial (dentro de la transacción)
    await client.query(
      `INSERT INTO pedido_estados_historial (pedido_id, estado, nota)
       VALUES ($1, $2, $3)`,
      [id, estado, req.body.nota || null]
    );

    // Restaurar stock si se cancela (dentro de la transacción)
    if (estado === "cancelado") {
      const detalles = await client.query(
        `SELECT producto_id, cantidad FROM detalle_pedido_online WHERE pedido_id = $1`,
        [id]
      );
      for (const item of detalles.rows) {
        await client.query(
          `UPDATE productos SET stock = stock + $1 WHERE id = $2`,
          [item.cantidad, item.producto_id]
        );
      }
    }

    await client.query("COMMIT");

    // 🔔 Notificaciones (fuera de transacción — fire-and-forget)
    if (estado === "entregado") {
      crearNotificacion({
        empresa_id,
        tipo: "pedido_entregado",
        titulo: `Pedido #${id} entregado`,
        mensaje: "El pedido fue marcado como entregado.",
        seccion: "pedidos",
        referencia_id: Number(id),
      });
    } else if (estado === "cancelado") {
      crearNotificacion({
        empresa_id,
        tipo: "pedido_cancelado",
        titulo: `Pedido #${id} cancelado`,
        mensaje: "El pedido fue cancelado.",
        seccion: "pedidos",
        referencia_id: Number(id),
      });
    }

    // 📧 Email al cliente (fuera de transacción — fire-and-forget)
    const ESTADOS_CON_EMAIL = ["confirmado", "en_preparacion", "enviado", "entregado", "cancelado"];
    if (ESTADOS_CON_EMAIL.includes(estado)) {
      pool.query(
        `SELECT p.nombre, p.usuario AS email, e.nombre AS empresa_nombre
         FROM pedidos_online po
         JOIN persona p ON p.id = po.cliente_id
         JOIN empresas e ON e.id = po.empresa_id
         WHERE po.id = $1`,
        [id]
      ).then(clienteRes => {
        if (clienteRes.rows.length > 0) {
          const { nombre, email, empresa_nombre } = clienteRes.rows[0];
          enviarEmailEstadoPedido({
            destinatario: email,
            nombre,
            numeroPedido: id,
            estado,
            empresaNombre: empresa_nombre,
          }).catch(err => console.error("Error enviando email de estado:", err));
        }
      }).catch(err => console.error("Error preparando email de estado:", err));
    }

    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error actualizarEstadoPedido:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  } finally {
    client.release();
  }
};

// =========================
// 📋 HISTORIAL DE ESTADOS (cliente y empresa)
// =========================
export const getHistorialPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuario_id, empresa_id } = req.user;

    // Verificar que el pedido pertenece al usuario (cliente) o a su empresa
    const acceso = await pool.query(
      `SELECT 1 FROM pedidos_online
       WHERE id = $1 AND (cliente_id = $2 OR empresa_id = $3)`,
      [id, usuario_id, empresa_id]
    );

    if (acceso.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const result = await pool.query(
      `SELECT estado, nota, cambiado_en
       FROM pedido_estados_historial
       WHERE pedido_id = $1
       ORDER BY cambiado_en ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getHistorialPedido:", error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};