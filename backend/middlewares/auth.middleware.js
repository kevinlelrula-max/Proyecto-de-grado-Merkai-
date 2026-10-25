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

// Autorización por sección: SuperAdmin y Administrador tienen acceso total; el resto de roles
// necesita la sección en rol_permisos (la misma tabla que arma el menú del panel).
const ROLES_ADMIN = [1, 2];

export const requierePermiso = (seccion) => async (req, res, next) => {
  if (ROLES_ADMIN.includes(req.user?.rol_id)) return next();
  try {
    const { rows } = await pool.query(
      "SELECT 1 FROM rol_permisos WHERE rol_id = $1 AND seccion = $2 LIMIT 1",
      [req.user?.rol_id, seccion]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: "No tienes permisos para acceder a esta sección" });
    }
    next();
  } catch (error) {
    console.error("Error verificando permiso:", error);
    res.status(500).json({ error: "Error de autorización" });
  }
};
