import pool from "../config/db.js";
import multer from "multer";
import { subirImagen } from "../config/cloudinary.js";

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  tiposPermitidos.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"), false);
};

export const uploadLogo   = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
export const uploadBanner = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// =========================
// GET CONFIGURACIÓN COMPLETA
// =========================
export const getConfiguracion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const empresaResult = await pool.query(
      `SELECT id, nombre, nit, email, telefono, direccion, logo_url, slug,
              descripcion, color_primario, color_secundario, banner_url,
              instagram, whatsapp, facebook, horario,
              hero_titulo, hero_subtitulo, hero_btn_texto,
              nosotros_titulo, nosotros_contenido,
              unidad_predeterminada, fuente, productos_destacados_cantidad,
              footer_texto, COALESCE(iva_porcentaje, 0) AS iva_porcentaje
       FROM empresas WHERE id = $1`,
      [empresa_id]
    );

    if (empresaResult.rows.length === 0) {
      return res.status(404).json({ error: "Empresa no encontrada" });
    }

    const empresa = empresaResult.rows[0];

    const metodosResult = await pool.query(
      `SELECT
         mp.id,
         mp.metodo AS key,
         COALESCE(emp.activo, true) AS activo
       FROM metodo_pago mp
       LEFT JOIN empresa_metodo_pago emp
         ON emp.metodo_id = mp.id AND emp.empresa_id = $1
       ORDER BY mp.id`,
      [empresa_id]
    );

    res.json({
      nombre:             empresa.nombre             || "",
      nit:                empresa.nit                || "",
      email:              empresa.email              || "",
      telefono:           empresa.telefono           || "",
      direccion:          empresa.direccion          || "",
      logoUrl:            empresa.logo_url           || null,
      slug:               empresa.slug               || "",
      descripcion:        empresa.descripcion        || "",
      color_primario:     empresa.color_primario     || "#0F6E56",
      color_secundario:   empresa.color_secundario   || "#0B1628",
      banner_url:         empresa.banner_url         || null,
      instagram:          empresa.instagram          || "",
      whatsapp:           empresa.whatsapp           || "",
      facebook:           empresa.facebook           || "",
      horario:            empresa.horario            || "",
      // ✅ Campos del hero y nosotros
      hero_titulo:        empresa.hero_titulo        || "",
      hero_subtitulo:     empresa.hero_subtitulo     || "",
      hero_btn_texto:     empresa.hero_btn_texto     || "",
      nosotros_titulo:       empresa.nosotros_titulo       || "",
      nosotros_contenido:    empresa.nosotros_contenido    || "",
      unidad_predeterminada:         empresa.unidad_predeterminada         || "unidad",
      fuente:                        empresa.fuente                        || "Inter",
      productos_destacados_cantidad: empresa.productos_destacados_cantidad || 4,
      footer_texto:                  empresa.footer_texto                  || "",
      iva_porcentaje:                Number(empresa.iva_porcentaje)         || 0,
      metodosPago:                   metodosResult.rows,
    });
  } catch (error) {
    console.error("Error en getConfiguracion:", error);
    res.status(500).json({ error: "Error al obtener configuración" });
  }
};

// =========================
// PUT DATOS DE EMPRESA
// =========================
export const updateDatosEmpresa = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const {
      nombre, nit, email, telefono, direccion,
      descripcion, color_primario, color_secundario,
      instagram, whatsapp, facebook, horario,
      hero_titulo, hero_subtitulo, hero_btn_texto,
      nosotros_titulo, nosotros_contenido,
      unidad_predeterminada, fuente, productos_destacados_cantidad,
      footer_texto, iva_porcentaje,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre de la empresa es obligatorio" });
    }

    const result = await pool.query(
      `UPDATE empresas
       SET nombre=$1, nit=$2, email=$3, telefono=$4, direccion=$5,
           descripcion=$6, color_primario=$7, color_secundario=$8,
           instagram=$9, whatsapp=$10, facebook=$11, horario=$12,
           hero_titulo=$13, hero_subtitulo=$14, hero_btn_texto=$15,
           nosotros_titulo=$16, nosotros_contenido=$17,
           unidad_predeterminada=$18, fuente=$19,
           productos_destacados_cantidad=$20, footer_texto=$21,
           iva_porcentaje=$22
       WHERE id=$23
       RETURNING id, nombre, nit, email, telefono, direccion, logo_url,
                 slug, descripcion, color_primario, color_secundario, banner_url,
                 instagram, whatsapp, facebook, horario,
                 hero_titulo, hero_subtitulo, hero_btn_texto,
                 nosotros_titulo, nosotros_contenido,
                 unidad_predeterminada, fuente, productos_destacados_cantidad,
                 footer_texto, COALESCE(iva_porcentaje, 0) AS iva_porcentaje`,
      [
        nombre, nit, email, telefono, direccion,
        descripcion           || null,
        color_primario        || "#0F6E56",
        color_secundario      || "#0B1628",
        instagram             || null,
        whatsapp              || null,
        facebook              || null,
        horario               || null,
        hero_titulo           || null,
        hero_subtitulo        || null,
        hero_btn_texto        || null,
        nosotros_titulo       || null,
        nosotros_contenido    || null,
        unidad_predeterminada || "unidad",
        fuente                || "Inter",
        productos_destacados_cantidad || 4,
        footer_texto          || null,
        Number(iva_porcentaje) || 0,
        empresa_id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en updateDatosEmpresa:", error);
    res.status(500).json({ error: "Error al actualizar datos de empresa" });
  }
};

