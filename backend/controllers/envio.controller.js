import pool from "../config/db.js";

// =========================
// GET CONFIG DE ENVÍO (pública — para el carrito)
// =========================
export const getConfigEnvioPublico = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    const result = await pool.query(
      `SELECT envio_costo, envio_costos_departamentos
       FROM empresas WHERE id = $1`,
      [empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    res.json({
      costo_defecto:           parseFloat(result.rows[0].envio_costo) || 0,
      costos_departamentos: result.rows[0].envio_costos_departamentos || {},
    });
  } catch (error) {
    console.error("Error getConfigEnvioPublico:", error);
    res.status(500).json({ error: "Error al obtener config de envío" });
  }
};

// =========================
// GET CONFIG DE ENVÍO (privada — para el admin)
// =========================
export const getConfigEnvio = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT envio_costo, envio_costos_departamentos
       FROM empresas WHERE id = $1`,
      [empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    res.json({
      costo_defecto:        parseFloat(result.rows[0].envio_costo) || 0,
      costos_departamentos: result.rows[0].envio_costos_departamentos || {},
    });
  } catch (error) {
    console.error("Error getConfigEnvio:", error);
    res.status(500).json({ error: "Error al obtener config de envío" });
  }
};

// =========================
// PUT CONFIG DE ENVÍO (admin)
// =========================
export const updateConfigEnvio = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { costo_defecto, costos_departamentos } = req.body;

    if (costo_defecto === undefined || costo_defecto < 0) {
      return res.status(400).json({ error: "El costo de envío debe ser mayor o igual a 0" });
    }

    await pool.query(
      `UPDATE empresas
       SET envio_costo = $1, envio_costos_departamentos = $2
       WHERE id = $3`,
      [costo_defecto, costos_departamentos || {}, empresa_id]
    );

    res.json({ ok: true, costo_defecto, costos_departamentos });
  } catch (error) {
    console.error("Error updateConfigEnvio:", error);
    res.status(500).json({ error: "Error al guardar config de envío" });
  }
};