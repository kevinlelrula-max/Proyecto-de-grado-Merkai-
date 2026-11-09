import pool from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generarToken } from "../utils/jwt.js";
import { enviarEmailRecuperacion } from "../utils/email.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
    }

    const result = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, p.usuario, p.empresa_id, p.rol_id, p.contrasena,
              p.activo, e.codigo_referido
       FROM persona p
       LEFT JOIN empresas e ON e.id = p.empresa_id
       WHERE p.usuario = $1`,
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];

    if (user.rol_id === 4) {
      return res.status(403).json({ error: "Este usuario no tiene acceso a la plataforma" });
    }

    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (user.activo === false) {
      return res.status(403).json({ error: "Tu usuario está desactivado. Comunícate con el administrador." });
    }

    // Verificar si el usuario tiene múltiples empresas en persona_empresas
    const misEmpresas = await pool.query(
      `SELECT e.id, e.nombre, e.slug, e.logo_url, pe.rol_id
       FROM persona_empresas pe
       JOIN empresas e ON e.id = pe.empresa_id
       WHERE pe.persona_id = $1
       ORDER BY pe.created_at ASC`,
      [user.id]
    );

    const token = generarToken(user);

    res.json({
      token,
      usuario:         user.usuario,
      empresa_id:      user.empresa_id,
      rol_id:          user.rol_id,
      codigo_referido: user.codigo_referido || null,
      mis_empresas:    misEmpresas.rows.length > 1 ? misEmpresas.rows : null,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login" });
  }
};

// Devuelve todas las empresas del usuario autenticado
export const misEmpresas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.nombre, e.slug, e.logo_url, pe.rol_id
       FROM persona_empresas pe
       JOIN empresas e ON e.id = pe.empresa_id
       WHERE pe.persona_id = $1
       ORDER BY pe.created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener empresas" });
  }
};

export const loginGoogle = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Token de Google requerido" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email } = ticket.getPayload();

    const result = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, p.usuario, p.empresa_id, p.rol_id,
              p.activo, e.codigo_referido
       FROM persona p
       LEFT JOIN empresas e ON e.id = p.empresa_id
       WHERE p.usuario = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Este correo no está registrado en Merkai" });
    }

    const user = result.rows[0];
    if (user.rol_id === 4) {
      return res.status(403).json({ error: "Este usuario no tiene acceso a la plataforma" });
    }
    if (user.activo === false) {
      return res.status(403).json({ error: "Tu usuario está desactivado. Comunícate con el administrador." });
    }

    const misEmpresas = await pool.query(
      `SELECT e.id, e.nombre, e.slug, e.logo_url, pe.rol_id
       FROM persona_empresas pe
       JOIN empresas e ON e.id = pe.empresa_id
       WHERE pe.persona_id = $1
       ORDER BY pe.created_at ASC`,
      [user.id]
    );

    const token = generarToken(user);
    res.json({
      token,
      usuario:         user.usuario,
      empresa_id:      user.empresa_id,
      rol_id:          user.rol_id,
      codigo_referido: user.codigo_referido || null,
      mis_empresas:    misEmpresas.rows.length > 1 ? misEmpresas.rows : null,
    });
  } catch (err) {
    console.error("[Google Auth]", err.message);
    res.status(401).json({ error: "No se pudo verificar la cuenta de Google" });
  }
};

// Emite un nuevo token para la empresa seleccionada
export const seleccionarEmpresa = async (req, res) => {
  try {
    const { empresa_id } = req.body;
    const persona_id = req.user.id;

    if (!empresa_id) {
      return res.status(400).json({ error: "empresa_id es obligatorio" });
    }

    // Verificar que el usuario pertenece a esa empresa
    const pertenece = await pool.query(
      `SELECT pe.rol_id, e.codigo_referido, e.slug
       FROM persona_empresas pe
       JOIN empresas e ON e.id = pe.empresa_id
       WHERE pe.persona_id = $1 AND pe.empresa_id = $2`,
      [persona_id, empresa_id]
    );

    if (pertenece.rows.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta empresa" });
    }

    const { rol_id, codigo_referido, slug } = pertenece.rows[0];
    const token = generarToken({ id: persona_id, empresa_id, rol_id });

    res.json({ token, empresa_id, rol_id, codigo_referido, slug });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al seleccionar empresa" });
  }
};

// ── POST /api/auth/recuperar-contrasena ──────────────────────────────────────
// Personal de la empresa (todos los roles menos Cliente). Siempre responde ok para no revelar si la cuenta existe.
export const solicitarRecuperacionEmpresa = async (req, res) => {
  try {
    const usuario = String(req.body?.usuario || "").trim().toLowerCase();
    if (!usuario) return res.status(400).json({ error: "El correo es obligatorio" });

    const { rows } = await pool.query(
      "SELECT id, nombre FROM persona WHERE LOWER(usuario) = $1 AND rol_id <> 4 AND activo IS NOT FALSE",
      [usuario]
    );
    if (rows.length === 0) return res.json({ ok: true });

    const token  = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await pool.query(
      "UPDATE persona SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3",
      [token, expiry, rows[0].id]
    );

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    await enviarEmailRecuperacion(usuario, rows[0].nombre, token, baseUrl, "/empresa/resetear-contrasena");

    res.json({ ok: true });
  } catch (error) {
    console.error("Error solicitarRecuperacionEmpresa:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
};
