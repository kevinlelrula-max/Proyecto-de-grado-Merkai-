import pool from "../config/db.js";

// ✅ POST — cliente envía mensaje a la empresa
export const enviarMensaje = async (req, res) => {
  try {
    const { empresaId } = req.params;
    const { nombre, email, telefono, mensaje } = req.body;

    if (!nombre || !mensaje) {
      return res.status(400).json({ error: "Nombre y mensaje son obligatorios" });
    }

    // Verificar que la empresa existe
    const empresa = await pool.query(
      "SELECT id FROM empresas WHERE id = $1",
      [empresaId]
    );
    if (empresa.rows.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const result = await pool.query(
      `INSERT INTO mensajes_contacto (empresa_id, nombre, email, telefono, mensaje)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, fecha`,
      [empresaId, nombre, email || null, telefono || null, mensaje]
    );

    res.json({
      message: "Mensaje enviado correctamente",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error enviarMensaje:", error);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
};

// ✅ GET — empresa ve sus mensajes (requiere token)
export const getMensajes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT id, nombre, email, telefono, mensaje, leido, fecha
       FROM mensajes_contacto
       WHERE empresa_id = $1
       ORDER BY fecha DESC`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getMensajes:", error);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

// ✅ PUT — marcar mensaje como leído
export const marcarLeido = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id } = req.params;

    await pool.query(
      `UPDATE mensajes_contacto SET leido = true
       WHERE id = $1 AND empresa_id = $2`,
      [id, empresa_id]
    );

    res.json({ message: "Mensaje marcado como leído" });
  } catch (error) {
    console.error("Error marcarLeido:", error);
    res.status(500).json({ error: "Error al marcar mensaje" });
  }
};

// ✅ GET — contar mensajes no leídos (para el badge del dashboard)
export const getMensajesNoLeidos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT COUNT(*) AS total FROM mensajes_contacto
       WHERE empresa_id = $1 AND leido = false`,
      [empresa_id]
    );

    res.json({ total: parseInt(result.rows[0].total) });
  } catch (error) {
    console.error("Error getMensajesNoLeidos:", error);
    res.status(500).json({ error: "Error al contar mensajes" });
  }
};

// routes/contacto.routes.js
