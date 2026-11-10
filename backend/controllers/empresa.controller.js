import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { generarToken } from "../utils/jwt.js";

// ✅ Genera código de referido único tipo "REF-ABC123"
const generarCodigoReferido = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "REF-";
  for (let i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

// ✅ Genera slug a partir del nombre de la empresa
const generarSlug = (nombre) => {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
};

export const registrarEmpresa = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      nombre, nit, email, telefono,
      codigo_referido_usado,
      admin_nombre: nombre_admin,
      admin_apellido: apellido_admin,
      admin_usuario: usuario,
      admin_contrasena: contrasena,
      admin_telefono: telefono_admin,
      admin_direccion: direccion,
      admin_tipo_documento: tipo_documento,
      admin_numero_documento: numero_documento,
      admin_id_municipio: id_municipio
    } = req.body;

    if (!nombre || !usuario || !contrasena) {
      return res.status(400).json({ error: "Nombre empresa, usuario y contraseña son obligatorios" });
    }

    await client.query("BEGIN");

    // ✅ Generar código de referido único
    let codigoReferido;
    let intentos = 0;
    do {
      codigoReferido = generarCodigoReferido();
      const existe = await client.query(
        "SELECT id FROM empresas WHERE codigo_referido = $1", [codigoReferido]
      );
      if (existe.rows.length === 0) break;
      intentos++;
    } while (intentos < 5);

    // ✅ Generar slug único — si ya existe agregar sufijo numérico
    let slug = generarSlug(nombre);
    let slugFinal = slug;
    let sufijo = 1;
    while (true) {
      const existeSlug = await client.query(
        "SELECT id FROM empresas WHERE slug = $1", [slugFinal]
      );
      if (existeSlug.rows.length === 0) break;
      slugFinal = `${slug}-${sufijo}`;
      sufijo++;
    }

    // 🏢 CREAR EMPRESA
    const empresaResult = await client.query(
      `INSERT INTO empresas (nombre, nit, email, telefono, codigo_referido, slug)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [nombre, nit, email, telefono, codigoReferido, slugFinal]
    );

    const empresa = empresaResult.rows[0];

    // ✅ Si vino con código de referido crear solicitud de vinculación
    if (codigo_referido_usado) {
      const empresaOrigen = await client.query(
        "SELECT id FROM empresas WHERE codigo_referido = $1", [codigo_referido_usado]
      );
      if (empresaOrigen.rows.length > 0) {
        await client.query(
          `INSERT INTO referidos (empresa_origen_id, empresa_referida_id, estado)
           VALUES ($1, $2, 'pendiente')`,
          [empresaOrigen.rows[0].id, empresa.id]
        );
      }
    }

    // 🔐 HASH CONTRASEÑA
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // 👤 CREAR ADMIN
    const usuarioResult = await client.query(
      `INSERT INTO persona (
        empresa_id, nombre, apellido, usuario, contrasena,
        telefono, direccion, tipo_documento,
        numero_documento, rol_id, id_municipio
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,2,$10)
      RETURNING *`,
      [empresa.id, nombre_admin, apellido_admin, usuario, hashedPassword,
       telefono_admin, direccion, tipo_documento, numero_documento, id_municipio]
    );

    const admin = usuarioResult.rows[0];

    // Quien registra la empresa es su propietario (protegido frente a otros administradores)
    await client.query("UPDATE empresas SET propietario_id = $1 WHERE id = $2", [admin.id, empresa.id]);

    const token = generarToken({ id: admin.id, empresa_id: admin.empresa_id, rol_id: admin.rol_id });

    await client.query("COMMIT");

    res.json({
      message:         "Empresa registrada correctamente 🚀",
      token,
      usuario:         admin.usuario,
      empresa_id:      admin.empresa_id,
      rol_id:          admin.rol_id,
      codigo_referido: codigoReferido,
      slug:            slugFinal, // ✅ para generar el link de la vitrina
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR REGISTRO:", error);
    if (error.code === "23505") return res.status(400).json({ error: "El usuario o la empresa ya existen" });
    if (error.code === "23503") return res.status(400).json({ error: "Municipio inválido" });
    res.status(500).json({ error: "Error interno al registrar empresa" });
  } finally {
    client.release();
  }
};

export const getEmpresasPublicas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, nit, email, telefono, slug FROM empresas ORDER BY nombre ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ ERROR getEmpresasPublicas:", error);
    res.status(500).json({ error: "Error al obtener empresas" });
  }
};

// ✅ EMP2 envía solicitud de vinculación a EMP1
export const solicitarVinculacion = async (req, res) => {
  try {
    const empresa_solicitante_id = req.user.empresa_id;
    const { empresa_origen_id } = req.body;

    if (empresa_solicitante_id === empresa_origen_id) {
      return res.status(400).json({ error: "No puedes vincularte contigo mismo" });
    }

    const existe = await pool.query(
      `SELECT id FROM referidos 
       WHERE empresa_origen_id = $1 AND empresa_referida_id = $2
       AND estado IN ('pendiente', 'aceptado')`,
      [empresa_origen_id, empresa_solicitante_id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe una solicitud o vínculo con esta empresa" });
    }

    const result = await pool.query(
      `INSERT INTO referidos (empresa_origen_id, empresa_referida_id, estado)
       VALUES ($1, $2, 'pendiente') RETURNING *`,
      [empresa_origen_id, empresa_solicitante_id]
    );

    res.json({ message: "Solicitud enviada correctamente", solicitud: result.rows[0] });
  } catch (error) {
    console.error("❌ ERROR solicitarVinculacion:", error);
    res.status(500).json({ error: "Error al enviar solicitud" });
  }
};

// ✅ EMP1 ve sus solicitudes
export const getSolicitudesVinculacion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const result = await pool.query(
      `SELECT r.id, r.estado, r.fecha,
              e.id as empresa_id, e.nombre, e.nit, e.email, e.telefono
       FROM referidos r
       JOIN empresas e ON e.id = r.empresa_referida_id
       WHERE r.empresa_origen_id = $1
       ORDER BY r.fecha DESC`,
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ ERROR getSolicitudes:", error);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
};

// ✅ EMP1 acepta o rechaza una solicitud
export const responderSolicitud = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id } = req.params;
    const { estado } = req.body;

    if (!['aceptado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const result = await pool.query(
      `UPDATE referidos SET estado = $1
       WHERE id = $2 AND empresa_origen_id = $3 RETURNING *`,
      [estado, id, empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    res.json({ message: `Solicitud ${estado} correctamente`, solicitud: result.rows[0] });
  } catch (error) {
    console.error("❌ ERROR responderSolicitud:", error);
    res.status(500).json({ error: "Error al responder solicitud" });
  }
};

// ✅ Ver mi red de empresas vinculadas
export const getMiRed = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const result = await pool.query(
      `SELECT e.id, e.nombre, e.nit, e.telefono, e.slug, r.fecha
       FROM referidos r
       JOIN empresas e ON e.id = r.empresa_referida_id
       WHERE r.empresa_origen_id = $1 AND r.estado = 'aceptado'
       ORDER BY r.fecha DESC`,
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ ERROR getMiRed:", error);
    res.status(500).json({ error: "Error al obtener red" });
  }
};

// Crea una nueva empresa y la vincula al usuario autenticado
export const crearTiendaAdicional = async (req, res) => {
  const client = await pool.connect();
  try {
    const persona_id = req.user.id;
    const { nombre, nit, email, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre de la tienda es obligatorio" });
    }

    await client.query("BEGIN");

    // Código de referido único
    let codigoReferido;
    let intentos = 0;
    do {
      codigoReferido = generarCodigoReferido();
      const existe = await client.query(
        "SELECT id FROM empresas WHERE codigo_referido = $1", [codigoReferido]
      );
      if (existe.rows.length === 0) break;
      intentos++;
    } while (intentos < 5);

    // Slug único
    let slug = generarSlug(nombre);
    let slugFinal = slug;
    let sufijo = 1;
    while (true) {
      const existeSlug = await client.query(
        "SELECT id FROM empresas WHERE slug = $1", [slugFinal]
      );
      if (existeSlug.rows.length === 0) break;
      slugFinal = `${slug}-${sufijo}`;
      sufijo++;
    }

    // Crear empresa
    const empresaResult = await client.query(
      `INSERT INTO empresas (nombre, nit, email, telefono, codigo_referido, slug)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, nit || null, email || null, telefono || null, codigoReferido, slugFinal]
    );
    const empresa = empresaResult.rows[0];

    // Quien crea una tienda nueva es su propietario y Administrador en ella
    const rol_id = 2;
    await client.query("UPDATE empresas SET propietario_id = $1 WHERE id = $2", [persona_id, empresa.id]);

    // Vincular usuario a la nueva empresa
    await client.query(
      `INSERT INTO persona_empresas (persona_id, empresa_id, rol_id)
       VALUES ($1, $2, $3)`,
      [persona_id, empresa.id, rol_id]
    );

    const token = generarToken({ id: persona_id, empresa_id: empresa.id, rol_id });

    await client.query("COMMIT");

    res.json({
      message:         "Tienda creada correctamente",
      token,
      empresa_id:      empresa.id,
      rol_id,
      codigo_referido: codigoReferido,
      slug:            slugFinal,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR crearTiendaAdicional:", error);
    if (error.code === "23505") return res.status(400).json({ error: "Ya existe una empresa con ese nombre o slug" });
    res.status(500).json({ error: "Error al crear la tienda" });
  } finally {
    client.release();
  }
};

// ✅ Buscar empresa por slug — para cargar la tienda por link directo
export const getEmpresaPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
  `SELECT id, nombre, nit, telefono, email, slug, logo_url,
          descripcion, color_primario, color_secundario, banner_url,
          instagram, whatsapp, facebook, horario,
          hero_titulo, hero_subtitulo, hero_btn_texto,
          nosotros_titulo, nosotros_contenido,
          fuente, productos_destacados_cantidad, footer_texto, layout_json
   FROM empresas WHERE slug = $1`,
  [slug]
);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }
    const row = result.rows[0];
    res.json({
      ...row,
      layout: row.layout_json ? JSON.parse(row.layout_json) : null,
      layout_json: undefined,
    });
  } catch (error) {
    console.error("❌ ERROR getEmpresaPorSlug:", error);
    res.status(500).json({ error: "Error al obtener empresa" });
  }
};