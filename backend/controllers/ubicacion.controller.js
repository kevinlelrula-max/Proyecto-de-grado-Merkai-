import pool from "../config/db.js";

// GET /api/ubicacion/departamentos
export const getDepartamentos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre FROM departamentos ORDER BY nombre ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener departamentos" });
  }
};

// GET /api/ubicacion/municipios/:id_departamento
export const getMunicipios = async (req, res) => {
  try {
    const { id_departamento } = req.params;
    const result = await pool.query(
      `SELECT id, nombre FROM municipios WHERE id_departamento = $1 ORDER BY nombre ASC`,
      [id_departamento]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener municipios" });
  }
};
