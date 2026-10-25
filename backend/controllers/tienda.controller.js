import pool from "../config/db.js";

// =========================
// GET /api/tienda/empresas
// Lista pública de empresas
// =========================
export const getEmpresasPublicas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, nit, email, telefono, direccion, logo_url
       FROM empresas
       ORDER BY nombre ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getEmpresasPublicas:", error);
    res.status(500).json({ error: "Error al obtener empresas" });
  }
};

// =========================
// GET /api/tienda/empresas/:id
// Detalle público de una empresa
// =========================
export const getEmpresaPublica = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, nombre, nit, email, telefono, direccion, logo_url
       FROM empresas
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getEmpresaPublica:", error);
    res.status(500).json({ error: "Error al obtener empresa" });
  }
};

// =========================
// GET /api/tienda/empresas/:id/productos
// Catálogo público de productos de una empresa
// Solo muestra productos con stock > 0
// =========================
export const getProductosPublicos = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la empresa existe
    const empresa = await pool.query(
      "SELECT id FROM empresas WHERE id = $1",
      [id]
    );
    if (!empresa.rows.length) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const result = await pool.query(
      `SELECT 
         p.id,
         p.nombre,
         p.precio,
         p.stock,
         p.imagen_url,
         p.categoria_id,
         c.nombre AS categoria
       FROM productos p
       LEFT JOIN categoria c ON c.id = p.categoria_id
       WHERE p.empresa_id = $1
         AND p.activo
         AND p.stock > 0
       ORDER BY c.nombre ASC, p.nombre ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getProductosPublicos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};
