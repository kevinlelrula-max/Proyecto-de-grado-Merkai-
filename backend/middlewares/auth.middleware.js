import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const verificarToken = async (req, res, next) => {
  let decoded;
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No autorizado" });
    }

    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }

  // El token dura 8 h: sin esto un usuario desactivado o eliminado seguiría operando hasta que venza
  try {
    const { rows: [persona] } = await pool.query(
      "SELECT activo FROM persona WHERE id = $1", [decoded.id]
    );
    if (!persona || persona.activo === false) {
      return res.status(401).json({ error: "Tu usuario está desactivado o ya no existe" });
    }
  } catch (error) {
    console.error("Error verificando estado del usuario:", error);
    return res.status(500).json({ error: "Error de autenticación" });
  }

  req.user = decoded;
  next();
};
