import pool from "../config/db.js";

// =========================
// REGISTRAR DEVOLUCIÓN
// =========================
export const crearDevolucion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { tipo, referencia_id, motivo, productos, metodo_reembolso } = req.body;

    if (!tipo || !referencia_id || !motivo || !productos?.length) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (!["venta", "pedido"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo debe ser 'venta' o 'pedido'" });
    }

    const monto_total = productos.reduce(
      (acc, p) => acc + (Number(p.precio_unitario) * Number(p.cantidad)),
      0
    );

    const result = await pool.query(
      `INSERT INTO devoluciones
         (empresa_id, tipo, referencia_id, motivo, productos, monto_total, metodo_reembolso)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [empresa_id, tipo, referencia_id, motivo, JSON.stringify(productos), monto_total, metodo_reembolso || "efectivo"]
    );

    // Restaurar stock de los productos devueltos
    for (const p of productos) {
      if (p.producto_id) {
        await pool.query(
          `UPDATE productos SET stock = stock + $1 WHERE id = $2 AND empresa_id = $3`,
          [Number(p.cantidad), p.producto_id, empresa_id]
        );
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error crearDevolucion:", error);
    res.status(500).json({ error: "Error al registrar devolución" });
  }
};

// =========================
// LISTAR DEVOLUCIONES
// =========================
export const getDevoluciones = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const result = await pool.query(
      `SELECT * FROM devoluciones WHERE empresa_id = $1 ORDER BY created_at DESC`,
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getDevoluciones:", error);
    res.status(500).json({ error: "Error al obtener devoluciones" });
  }
};

// =========================
// DETALLE DE UNA DEVOLUCIÓN
// =========================
export const getDevolucionById = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM devoluciones WHERE id = $1 AND empresa_id = $2`,
      [id, empresa_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Devolución no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error getDevolucionById:", error);
    res.status(500).json({ error: "Error al obtener devolución" });
  }
};
