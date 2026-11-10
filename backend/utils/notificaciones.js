import pool from "../config/db.js";

/**
 * Crea una notificación para una empresa.
 * Se llama desde cualquier controller cuando ocurre un evento relevante.
 *
 * @param {object} opts
 * @param {number} opts.empresa_id
 * @param {string} opts.tipo          — nuevo_pedido | stock_bajo | nuevo_cliente | pedido_entregado | pedido_cancelado | cupon_por_vencer
 * @param {string} opts.titulo        — texto corto (max 200 chars)
 * @param {string} [opts.mensaje]     — detalle adicional
 * @param {string} [opts.seccion]     — key del dashboard para navegar al hacer clic
 * @param {number} [opts.referencia_id] — id del recurso relacionado
 */
export async function crearNotificacion({ empresa_id, tipo, titulo, mensaje, seccion, referencia_id }) {
  try {
    await pool.query(
      `INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, seccion, referencia_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [empresa_id, tipo, titulo, mensaje || null, seccion || null, referencia_id || null]
    );
  } catch (err) {
    // No debe romper el flujo principal
    console.error("Error crearNotificacion:", err.message);
  }
}