// =========================
// PUT MÉTODOS DE PAGO
// =========================
export const updateMetodosPago = async (req, res) => {
  const client = await pool.connect();
  try {
    const empresa_id = req.user.empresa_id;
    const { metodos } = req.body;

    if (!Array.isArray(metodos) || metodos.length === 0) {
      return res.status(400).json({ error: "Se requiere un array de métodos" });
    }

    await client.query("BEGIN");

    for (const { key, activo } of metodos) {
      const mp = await client.query(
        "SELECT id FROM metodo_pago WHERE metodo = $1", [key]
      );
      if (mp.rows.length === 0) continue;

      await client.query(
        `INSERT INTO empresa_metodo_pago (empresa_id, metodo_id, activo)
         VALUES ($1, $2, $3)
         ON CONFLICT (empresa_id, metodo_id)
         DO UPDATE SET activo = EXCLUDED.activo`,
        [empresa_id, mp.rows[0].id, activo]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Métodos de pago actualizados correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en updateMetodosPago:", error);
    res.status(500).json({ error: "Error al actualizar métodos de pago" });
  } finally {
    client.release();
  }
};

// =========================
// POST LOGO
// =========================
export const subirLogo = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    const { secure_url: logo_url } = await subirImagen(
      req.file.buffer, "merkai/logos", `logo_empresa_${empresa_id}`
    );

    const result = await pool.query(
      `UPDATE empresas SET logo_url=$1 WHERE id=$2 RETURNING logo_url`,
      [logo_url, empresa_id]
    );

    res.json({ logoUrl: result.rows[0].logo_url });
  } catch (error) {
    console.error("Error en subirLogo:", error);
    res.status(500).json({ error: "Error al subir el logo" });
  }
};

// =========================
// POST BANNER
// =========================
export const subirBanner = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    const { secure_url: banner_url } = await subirImagen(
      req.file.buffer, "merkai/banners", `banner_empresa_${empresa_id}`
    );

    const result = await pool.query(
      `UPDATE empresas SET banner_url=$1 WHERE id=$2 RETURNING banner_url`,
      [banner_url, empresa_id]
    );

    res.json({ bannerUrl: result.rows[0].banner_url });
  } catch (error) {
    console.error("Error en subirBanner:", error);
    res.status(500).json({ error: "Error al subir el banner" });
  }
};
// =========================
// GET LAYOUT
// =========================
export const getLayout = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      "SELECT layout_json FROM empresas WHERE id = $1",
      [empresa_id]
    );

    if (result.rows.length === 0) {
      return res.json([]); // nunca null
    }

    const raw = result.rows[0].layout_json;

    // 🔥 solución real
    if (!raw) {
      return res.json([]);
    }

    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

      // 🔥 asegurar array
      if (!Array.isArray(parsed)) {
        return res.json([]);
      }

      res.json(parsed);
    } catch (e) {
      console.error("JSON inválido en layout:", raw);
      return res.json([]); // fallback seguro
    }

  } catch (error) {
    console.error("Error en getLayout:", error);
    res.status(500).json({ error: "Error al obtener layout" });
  }
};

// =========================
// PUT LAYOUT
// =========================
export const updateLayout = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { layout } = req.body;
    if (!Array.isArray(layout)) {
      return res.status(400).json({ error: "Layout inválido" });
    }
    await pool.query(
      "UPDATE empresas SET layout_json = $1 WHERE id = $2",
      [JSON.stringify(layout), empresa_id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("Error en updateLayout:", error);
    res.status(500).json({ error: "Error al guardar layout" });
  }
};
