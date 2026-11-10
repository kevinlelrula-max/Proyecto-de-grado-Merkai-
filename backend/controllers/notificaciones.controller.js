import pool from "../config/db.js";

// =============================================
// LISTAR NOTIFICACIONES (últimas 50)
// =============================================
export const getNotificaciones = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT id, tipo, titulo, mensaje, leida, seccion, referencia_id, creado_en
       FROM notificaciones
       WHERE empresa_id = $1
       ORDER BY creado_en DESC
       LIMIT 50`,
      [empresa_id]
    );

    const noLeidas = result.rows.filter(n => !n.leida).length;

    res.json({ notificaciones: result.rows, no_leidas: noLeidas });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

// =============================================
// MARCAR UNA COMO LEÍDA
// =============================================
export const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    await pool.query(
      "UPDATE notificaciones SET leida = TRUE WHERE id = $1 AND empresa_id = $2",
      [id, empresa_id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error al marcar notificación" });
  }
};

// =============================================
// MARCAR TODAS COMO LEÍDAS
// =============================================
export const marcarTodasLeidas = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    await pool.query(
      "UPDATE notificaciones SET leida = TRUE WHERE empresa_id = $1 AND leida = FALSE",
      [empresa_id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error al marcar notificaciones" });
  }
};

// =============================================
// ELIMINAR TODAS LAS LEÍDAS
// =============================================
export const limpiarLeidas = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    await pool.query(
      "DELETE FROM notificaciones WHERE empresa_id = $1 AND leida = TRUE",
      [empresa_id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error al limpiar notificaciones" });
  }
};
