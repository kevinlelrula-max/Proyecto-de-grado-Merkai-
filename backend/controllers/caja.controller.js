import pool from "../config/db.js";

// Una sesión de caja agrupa las ventas del punto de venta hechas entre su apertura y su cierre
// (si sigue abierta, hasta ahora). Solo puede haber una sesión abierta por empresa, así que la
// ventana de tiempo identifica sin ambigüedad las ventas de cada sesión.
//
// Efectivo esperado en caja = monto de apertura + ventas cobradas en efectivo − devoluciones de
// ventas reembolsadas en efectivo. Los pedidos en línea no pasan por la caja y no se cuentan.
const SELECT_SESION_CON_RESUMEN = `
  SELECT cs.*,
         p.nombre AS usuario_nombre,
         r.ventas_total,
         r.ventas_cantidad,
         r.ventas_efectivo,
         d.devoluciones_efectivo,
         (cs.monto_apertura + r.ventas_efectivo - d.devoluciones_efectivo) AS efectivo_esperado
  FROM caja_sesiones cs
  JOIN persona p ON p.id = cs.usuario_id
  CROSS JOIN LATERAL (
    SELECT COALESCE(SUM(v.total), 0)::numeric                                                AS ventas_total,
           COUNT(v.id)::int                                                                   AS ventas_cantidad,
           COALESCE(SUM(v.total) FILTER (WHERE mp.metodo ILIKE 'efectivo'), 0)::numeric       AS ventas_efectivo
    FROM ventas v
    JOIN metodo_pago mp ON mp.id = v.metodo_pago_id
    WHERE v.empresa_id = cs.empresa_id
      AND v.fecha >= cs.fecha_apertura
      AND v.fecha <= COALESCE(cs.fecha_cierre, NOW())
  ) r
  CROSS JOIN LATERAL (
    SELECT COALESCE(SUM(dv.monto_total), 0)::numeric AS devoluciones_efectivo
    FROM devoluciones dv
    WHERE dv.empresa_id = cs.empresa_id
      AND dv.tipo = 'venta'
      AND dv.metodo_reembolso ILIKE 'efectivo'
      AND dv.created_at >= cs.fecha_apertura
      AND dv.created_at <= COALESCE(cs.fecha_cierre, NOW())
  ) d
`;

const sesionConResumen = async (db, sesionId, empresaId) => {
  const { rows } = await db.query(
    `${SELECT_SESION_CON_RESUMEN} WHERE cs.id = $1 AND cs.empresa_id = $2`,
    [sesionId, empresaId]
  );
  if (!rows[0]) return null;

  const { rows: metodos } = await db.query(
    `SELECT mp.metodo, COALESCE(SUM(v.total), 0)::numeric AS total, COUNT(v.id)::int AS cantidad
     FROM ventas v
     JOIN metodo_pago mp ON mp.id = v.metodo_pago_id
     WHERE v.empresa_id = $1
       AND v.fecha >= $2
       AND v.fecha <= COALESCE($3::timestamp, NOW())
     GROUP BY mp.metodo
     ORDER BY total DESC`,
    [empresaId, rows[0].fecha_apertura, rows[0].fecha_cierre]
  );
  return { ...rows[0], por_metodo: metodos };
};

// =========================
// ABRIR SESIÓN DE CAJA
// =========================
export const abrirCaja = async (req, res) => {
  try {
    const empresa_id  = req.user.empresa_id;
    const usuario_id  = req.user.id;
    const monto = Number(req.body?.monto_apertura ?? 0);

    if (!Number.isFinite(monto) || monto < 0) {
      return res.status(400).json({ error: "El monto de apertura no es válido" });
    }

    // Verificar si ya hay una sesión abierta
    const abierta = await pool.query(
      `SELECT id FROM caja_sesiones WHERE empresa_id = $1 AND estado = 'abierta' LIMIT 1`,
      [empresa_id]
    );
    if (abierta.rows.length > 0) {
      return res.status(409).json({ error: "Ya hay una caja abierta", sesion_id: abierta.rows[0].id });
    }

    const result = await pool.query(
      `INSERT INTO caja_sesiones (empresa_id, usuario_id, monto_apertura)
       VALUES ($1, $2, $3) RETURNING *`,
      [empresa_id, usuario_id, monto]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error abrirCaja:", error);
    res.status(500).json({ error: "Error al abrir caja" });
  }
};

// =========================
// CERRAR SESIÓN DE CAJA
// =========================
// El monto de cierre se calcula solo (apertura + ventas en efectivo − devoluciones en efectivo);
// ya no lo escribe el usuario. Solo se recibe una observación opcional.
export const cerrarCaja = async (req, res) => {
  const client = await pool.connect();
  try {
    const empresa_id = req.user.empresa_id;
    const { sesion_id, observaciones } = req.body;

    if (!sesion_id) {
      return res.status(400).json({ error: "sesion_id es obligatorio" });
    }

    await client.query("BEGIN");

    // Bloquea la sesión para que no se cierre dos veces a la vez
    const { rows: [abierta] } = await client.query(
      `SELECT id FROM caja_sesiones
       WHERE id = $1 AND empresa_id = $2 AND estado = 'abierta' FOR UPDATE`,
      [sesion_id, empresa_id]
    );
    if (!abierta) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sesión no encontrada o ya cerrada" });
    }

    const resumen = await sesionConResumen(client, sesion_id, empresa_id);

    await client.query(
      `UPDATE caja_sesiones
       SET estado = 'cerrada', monto_cierre = $1, observaciones = $2, fecha_cierre = NOW()
       WHERE id = $3`,
      [resumen.efectivo_esperado, observaciones?.trim() || null, sesion_id]
    );

    const cerrada = await sesionConResumen(client, sesion_id, empresa_id);
    await client.query("COMMIT");
    res.json(cerrada);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error cerrarCaja:", error);
    res.status(500).json({ error: "Error al cerrar caja" });
  } finally {
    client.release();
  }
};

// =========================
// SESIÓN ACTIVA (con resumen en vivo)
// =========================
export const getSesionActiva = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { rows: [activa] } = await pool.query(
      `SELECT id FROM caja_sesiones
       WHERE empresa_id = $1 AND estado = 'abierta'
       ORDER BY fecha_apertura DESC LIMIT 1`,
      [empresa_id]
    );
    if (!activa) return res.json(null);

    res.json(await sesionConResumen(pool, activa.id, empresa_id));
  } catch (error) {
    console.error("Error getSesionActiva:", error);
    res.status(500).json({ error: "Error al obtener sesión activa" });
  }
};

// =========================
// HISTORIAL DE SESIONES
// =========================
export const getHistorialCaja = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const result = await pool.query(
      `${SELECT_SESION_CON_RESUMEN}
       WHERE cs.empresa_id = $1
       ORDER BY cs.fecha_apertura DESC
       LIMIT 30`,
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getHistorialCaja:", error);
    res.status(500).json({ error: "Error al obtener historial de caja" });
  }
};
