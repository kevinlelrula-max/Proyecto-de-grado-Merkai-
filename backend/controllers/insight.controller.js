import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "../config/db.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

// Cache por empresa: empresa_id -> { generatedAt, content }
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora — se regenera para reflejar ventas del día

export const analizarReseñas = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const cacheKey = `reseñas_${empresa_id}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL) {
    return res.json({ ...cached.content, cached: true, generatedAt: cached.generatedAt });
  }

  try {
    const { rows } = await pool.query(
      `SELECT r.calificacion, r.comentario, p.nombre AS producto
       FROM reseñas r
       JOIN productos p ON p.id = r.producto_id
       WHERE r.empresa_id = $1 AND r.activo = true
       ORDER BY r.creado_en DESC LIMIT 100`,
      [empresa_id]
    );

    if (rows.length === 0) return res.json({ sinDatos: true });

    const positivas = rows.filter(r => r.calificacion >= 4).length;
    const neutras   = rows.filter(r => r.calificacion === 3).length;
    const negativas = rows.filter(r => r.calificacion <= 2).length;

    const comentarios = rows
      .filter(r => r.comentario?.trim())
      .slice(0, 30)
      .map(r => `${r.calificacion}⭐ "${r.comentario}"`)
      .join("\n");

    const prompt = `Analiza estas ${rows.length} reseñas de una tienda (${positivas} positivas ≥4⭐, ${neutras} neutras 3⭐, ${negativas} negativas ≤2⭐) y responde SOLO con un JSON válido sin texto adicional:
{
  "resumen": "2-3 oraciones sobre la percepción general de los clientes",
  "temas_positivos": ["hasta 3 aspectos que los clientes valoran"],
  "temas_negativos": ["hasta 3 puntos de mejora, array vacío si no hay"],
  "recomendacion": "una acción concreta y específica para el negocio"
}
${comentarios ? `\nComentarios:\n${comentarios}` : ""}`;

    const result = await gemini.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { resumen: text, temas_positivos: [], temas_negativos: [], recomendacion: "" };

    const content = { positivas, neutras, negativas, total: rows.length, ...analysis };
    cache.set(cacheKey, { generatedAt: Date.now(), content });

    res.json({ ...content, cached: false, generatedAt: Date.now() });
  } catch (err) {
    console.error("[Insight] analizarReseñas:", err.message);
    res.status(500).json({ error: "No se pudo analizar las reseñas" });
  }
};

export const generarDescripcion = async (req, res) => {
  const { nombre, precio, unidad } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es requerido" });

  const detalles = [
    precio ? `Precio: $${Number(precio).toLocaleString("es-CO")} COP` : null,
    unidad && unidad !== "unidad" ? `Se vende por ${unidad}` : null,
  ].filter(Boolean).join(". ");

  const prompt = `Escribe una descripción de producto corta y atractiva (2 oraciones máximo) en español para una tienda.\nProducto: ${nombre}${detalles ? `\n${detalles}` : ""}\n\nSolo la descripción, sin saludos ni introducciones.`;

  try {
    const result = await gemini.generateContent(prompt);
    return res.json({ descripcion: result.response.text().trim() });
  } catch (err) {
    console.error("[Insight] generarDescripcion:", err.message);
    return res.status(500).json({ error: "No se pudo generar la descripción" });
  }
};

export const generarDiseno = async (req, res) => {
  const { descripcion } = req.body;
  if (!descripcion?.trim()) return res.status(400).json({ error: "Descripción requerida" });

  const prompt = `Eres un diseñador web experto en tiendas online. Un empresario describe su negocio y tú generas una configuración de diseño completa y personalizada.

Descripción: "${descripcion}"

Responde ÚNICAMENTE con un JSON válido sin texto adicional:
{
  "color_primario": "#hexcolor (color de marca vibrante, contrasta con blanco)",
  "color_secundario": "#hexcolor (oscuro para navbar/footer, complementa el primario)",
  "fuente": "Inter|Poppins|Montserrat|Playfair Display",
  "hero_variante": "oscuro|lateral|minimalista|revista|negrita|gradiente",
  "estilo_tarjeta": "estandar|minimalista|oscuro|boutique|horizontal",
  "hero_titulo": "título impactante máximo 6 palabras",
  "hero_subtitulo": "subtítulo complementario máximo 12 palabras",
  "hero_btn_texto": "texto del botón de acción",
  "nosotros_titulo": "título para sección sobre nosotros",
  "nosotros_contenido": "2-3 oraciones que describan el negocio con calidez",
  "horario": "horario típico del negocio o cadena vacía",
  "secciones_extra": []
}

