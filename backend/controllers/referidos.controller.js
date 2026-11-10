import pool from "../config/db.js";
import crypto from "crypto";
import { crearNotificacion } from "../utils/notificaciones.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generarCodigo(nombre = "") {
  const prefix = nombre.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(3, "X");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}

async function getNivelActual(clienteId, empresaId) {
  const [pos, online] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM ventas
       WHERE cliente_id=$1 AND empresa_id=$2
       AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())`,
      [clienteId, empresaId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM pedidos_online
       WHERE cliente_id=$1 AND empresa_id=$2
       AND DATE_TRUNC('month', fecha_pedido) = DATE_TRUNC('month', NOW())
       AND estado != 'cancelado'`,
      [clienteId, empresaId]
    ),
  ]);
  const totalMes = parseFloat(pos.rows[0].total) + parseFloat(online.rows[0].total);
  const { rows } = await pool.query(
    `SELECT * FROM niveles_lealtad
     WHERE empresa_id=$1 AND activo=true AND monto_minimo <= $2
     ORDER BY monto_minimo DESC LIMIT 1`,
    [empresaId, totalMes]
  );
  return rows[0] || null;
}

// Retorna el nivel efectivo del cliente:
// Si tiene herencia activa Y es mejor que el nivel ganado → usa herencia
async function getNivelEfectivo(clienteId, empresaId) {
  const nivelGanado = await getNivelActual(clienteId, empresaId);

  // Buscar herencia activa en esta empresa
  const { rows: [herencia] } = await pool.query(
    `SELECT r.nivel_heredado_id, r.nivel_heredado_hasta, nl.nombre, nl.monto_minimo
     FROM referidos r
     JOIN niveles_lealtad nl ON nl.id = r.nivel_heredado_id
     WHERE r.referido_id = $1
       AND r.empresa_id  = $2
       AND r.nivel_heredado_id IS NOT NULL
       AND r.nivel_heredado_hasta > NOW()
     ORDER BY nl.monto_minimo DESC
     LIMIT 1`,
    [clienteId, empresaId]
  );

  if (!herencia) return { nivel: nivelGanado, heredado: false };

  // Si el nivel heredado es mejor (mayor monto_minimo) que el ganado → usar heredado
  const montoGanado = nivelGanado?.monto_minimo ?? -1;
  if (herencia.monto_minimo > montoGanado) {
    return {
      nivel: {
        id:           herencia.nivel_heredado_id,
        nombre:       herencia.nombre,
        monto_minimo: herencia.monto_minimo,
      },
      heredado:       true,
      heredado_hasta: herencia.nivel_heredado_hasta,
    };
  }

  return { nivel: nivelGanado, heredado: false };
}

async function getConfigAmigo(empresaId, nivelId) {
  // Busca config para este nivel; si no hay, usa la de "sin nivel" (nivel_id IS NULL)
  const { rows } = await pool.query(
    `SELECT * FROM referidos_config_amigo
     WHERE empresa_id=$1 AND activo=true
     AND nivel_id IS NOT DISTINCT FROM $2
     LIMIT 1`,
    [empresaId, nivelId ?? null]
  );
  if (rows.length > 0) return rows[0];

  const { rows: fallback } = await pool.query(
    `SELECT * FROM referidos_config_amigo
     WHERE empresa_id=$1 AND nivel_id IS NULL AND activo=true LIMIT 1`,
    [empresaId]
  );
  return fallback[0] || { descuento_pct: 5, envio_gratis: false, descripcion: "5% descuento bienvenida" };
}

