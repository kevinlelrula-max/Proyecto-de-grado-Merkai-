import pool from "../config/db.js";
import crypto from "crypto";

// ── Encriptación AES-256-CBC ─────────────────────────────────────────────────
// La clave de encriptación viene de la variable de entorno ENCRYPTION_KEY
// Debe ser una cadena de 32 caracteres (256 bits)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "fishware_default_key_32chars!!!x";
const IV_LENGTH      = 16;

function encriptar(texto) {
  if (!texto) return null;
  const iv        = crypto.randomBytes(IV_LENGTH);
  const cipher    = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(texto), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function desencriptar(textoEncriptado) {
  if (!textoEncriptado) return null;
  try {
    const [ivHex, encryptedHex] = textoEncriptado.split(":");
    const iv        = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher  = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
  } catch {
    return null;
  }
}

// =========================
// GET /api/integraciones
// Lista integraciones de la empresa (sin exponer llave privada)
// =========================
export const getIntegraciones = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT id, proveedor, llave_publica, activo, fecha_conexion,
              CASE WHEN llave_privada IS NOT NULL THEN true ELSE false END AS tiene_llave_privada
       FROM empresa_integraciones
       WHERE empresa_id = $1
       ORDER BY proveedor`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getIntegraciones:", error);
    res.status(500).json({ error: "Error al obtener integraciones" });
  }
};

// =========================
// POST /api/integraciones
// Conectar o actualizar una integración
// =========================
export const guardarIntegracion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { proveedor, llave_publica, llave_privada } = req.body;

    const proveedoresValidos = ["wompi", "stripe", "payu", "mercadopago"];
    if (!proveedoresValidos.includes(proveedor)) {
      return res.status(400).json({ error: "Proveedor no válido" });
    }

    if (!llave_publica) {
      return res.status(400).json({ error: "La llave pública es requerida" });
    }

    // Verificar si ya existe una integración para este proveedor
    const existente = await pool.query(
      `SELECT id FROM empresa_integraciones WHERE empresa_id = $1 AND proveedor = $2`,
      [empresa_id, proveedor]
    );
    const yaExiste = existente.rows.length > 0;

    // En nueva conexión, la llave privada es obligatoria
    if (!yaExiste && !llave_privada) {
      return res.status(400).json({ error: "La llave privada es requerida para conectar" });
    }

    let result;
    if (llave_privada) {
      // Actualizar ambas llaves
      const llavePrivadaEncriptada = encriptar(llave_privada);
      result = await pool.query(
        `INSERT INTO empresa_integraciones (empresa_id, proveedor, llave_publica, llave_privada, activo, fecha_conexion)
         VALUES ($1, $2, $3, $4, true, NOW())
         ON CONFLICT (empresa_id, proveedor)
         DO UPDATE SET
           llave_publica  = EXCLUDED.llave_publica,
           llave_privada  = EXCLUDED.llave_privada,
           activo         = true,
           fecha_conexion = NOW()
         RETURNING id, proveedor, llave_publica, activo, fecha_conexion`,
        [empresa_id, proveedor, llave_publica, llavePrivadaEncriptada]
      );
    } else {
      // Solo actualizar llave pública, conservar la privada existente
      result = await pool.query(
        `UPDATE empresa_integraciones
         SET llave_publica = $3, activo = true, fecha_conexion = NOW()
         WHERE empresa_id = $1 AND proveedor = $2
         RETURNING id, proveedor, llave_publica, activo, fecha_conexion`,
        [empresa_id, proveedor, llave_publica]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error guardarIntegracion:", error);
    res.status(500).json({ error: "Error al guardar integración" });
  }
};

// =========================
// PATCH /api/integraciones/:proveedor/toggle
// Activar / desactivar sin borrar las llaves
// =========================
export const toggleIntegracion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { proveedor } = req.params;

    const result = await pool.query(
      `UPDATE empresa_integraciones
       SET activo = NOT activo
       WHERE empresa_id = $1 AND proveedor = $2
       RETURNING id, proveedor, activo`,
      [empresa_id, proveedor]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Integración no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error toggleIntegracion:", error);
    res.status(500).json({ error: "Error al cambiar estado de integración" });
  }
};

// =========================
// DELETE /api/integraciones/:proveedor
// Desconectar — elimina las llaves
// =========================
export const eliminarIntegracion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { proveedor } = req.params;

    await pool.query(
      `DELETE FROM empresa_integraciones
       WHERE empresa_id = $1 AND proveedor = $2`,
      [empresa_id, proveedor]
    );

    res.json({ message: "Integración desconectada" });
  } catch (error) {
    console.error("Error eliminarIntegracion:", error);
    res.status(500).json({ error: "Error al desconectar integración" });
  }
};

// =========================
// GET /api/integraciones/publicas/:empresa_id
// Pasarelas activas de una empresa (para mostrar en el checkout)
// Solo retorna llave PÚBLICA — nunca la privada
// =========================
export const getIntegracionesPublicas = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    const result = await pool.query(
      `SELECT proveedor, llave_publica
       FROM empresa_integraciones
       WHERE empresa_id = $1 AND activo = true
       ORDER BY proveedor`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getIntegracionesPublicas:", error);
    res.status(500).json({ error: "Error al obtener pasarelas" });
  }
};

// =========================
// Función interna (no es ruta) — para usar en el procesamiento de pagos
// Obtiene la llave privada desencriptada de una empresa
// =========================
export const getLlavePrivada = async (empresa_id, proveedor) => {
  try {
    const result = await pool.query(
      `SELECT llave_privada FROM empresa_integraciones
       WHERE empresa_id = $1 AND proveedor = $2 AND activo = true`,
      [empresa_id, proveedor]
    );

    if (result.rows.length === 0) return null;
    return desencriptar(result.rows[0].llave_privada);
  } catch {
    return null;
  }
};