Reglas de diseño:
- hero_variante: revista=negocios visuales/gastronomía/moda, negrita=deportivo/juvenil/energético, gradiente=tecnología/premium/servicios, lateral=formal/profesional, minimalista=natural/artesanal/orgánico, oscuro=pesca/carnes/industria
- estilo_tarjeta: boutique=moda/artesanías/flores, oscuro=tecnología/premium/licores, horizontal=servicios/descripción larga/farmacia, minimalista=productos simples/ropa básica, estandar=todo lo demás
- fuente: Playfair Display=lujo/clásico/joyería, Poppins=amigable/infantil/dulces, Montserrat=corporativo/finanzas, Inter=tecnología/minimalista/moderno
- secciones_extra: incluye solo las que apliquen del array ["nosotros","faq","galeria","testimonios"] según el tipo de negocio`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "La IA no devolvió un diseño válido" });
    const diseno = JSON.parse(jsonMatch[0]);
    res.json(diseno);
  } catch (err) {
    console.error("[Insight] generarDiseno:", err.message);
    res.status(500).json({ error: "No se pudo generar el diseño" });
  }
};

export const getInsight = async (req, res) => {
  const empresa_id = req.user.empresa_id;
  const force = req.query.force === "1";

  const cached = cache.get(empresa_id);
  if (!force && cached && Date.now() - cached.generatedAt < CACHE_TTL) {
    return res.json({ insight: cached.content, cached: true, generatedAt: cached.generatedAt });
  }

  try {
    const hoy = new Date().toISOString().split("T")[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const [ventasHoy, ventasAyer, stockCritico, pedidos, topProductos] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(ingresos),0) AS ingresos, COALESCE(SUM(transacciones),0) AS transacciones
         FROM (
           SELECT SUM(total) AS ingresos, COUNT(*) AS transacciones FROM ventas
           WHERE empresa_id=$1 AND DATE(fecha)=CURRENT_DATE
           UNION ALL
           SELECT SUM(total) AS ingresos, COUNT(*) AS transacciones FROM pedidos_online
           WHERE empresa_id=$1 AND estado IN ('entregado','confirmado','en_preparacion','enviado')
           AND DATE(fecha_pedido)=CURRENT_DATE
         ) src`,
        [empresa_id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(ingresos),0) AS ingresos, COALESCE(SUM(transacciones),0) AS transacciones
         FROM (
           SELECT SUM(total) AS ingresos, COUNT(*) AS transacciones FROM ventas
           WHERE empresa_id=$1 AND DATE(fecha)=$2
           UNION ALL
           SELECT SUM(total) AS ingresos, COUNT(*) AS transacciones FROM pedidos_online
           WHERE empresa_id=$1 AND estado IN ('entregado','confirmado','en_preparacion','enviado')
           AND DATE(fecha_pedido)=$2
         ) src`,
        [empresa_id, ayer]
      ),
      pool.query(
        `SELECT nombre, stock, stock_minimo
         FROM productos
         WHERE empresa_id=$1 AND activo AND stock_minimo IS NOT NULL AND stock<=stock_minimo
         ORDER BY stock ASC LIMIT 5`,
        [empresa_id]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM pedidos_online
         WHERE empresa_id=$1 AND estado='pendiente'`,
        [empresa_id]
      ),
      pool.query(
        `SELECT p.nombre, SUM(src.cantidad) AS unidades
         FROM (
           SELECT dv.producto_id, dv.cantidad FROM detalle_venta dv
           JOIN ventas v ON v.id=dv.venta_id
           WHERE v.empresa_id=$1 AND DATE(v.fecha) BETWEEN $2 AND $3
           UNION ALL
           SELECT dp.producto_id, dp.cantidad FROM detalle_pedido_online dp
           JOIN pedidos_online po ON po.id=dp.pedido_id
           WHERE po.empresa_id=$1
             AND po.estado IN ('entregado','confirmado','en_preparacion','enviado')
             AND DATE(po.fecha_pedido) BETWEEN $2 AND $3
         ) src
         JOIN productos p ON p.id=src.producto_id AND p.empresa_id=$1
         GROUP BY p.id, p.nombre ORDER BY unidades DESC LIMIT 3`,
        [empresa_id, hace7, hoy]
      ),
    ]);

    const ingHoy  = Number(ventasHoy.rows[0].ingresos);
    const txHoy   = Number(ventasHoy.rows[0].transacciones);
    const ingAyer = Number(ventasAyer.rows[0].ingresos);
    const txAyer  = Number(ventasAyer.rows[0].transacciones);
    const varIng  = ingAyer > 0 ? (((ingHoy - ingAyer) / ingAyer) * 100).toFixed(1) : null;

    const fmt = (n) => Number(n).toLocaleString("es-CO");

    const contexto = [
      `Fecha: ${hoy}`,
      `Ventas hoy: $${fmt(ingHoy)} COP | ${txHoy} transacciones`,
      `Ventas ayer: $${fmt(ingAyer)} COP | ${txAyer} transacciones`,
      varIng !== null ? `Variación vs ayer: ${Number(varIng) >= 0 ? "+" : ""}${varIng}%` : "Sin datos de ayer para comparar",
      `Pedidos online pendientes: ${pedidos.rows[0].total}`,
      stockCritico.rows.length > 0
        ? `Productos con stock crítico: ${stockCritico.rows.map(p => `${p.nombre} (${p.stock} uds.)`).join(", ")}`
        : "Sin productos en stock crítico",
      topProductos.rows.length > 0
        ? `Top productos últimos 7 días: ${topProductos.rows.map((p, i) => `${i + 1}. ${p.nombre}`).join(", ")}`
        : "Sin ventas en los últimos 7 días",
    ].join("\n");

    const prompt = `Eres un consejero de negocios conciso. Analiza estos datos y escribe un párrafo breve (3-4 oraciones) en español con: qué está pasando hoy, algo notable (positivo o negativo), y UNA recomendación accionable concreta. Sin saludos, sin listas, solo el análisis directo.\n\n${contexto}`;

    const result = await gemini.generateContent(prompt);
    const content = result.response.text().trim();
    cache.set(empresa_id, { generatedAt: Date.now(), content });

    res.json({ insight: content, cached: false, generatedAt: Date.now() });
  } catch (err) {
    console.error("[Insight] Error:", err.message);
    res.status(500).json({ error: "No se pudo generar el análisis" });
  }
};
