import pool from "../config/db.js";

// =============================================
// CREAR RESEÑA (cliente autenticado)
// =============================================
export const crearReseña = async (req, res) => {
  try {
    const cliente_id = req.user.id;
    const { producto_id, calificacion, comentario } = req.body;

    if (!producto_id || !calificacion) {
      return res.status(400).json({ error: "producto_id y calificacion son requeridos" });
    }
    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: "La calificación debe ser entre 1 y 5" });
    }

    // Obtener empresa_id del producto
    const prod = await pool.query(
      "SELECT empresa_id FROM productos WHERE id = $1", [producto_id]
    );
    if (!prod.rows.length) return res.status(404).json({ error: "Producto no encontrado" });
    const empresa_id = prod.rows[0].empresa_id;

    const result = await pool.query(
      `INSERT INTO reseñas (producto_id, cliente_id, empresa_id, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (producto_id, cliente_id)
       DO UPDATE SET calificacion = $4, comentario = $5, creado_en = NOW()
       RETURNING *`,
      [producto_id, cliente_id, empresa_id, calificacion, comentario || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error crearReseña:", error);
    res.status(500).json({ error: "Error al guardar la reseña" });
  }
};

// =============================================
// LISTAR RESEÑAS DE UN PRODUCTO (público)
// =============================================
export const getReseñasProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const result = await pool.query(
      `SELECT
         r.id,
         r.calificacion,
         r.comentario,
         r.creado_en,
         per.nombre || ' ' || per.apellido AS cliente_nombre
       FROM reseñas r
       JOIN persona per ON per.id = r.cliente_id
       WHERE r.producto_id = $1 AND r.activo = TRUE
       ORDER BY r.creado_en DESC`,
      [producto_id]
    );

    // Estadísticas
    const stats = await pool.query(
      `SELECT
         COUNT(*)                        AS total,
         ROUND(AVG(calificacion), 1)     AS promedio,
         COUNT(*) FILTER (WHERE calificacion = 5) AS cinco,
         COUNT(*) FILTER (WHERE calificacion = 4) AS cuatro,
         COUNT(*) FILTER (WHERE calificacion = 3) AS tres,
         COUNT(*) FILTER (WHERE calificacion = 2) AS dos,
         COUNT(*) FILTER (WHERE calificacion = 1) AS uno
       FROM reseñas
       WHERE producto_id = $1 AND activo = TRUE`,
      [producto_id]
    );

    res.json({ reseñas: result.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error("Error getReseñasProducto:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
};

// =============================================
// LISTAR TODAS LAS RESEÑAS (empresa admin)
// =============================================
export const getReseñasEmpresa = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT
         r.id,
         r.calificacion,
         r.comentario,
         r.activo,
         r.creado_en,
         p.nombre      AS producto_nombre,
         per.nombre || ' ' || per.apellido AS cliente_nombre
       FROM reseñas r
       JOIN productos p  ON p.id  = r.producto_id
       JOIN persona per  ON per.id = r.cliente_id
       WHERE r.empresa_id = $1
       ORDER BY r.creado_en DESC`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getReseñasEmpresa:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
};

// =============================================
// RESEÑAS DESTACADAS (público — tienda)
// =============================================
export const getReseñasDestacadas = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    const result = await pool.query(
      `SELECT
         r.id,
         r.calificacion,
         r.comentario,
         r.creado_en,
         p.nombre AS producto_nombre,
         per.nombre || ' ' || per.apellido AS cliente_nombre
       FROM reseñas r
       JOIN productos p  ON p.id  = r.producto_id
       JOIN persona per  ON per.id = r.cliente_id
       WHERE r.empresa_id = $1 AND r.activo = TRUE AND r.calificacion >= 4
       ORDER BY r.calificacion DESC, r.creado_en DESC
       LIMIT 6`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getReseñasDestacadas:", error);
    res.status(500).json({ error: "Error al obtener reseñas destacadas" });
  }
};

// =============================================
// TOGGLE ACTIVO (moderar — empresa admin)
// =============================================
export const toggleReseña = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `UPDATE reseñas SET activo = NOT activo
       WHERE id = $1 AND empresa_id = $2
       RETURNING id, activo`,
      [id, empresa_id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Reseña no encontrada" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al moderar reseña" });
  }
};

// =============================================
// ELIMINAR RESEÑA (empresa admin)
// =============================================
export const eliminarReseña = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    await pool.query(
      "DELETE FROM reseñas WHERE id = $1 AND empresa_id = $2",
      [id, empresa_id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar reseña" });
  }
};

// =============================================
// VER RESEÑA DEL CLIENTE PARA UN PRODUCTO
// =============================================
export const getMiReseña = async (req, res) => {
  try {
    const cliente_id   = req.user.id;
    const { producto_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM reseñas WHERE producto_id = $1 AND cliente_id = $2",
      [producto_id, cliente_id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reseña" });
  }
};
