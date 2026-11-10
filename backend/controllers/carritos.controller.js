import pool from "../config/db.js";

// POST /api/carritos/guardar  — llamado desde la tienda (cliente autenticado)
export const guardarCarrito = async (req, res) => {
  try {
    const { empresa_id, cliente_id, cliente_nombre, cliente_email, cliente_telefono, items, total } = req.body;

    if (!empresa_id || !cliente_id) {
      return res.status(400).json({ error: "empresa_id y cliente_id son requeridos" });
    }

    if (!items || items.length === 0) {
      await pool.query(
        "DELETE FROM carritos WHERE empresa_id=$1 AND cliente_id=$2",
        [empresa_id, cliente_id]
      );
      return res.json({ ok: true });
    }

    await pool.query(
      `INSERT INTO carritos
         (empresa_id, cliente_id, cliente_nombre, cliente_email, cliente_telefono, items, total, ultima_actividad, convertido)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),FALSE)
       ON CONFLICT (empresa_id, cliente_id) DO UPDATE SET
         items            = EXCLUDED.items,
         total            = EXCLUDED.total,
         cliente_nombre   = EXCLUDED.cliente_nombre,
         cliente_email    = EXCLUDED.cliente_email,
         cliente_telefono = EXCLUDED.cliente_telefono,
         ultima_actividad = NOW(),
         convertido       = FALSE`,
      [empresa_id, cliente_id, cliente_nombre || null, cliente_email || null, cliente_telefono || null, JSON.stringify(items), total || 0]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("guardarCarrito:", err.message);
    res.status(500).json({ error: "Error al guardar carrito" });
  }
};

// DELETE /api/carritos/limpiar  — cuando el pedido se confirma
export const limpiarCarrito = async (req, res) => {
  try {
    const { empresa_id, cliente_id } = req.body;
    if (!empresa_id || !cliente_id) return res.json({ ok: true });

    await pool.query(
      "UPDATE carritos SET convertido=TRUE WHERE empresa_id=$1 AND cliente_id=$2",
      [empresa_id, cliente_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("limpiarCarrito:", err.message);
    res.status(500).json({ error: "Error al limpiar carrito" });
  }
};

// GET /api/carritos/abandonados  — admin consulta carritos abandonados
export const getCarritosAbandonados = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const horas      = parseInt(req.query.horas) || 2;

    const { rows } = await pool.query(
      `SELECT id, cliente_id, cliente_nombre, cliente_email, cliente_telefono,
              items, total, ultima_actividad, creado_en
       FROM carritos
       WHERE empresa_id = $1
         AND convertido = FALSE
         AND ultima_actividad < NOW() - ($2 || ' hours')::INTERVAL
         AND jsonb_array_length(items) > 0
       ORDER BY ultima_actividad DESC
       LIMIT 100`,
      [empresa_id, horas]
    );

    res.json(rows);
  } catch (err) {
    console.error("getCarritosAbandonados:", err.message);
    res.status(500).json({ error: "Error al obtener carritos" });
  }
};

// GET /api/carritos/resumen  — conteo rápido para el badge del admin
export const getResumenCarritos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(total),0) AS valor_total
       FROM carritos
       WHERE empresa_id=$1
         AND convertido=FALSE
         AND ultima_actividad < NOW() - INTERVAL '2 hours'
         AND jsonb_array_length(items) > 0`,
      [empresa_id]
    );

    res.json({ total: parseInt(rows[0].total), valor_total: parseFloat(rows[0].valor_total) });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
};
