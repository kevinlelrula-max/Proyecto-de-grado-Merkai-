import pool from "../config/db.js";
import multer from "multer";
import { subirImagen } from "../config/cloudinary.js";
import { getNivelLealtadCliente } from "../utils/calcularPedido.js";

// =========================
// CONFIGURACIÓN DE MULTER
// =========================
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  tiposPermitidos.includes(file.mimetype) ? cb(null, true) : cb(new Error("Solo JPG, PNG o WEBP"), false);
};

export const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

// =========================
// GET PRODUCTOS (dashboard)
// =========================
export const getProductos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const result = await pool.query(
      `SELECT p.id, p.empresa_id, p.nombre, p.descripcion, p.precio, p.precio_costo,
              p.ganancia_porcentaje, p.precio_mayoreo, p.stock, p.stock_minimo,
              p.stock_maximo, p.unidad, p.codigo_barras, p.categoria_id, p.imagen_url,
              p.activo,
              COALESCE(
                json_agg(json_build_object('id', pi.id, 'url', pi.url) ORDER BY pi.orden)
                FILTER (WHERE pi.id IS NOT NULL), '[]'
              ) AS imagenes
       FROM productos p
       LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
       WHERE p.empresa_id = $1
       GROUP BY p.id
       ORDER BY p.activo DESC, p.nombre ASC`,
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

// =========================
// CREAR PRODUCTO
// =========================
export const crearProducto = async (req, res) => {
  try {
    const {
      nombre, descripcion, precio, precio_costo,
      ganancia_porcentaje, precio_mayoreo,
      stock, stock_minimo, stock_maximo,
      unidad, codigo_barras, categoria_id
    } = req.body;

    const empresa_id = req.user.empresa_id;
    const files      = req.files || [];

    const urls = await Promise.all(
      files.map(f => subirImagen(f.buffer, "merkai/productos").then(r => r.secure_url))
    );
    const imagen_url = urls[0] || null;

    const result = await pool.query(
      `INSERT INTO productos (
        empresa_id, nombre, descripcion, precio, precio_costo,
        ganancia_porcentaje, precio_mayoreo, stock, stock_minimo,
        stock_maximo, unidad, codigo_barras, categoria_id, imagen_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        empresa_id,
        nombre,
        descripcion         || null,
        precio,
        precio_costo        || null,
        ganancia_porcentaje || null,
        precio_mayoreo      || null,
        stock               || 0,
        stock_minimo        || 0,
        stock_maximo        || null,
        unidad              || "unidad",
        codigo_barras       || null,
        categoria_id        || null,
        imagen_url,
      ]
    );

    const productoId = result.rows[0].id;
    for (let i = 0; i < urls.length; i++) {
      await pool.query(
        "INSERT INTO producto_imagenes (producto_id, url, orden) VALUES ($1, $2, $3)",
        [productoId, urls[i], i]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error crearProducto:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

// =========================
// ACTUALIZAR PRODUCTO
// =========================
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    const {
      nombre, descripcion, precio, precio_costo,
      ganancia_porcentaje, precio_mayoreo,
      stock, stock_minimo, stock_maximo,
      unidad, codigo_barras, categoria_id
    } = req.body;

    const files = req.files || [];
    const newUrls = await Promise.all(
      files.map(f => subirImagen(f.buffer, "merkai/productos").then(r => r.secure_url))
    );
    const imagen_url = newUrls[0] || null;

    const query = imagen_url
      ? `UPDATE productos
         SET nombre=$1, descripcion=$2, precio=$3, precio_costo=$4,
             ganancia_porcentaje=$5, precio_mayoreo=$6, stock=$7,
             stock_minimo=$8, stock_maximo=$9, unidad=$10,
             codigo_barras=$11, categoria_id=$12, imagen_url=$13
         WHERE id=$14 AND empresa_id=$15 RETURNING *`
      : `UPDATE productos
         SET nombre=$1, descripcion=$2, precio=$3, precio_costo=$4,
             ganancia_porcentaje=$5, precio_mayoreo=$6, stock=$7,
             stock_minimo=$8, stock_maximo=$9, unidad=$10,
             codigo_barras=$11, categoria_id=$12
         WHERE id=$13 AND empresa_id=$14 RETURNING *`;

    const params = imagen_url
      ? [nombre, descripcion || null, precio, precio_costo || null,
         ganancia_porcentaje || null, precio_mayoreo || null,
         stock || 0, stock_minimo || 0, stock_maximo || null,
         unidad || "unidad", codigo_barras || null, categoria_id || null,
         imagen_url, id, empresa_id]
      : [nombre, descripcion || null, precio, precio_costo || null,
         ganancia_porcentaje || null, precio_mayoreo || null,
         stock || 0, stock_minimo || 0, stock_maximo || null,
         unidad || "unidad", codigo_barras || null, categoria_id || null,
         id, empresa_id];

    const result = await pool.query(query, params);

    // Insertar nuevas imágenes al final del orden existente
    if (newUrls.length > 0) {
      const { rows: existing } = await pool.query(
        "SELECT COUNT(*) AS c FROM producto_imagenes WHERE producto_id = $1", [id]
      );
      const offset = parseInt(existing[0].c);
      for (let i = 0; i < newUrls.length; i++) {
        await pool.query(
          "INSERT INTO producto_imagenes (producto_id, url, orden) VALUES ($1, $2, $3)",
          [id, newUrls[i], offset + i]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizarProducto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

// =========================
// ELIMINAR PRODUCTO
// =========================
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const prod = await pool.query(
      "SELECT imagen_url FROM productos WHERE id = $1 AND empresa_id = $2",
      [id, empresa_id]
    );
    if (!prod.rows.length) return res.status(404).json({ error: "Producto no encontrado" });

    // Con ventas o pedidos se desactiva en vez de borrar, para no romper el historial ni los reportes
    const { rows: [historial] } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM detalle_venta         WHERE producto_id = $1)::int AS ventas,
              (SELECT COUNT(*) FROM detalle_pedido_online WHERE producto_id = $1)::int AS pedidos`,
      [id]
    );
    if (historial.ventas > 0 || historial.pedidos > 0) {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: `El producto aparece en ${historial.ventas} venta(s) y ${historial.pedidos} pedido(s). ` +
               "Desactívalo para ocultarlo de la tienda y del POS.",
      });
    }

    await pool.query("DELETE FROM productos WHERE id = $1 AND empresa_id = $2", [id, empresa_id]);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: "El producto tiene registros asociados. Desactívalo para ocultarlo de la tienda y del POS.",
      });
    }
    console.error("Error eliminarProducto:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

export const toggleProducto = async (req, res) => {
  try {
    const { rows: [producto] } = await pool.query(
      `UPDATE productos SET activo = NOT activo
       WHERE id = $1 AND empresa_id = $2
       RETURNING id, activo`,
      [req.params.id, req.user.empresa_id]
    );
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    console.error("Error toggleProducto:", error);
    res.status(500).json({ error: "Error al cambiar el estado del producto" });
  }
};

// =========================
// GET PRODUCTOS PÚBLICOS (vitrina)
// Incluye precio_mayoreo para lógica de precio inteligente
// =========================
export const getProductosPorEmpresaPublico = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.precio_mayoreo,
              p.stock, p.unidad, p.categoria_id, p.imagen_url,
              c.nombre AS categoria,
              COALESCE(
                json_agg(json_build_object('id', pi.id, 'url', pi.url) ORDER BY pi.orden)
                FILTER (WHERE pi.id IS NOT NULL), '[]'
              ) AS imagenes
       FROM productos p
       LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id
       LEFT JOIN categoria c ON c.id = p.categoria_id
       WHERE p.empresa_id = $1 AND p.activo
       GROUP BY p.id, c.nombre
       ORDER BY p.nombre ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error productos públicos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

// =========================
// ELIMINAR IMAGEN INDIVIDUAL
// =========================
export const eliminarImagenProducto = async (req, res) => {
  try {
    const { id, imgId } = req.params;
    const empresa_id = req.user.empresa_id;

    const prod = await pool.query(
      "SELECT id FROM productos WHERE id = $1 AND empresa_id = $2", [id, empresa_id]
    );
    if (!prod.rows.length) return res.status(404).json({ error: "Producto no encontrado" });

    const img = await pool.query(
      "SELECT url FROM producto_imagenes WHERE id = $1 AND producto_id = $2", [imgId, id]
    );
    if (!img.rows.length) return res.status(404).json({ error: "Imagen no encontrada" });

    await pool.query("DELETE FROM producto_imagenes WHERE id = $1", [imgId]);

    // Actualizar imagen_url con la siguiente imagen disponible
    const remaining = await pool.query(
      "SELECT url FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden ASC LIMIT 1", [id]
    );
    const nuevaPortada = remaining.rows[0]?.url || null;
    await pool.query("UPDATE productos SET imagen_url = $1 WHERE id = $2", [nuevaPortada, id]);

    res.json({ ok: true, nueva_portada: nuevaPortada });
  } catch (error) {
    console.error("Error eliminarImagenProducto:", error);
    res.status(500).json({ error: "Error al eliminar imagen" });
  }
};

// =========================
// NIVELES DE LEALTAD
// =========================
export const getNivelesLealtad = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const result = await pool.query(
      `SELECT * FROM niveles_lealtad WHERE empresa_id = $1 ORDER BY monto_minimo ASC`,
      [empresa_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getNivelesLealtad:", error);
    res.status(500).json({ error: "Error al obtener niveles de lealtad" });
  }
};

export const crearNivelLealtad = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { nombre, monto_minimo, descuento_porcentaje } = req.body;

    if (!nombre || !monto_minimo || !descuento_porcentaje) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    if (descuento_porcentaje <= 0 || descuento_porcentaje > 100) {
      return res.status(400).json({ error: "El descuento debe estar entre 1 y 100" });
    }

    const result = await pool.query(
      `INSERT INTO niveles_lealtad (empresa_id, nombre, monto_minimo, descuento_porcentaje)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [empresa_id, nombre, monto_minimo, descuento_porcentaje]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error crearNivelLealtad:", error);
    res.status(500).json({ error: "Error al crear nivel de lealtad" });
  }
};

export const actualizarNivelLealtad = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id } = req.params;
    const { nombre, monto_minimo, descuento_porcentaje, activo } = req.body;

    const result = await pool.query(
      `UPDATE niveles_lealtad
       SET nombre=$1, monto_minimo=$2, descuento_porcentaje=$3, activo=$4
       WHERE id=$5 AND empresa_id=$6 RETURNING *`,
      [nombre, monto_minimo, descuento_porcentaje, activo, id, empresa_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Nivel no encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizarNivelLealtad:", error);
    res.status(500).json({ error: "Error al actualizar nivel de lealtad" });
  }
};

export const eliminarNivelLealtad = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id } = req.params;
    await pool.query("DELETE FROM niveles_lealtad WHERE id=$1 AND empresa_id=$2", [id, empresa_id]);
    res.json({ message: "Nivel eliminado correctamente" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        error: "Este nivel se usa en la configuración de referidos. Desactívalo o quítalo de esa configuración primero.",
      });
    }
    console.error("Error eliminarNivelLealtad:", error);
    res.status(500).json({ error: "Error al eliminar nivel de lealtad" });
  }
};

// =========================
// CALCULAR NIVEL DEL CLIENTE
// Suma POS + tienda online → precio inteligente
// =========================
export const getNivelCliente = async (req, res) => {
  try {
    const { clienteId, empresaId } = req.params;

    const { totalMes, nivel: nivelActual } = await getNivelLealtadCliente(clienteId, empresaId);

    res.json({
      total_mes:    totalMes,
      nivel_actual: nivelActual,
      descuento:    nivelActual ? nivelActual.descuento_porcentaje : 0,
    });

  } catch (error) {
    console.error("Error getNivelCliente:", error);
    res.status(500).json({ error: "Error al calcular nivel del cliente" });
  }
};