async function getConfigReferidor(empresaId, acumulados) {
  const { rows } = await pool.query(
    `SELECT * FROM referidos_config_referidor
     WHERE empresa_id=$1 AND activo=true
     AND rango_desde <= $2
     AND (rango_hasta IS NULL OR rango_hasta >= $2)
     ORDER BY rango_desde DESC LIMIT 1`,
    [empresaId, acumulados]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/referidos/mi-info?empresa_id=X  — Cliente autenticado
// ─────────────────────────────────────────────────────────────────────────────
export const getMiReferido = async (req, res) => {
  try {
    const cliente_id = req.user.id;
    const empresa_id = parseInt(req.query.empresa_id);
    if (!empresa_id) return res.status(400).json({ error: "empresa_id requerido" });

    // Asegurar que el cliente tiene código de referido
    let { rows: [cliente] } = await pool.query(
      `SELECT id, nombre, codigo_referido FROM persona WHERE id=$1`, [cliente_id]
    );
    if (!cliente.codigo_referido) {
      const codigo = generarCodigo(cliente.nombre);
      await pool.query(`UPDATE persona SET codigo_referido=$1 WHERE id=$2`, [codigo, cliente_id]);
      cliente.codigo_referido = codigo;
    }

    // Nivel efectivo (ganado o heredado)
    const { nivel, heredado, heredado_hasta } = await getNivelEfectivo(cliente_id, empresa_id);

    // Qué recibiría el amigo hoy con este nivel
    const configAmigo = await getConfigAmigo(empresa_id, nivel?.id ?? null);

    // Todas las configs de la empresa (para mostrar la tabla al cliente)
    const { rows: todasConfigs } = await pool.query(
      `SELECT rca.*, nl.nombre AS nivel_nombre_real, nl.monto_minimo,
              nlh.nombre AS nivel_heredado_nombre
       FROM referidos_config_amigo rca
       LEFT JOIN niveles_lealtad nl  ON nl.id  = rca.nivel_id
       LEFT JOIN niveles_lealtad nlh ON nlh.id = rca.nivel_heredado_id
       WHERE rca.empresa_id=$1 AND rca.activo=true
       ORDER BY COALESCE(nl.monto_minimo, -1) ASC`,
      [empresa_id]
    );

    // Stats del referidor
    const { rows: [stats] } = await pool.query(
      `SELECT
         COUNT(*)                                FILTER (WHERE estado != 'cancelado') AS total,
         COUNT(*)                                FILTER (WHERE estado = 'completado') AS completados,
         COUNT(*)                                FILTER (WHERE estado = 'registrado') AS pendientes
       FROM referidos
       WHERE referidor_id=$1 AND empresa_id=$2`,
      [cliente_id, empresa_id]
    );

    const acumulados = parseInt(stats.completados);
    const proximoPremio = await getConfigReferidor(empresa_id, acumulados + 1);

    // Historial reciente
    const { rows: historial } = await pool.query(
      `SELECT r.id, r.estado, r.creado_en, r.completado_en,
              p.nombre AS referido_nombre, p.apellido AS referido_apellido
       FROM referidos r
       LEFT JOIN persona p ON p.id = r.referido_id
       WHERE r.referidor_id=$1 AND r.empresa_id=$2
       ORDER BY r.creado_en DESC LIMIT 10`,
      [cliente_id, empresa_id]
    );

    res.json({
      codigo:              cliente.codigo_referido,
      nivel_actual:        nivel,
      nivel_heredado:      heredado ? { activo: true, hasta: heredado_hasta } : { activo: false },
      config_amigo_actual: configAmigo,
      todas_configs:       todasConfigs,
      stats: {
        total:       parseInt(stats.total),
        completados: acumulados,
        pendientes:  parseInt(stats.pendientes),
      },
      proximo_premio: proximoPremio,
      historial,
    });
  } catch (error) {
    console.error("getMiReferido:", error);
    res.status(500).json({ error: "Error al obtener información de referido" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/referidos/mi-descuento-activo?empresa_id=X  — Cliente en checkout
// Retorna si el cliente tiene un descuento de referido pendiente de usar
// ─────────────────────────────────────────────────────────────────────────────
export const getMiDescuentoActivo = async (req, res) => {
  try {
    const cliente_id = req.user.id;
    const empresa_id = parseInt(req.query.empresa_id);
    if (!empresa_id) return res.json({ tiene_descuento: false });

    const { rows: [ref] } = await pool.query(
      `SELECT descuento_amigo_pct, envio_gratis_amigo
       FROM referidos
       WHERE referido_id=$1 AND empresa_id=$2 AND estado='registrado'
       LIMIT 1`,
      [cliente_id, empresa_id]
    );

    if (!ref) return res.json({ tiene_descuento: false });

    res.json({
      tiene_descuento:  true,
      descuento_pct:    parseFloat(ref.descuento_amigo_pct),
      envio_gratis:     ref.envio_gratis_amigo,
    });
  } catch (error) {
    console.error("getMiDescuentoActivo:", error);
    res.json({ tiene_descuento: false });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/referidos/validar/:codigo?empresa_id=X  — Público
// ─────────────────────────────────────────────────────────────────────────────
export const validarCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const empresa_id = parseInt(req.query.empresa_id);
    if (!empresa_id) return res.status(400).json({ error: "empresa_id requerido" });

    const { rows: [referidor] } = await pool.query(
      `SELECT id, nombre FROM persona WHERE codigo_referido=$1`, [codigo]
    );
    if (!referidor) return res.status(404).json({ valido: false, error: "Código no válido" });

    const nivel       = await getNivelActual(referidor.id, empresa_id);
    const configAmigo = await getConfigAmigo(empresa_id, nivel?.id ?? null);

    // Nombre del nivel heredado si está configurado
    let nivelHeredadoNombre = null;
    if (configAmigo?.nivel_heredado_id) {
      const { rows: [nl] } = await pool.query(
        `SELECT nombre FROM niveles_lealtad WHERE id=$1`, [configAmigo.nivel_heredado_id]
      );
      nivelHeredadoNombre = nl?.nombre ?? null;
    }

    res.json({
      valido:               true,
      referidor_nombre:     referidor.nombre,
      nivel_referidor:      nivel?.nombre || "Sin nivel",
      descuento_pct:        configAmigo.descuento_pct,
      envio_gratis:         configAmigo.envio_gratis,
      descripcion:          configAmigo.descripcion,
      nivel_heredado:       nivelHeredadoNombre,
    });
  } catch (error) {
    console.error("validarCodigo:", error);
    res.status(500).json({ error: "Error al validar código" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/referidos/config  — Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getConfigReferidos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const [configAmigo, configRef, niveles] = await Promise.all([
      pool.query(
        `SELECT rca.*, nl.nombre AS nivel_nombre_real, nl.monto_minimo,
                nlh.nombre AS nivel_heredado_nombre
         FROM referidos_config_amigo rca
         LEFT JOIN niveles_lealtad nl  ON nl.id  = rca.nivel_id
         LEFT JOIN niveles_lealtad nlh ON nlh.id = rca.nivel_heredado_id
         WHERE rca.empresa_id=$1
         ORDER BY COALESCE(nl.monto_minimo, -1) ASC`,
        [empresa_id]
      ),
      pool.query(
        `SELECT * FROM referidos_config_referidor
         WHERE empresa_id=$1 ORDER BY rango_desde ASC`,
        [empresa_id]
      ),
      pool.query(
        `SELECT id, nombre, monto_minimo FROM niveles_lealtad
         WHERE empresa_id=$1 AND activo=true ORDER BY monto_minimo ASC`,
        [empresa_id]
      ),
    ]);

    res.json({
      config_amigo:      configAmigo.rows,
      config_referidor:  configRef.rows,
      niveles:           niveles.rows,
    });
  } catch (error) {
    console.error("getConfigReferidos:", error);
    res.status(500).json({ error: "Error al obtener configuración" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/referidos/config  — Admin
// ─────────────────────────────────────────────────────────────────────────────
export const guardarConfigReferidos = async (req, res) => {
  const client = await pool.connect();
  try {
    const empresa_id                   = req.user.empresa_id;
    const { config_amigo, config_referidor } = req.body;

    await client.query("BEGIN");

    for (const e of config_amigo) {
      await client.query(
        `INSERT INTO referidos_config_amigo
           (empresa_id, nivel_id, nivel_nombre, descuento_pct, envio_gratis, descripcion, activo, nivel_heredado_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (empresa_id, nivel_id) DO UPDATE SET
           nivel_nombre      = EXCLUDED.nivel_nombre,
           descuento_pct     = EXCLUDED.descuento_pct,
           envio_gratis      = EXCLUDED.envio_gratis,
           descripcion       = EXCLUDED.descripcion,
           activo            = EXCLUDED.activo,
           nivel_heredado_id = EXCLUDED.nivel_heredado_id`,
        [empresa_id, e.nivel_id ?? null, e.nivel_nombre,
         e.descuento_pct, e.envio_gratis || false,
         e.descripcion || null, e.activo !== false,
         e.nivel_heredado_id ?? null]
      );
    }

    await client.query(`DELETE FROM referidos_config_referidor WHERE empresa_id=$1`, [empresa_id]);
    for (const e of config_referidor) {
      await client.query(
        `INSERT INTO referidos_config_referidor
           (empresa_id, rango_desde, rango_hasta, tipo_premio, valor, descripcion)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [empresa_id, e.rango_desde, e.rango_hasta ?? null,
         e.tipo_premio || "puntos",
         (e.valor !== undefined && e.valor !== "" && e.valor !== null) ? Number(e.valor) : null,
         e.descripcion || null]
      );
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("guardarConfigReferidos:", error);
    res.status(500).json({ error: "Error al guardar configuración" });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/referidos/estadisticas  — Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getEstadisticasReferidos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const [general, topReferidores, recientes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                   AS total_registrados,
           COUNT(*) FILTER (WHERE estado='completado') AS completados,
           COUNT(*) FILTER (WHERE estado='registrado') AS pendientes,
           ROUND(
             COUNT(*) FILTER (WHERE estado='completado')::numeric
             / NULLIF(COUNT(*), 0) * 100, 1
           )                                          AS tasa_conversion
         FROM referidos WHERE empresa_id=$1`,
        [empresa_id]
      ),
      pool.query(
        `SELECT p.nombre, p.apellido, p.codigo_referido,
                COUNT(*) FILTER (WHERE r.estado='completado') AS completados,
                COUNT(*)                                       AS total
         FROM referidos r
         JOIN persona p ON p.id = r.referidor_id
         WHERE r.empresa_id=$1
         GROUP BY p.id, p.nombre, p.apellido, p.codigo_referido
         ORDER BY completados DESC LIMIT 10`,
        [empresa_id]
      ),
      pool.query(
        `SELECT r.id, r.estado, r.creado_en, r.completado_en,
                rf.nombre  AS referidor,
                ref2.nombre AS referido
         FROM referidos r
         JOIN persona rf    ON rf.id   = r.referidor_id
         LEFT JOIN persona ref2 ON ref2.id = r.referido_id
         WHERE r.empresa_id=$1
         ORDER BY r.creado_en DESC LIMIT 20`,
        [empresa_id]
      ),
    ]);

    res.json({
      general:         general.rows[0],
      top_referidores: topReferidores.rows,
      recientes:       recientes.rows,
    });
  } catch (error) {
    console.error("getEstadisticasReferidos:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN INTERNA — Llamada desde pedidos.controller al confirmar primer pedido
// ─────────────────────────────────────────────────────────────────────────────
export async function procesarReferidoPrimeraCompra({ cliente_id, empresa_id, pedido_id }) {
  try {
    // ¿Tiene referido pendiente en esta empresa?
    const { rows: [ref] } = await pool.query(
      `SELECT * FROM referidos
       WHERE referido_id=$1 AND empresa_id=$2 AND estado='registrado' LIMIT 1`,
      [cliente_id, empresa_id]
    );
    if (!ref) return;

    // ¿Es su primera compra en esta empresa?
    const { rows: [compras] } = await pool.query(
      `SELECT (
         (SELECT COUNT(*) FROM ventas      WHERE cliente_id=$1 AND empresa_id=$2)
       + (SELECT COUNT(*) FROM pedidos_online
          WHERE cliente_id=$1 AND empresa_id=$2 AND estado != 'cancelado' AND id != $3)
       ) AS total`,
      [cliente_id, empresa_id, pedido_id]
    );
    if (parseInt(compras.total) > 0) return; // No es primera compra

    // Nivel actual del referidor
    const nivel = await getNivelActual(ref.referidor_id, empresa_id);

    // Config del amigo — incluye nivel_heredado_id si la empresa lo configuró
    const configAmigo = await getConfigAmigo(empresa_id, nivel?.id ?? null);

    // Cuántos referidos completados lleva
    const { rows: [statsRef] } = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE estado='completado') AS completados
       FROM referidos WHERE referidor_id=$1 AND empresa_id=$2`,
      [ref.referidor_id, empresa_id]
    );
    const nuevosAcumulados = parseInt(statsRef.completados) + 1;
    const configRef = await getConfigReferidor(empresa_id, nuevosAcumulados);

    // Calcular vigencia del nivel heredado (1 mes desde hoy)
    const nivelHeredadoId    = configAmigo?.nivel_heredado_id ?? null;
    const nivelHeredadoHasta = nivelHeredadoId
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;

    // Marcar como completado + guardar herencia
    await pool.query(
      `UPDATE referidos SET
         estado                       = 'completado',
         nivel_referidor_al_completar = $1,
         pedido_activador_id          = $2,
         tipo_premio_referidor        = $3,
         valor_premio_referidor       = $4,
         nivel_heredado_id            = $5,
         nivel_heredado_hasta         = $6,
         completado_en                = NOW()
       WHERE id = $7`,
      [
        nivel?.nombre || "Sin nivel",
        pedido_id,
        configRef?.tipo_premio  ?? null,
        configRef?.valor        ?? null,
        nivelHeredadoId,
        nivelHeredadoHasta,
        ref.id,
      ]
    );

    // Obtener nombre del nivel heredado para la notificación
    let nivelHeredadoNombre = null;
    if (nivelHeredadoId) {
      const { rows: [nl] } = await pool.query(
        `SELECT nombre FROM niveles_lealtad WHERE id=$1`, [nivelHeredadoId]
      );
      nivelHeredadoNombre = nl?.nombre ?? null;
    }

    // Notificación al referidor
    await crearNotificacion({
      empresa_id,
      tipo:            "nuevo_referido",
      titulo:          "¡Referido exitoso! 🎉",
      mensaje:         configRef
        ? `${configRef.descripcion || `Premio: ${configRef.valor} ${configRef.tipo_premio}`}`
        : "Tu amigo hizo su primera compra.",
      seccion:         "referidos",
      referencia_id:   ref.referidor_id,
    });

    // Notificación al amigo sobre su nivel heredado
    if (nivelHeredadoId && nivelHeredadoNombre) {
      await crearNotificacion({
        empresa_id,
        tipo:          "nivel_heredado",
        titulo:        `¡Bienvenido con nivel ${nivelHeredadoNombre}! 🏆`,
        mensaje:       `Gracias a quien te refirió, tienes nivel ${nivelHeredadoNombre} durante tu primer mes. ¡Aprovéchalo!`,
        seccion:       "perfil",
        referencia_id: cliente_id,
      });
    }
  } catch (err) {
    console.error("procesarReferidoPrimeraCompra:", err.message);
    // No debe interrumpir el flujo principal
  }
}
