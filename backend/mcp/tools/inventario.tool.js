import { z } from "zod";

export function registerInventarioTools(server, pool, empresa_id) {
  server.tool(
    "get_stock_critico",
    "Productos con stock bajo el mínimo, incluye días estimados de agotamiento y cantidad sugerida a pedir",
    {},
    async () => {
      const result = await pool.query(
        `SELECT
           p.id,
           p.nombre,
           p.stock,
           p.stock_minimo,
           p.unidad,
           ROUND(COALESCE(v30.total_vendido / 30.0, 0)::numeric, 2) AS promedio_diario,
           GREATEST(0, ROUND((COALESCE(v30.total_vendido / 30.0, 0) * 7 - p.stock)::numeric, 1)) AS cantidad_sugerida
         FROM productos p
         LEFT JOIN (
           SELECT producto_id, SUM(cantidad) AS total_vendido
           FROM (
             SELECT dv.producto_id, dv.cantidad FROM detalle_venta dv
             JOIN ventas v ON v.id = dv.venta_id
             WHERE v.empresa_id = $1 AND v.fecha >= NOW() - INTERVAL '30 days'
             UNION ALL
             SELECT dp.producto_id, dp.cantidad FROM detalle_pedido_online dp
             JOIN pedidos_online po ON po.id = dp.pedido_id
             WHERE po.empresa_id = $1 AND po.fecha_pedido >= NOW() - INTERVAL '30 days'
               AND po.estado != 'cancelado'
           ) t
           GROUP BY producto_id
         ) v30 ON v30.producto_id = p.id
         WHERE p.empresa_id = $1 AND p.activo AND p.stock_minimo IS NOT NULL AND p.stock <= p.stock_minimo
         ORDER BY p.stock ASC`,
        [empresa_id]
      );

      if (result.rows.length === 0) {
        return {
          content: [{ type: "text", text: "Todos los productos tienen stock suficiente." }],
        };
      }

      const lista = result.rows
        .map((p) => {
          const promedio = Number(p.promedio_diario);
          const dias =
            promedio > 0
              ? `~${Math.round(Number(p.stock) / promedio)} días restantes`
              : "sin ventas recientes";
          return (
            `• ${p.nombre}\n` +
            `  Stock actual: ${Number(p.stock).toFixed(1)} ${p.unidad || "uds."} (mínimo: ${p.stock_minimo})\n` +
            `  Promedio diario: ${promedio > 0 ? promedio + " " + (p.unidad || "uds.") : "sin datos"}\n` +
            `  ${dias}\n` +
            `  Pedir ahora: ${Number(p.cantidad_sugerida).toFixed(1)} ${p.unidad || "uds."}`
          );
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `${result.rows.length} producto(s) con stock crítico:\n\n${lista}`,
          },
        ],
      };
    }
  );

  server.tool(
    "buscar_producto",
    "Busca un producto por nombre y muestra su stock actual, precio y promedio de ventas diario",
    { nombre: z.string().describe("Nombre o parte del nombre del producto a buscar") },
    async ({ nombre }) => {
      const result = await pool.query(
        `SELECT
           p.id,
           p.nombre,
           p.stock,
           p.stock_minimo,
           p.unidad,
           p.precio_venta,
           p.precio_compra,
           ROUND(COALESCE(v30.total_vendido / 30.0, 0)::numeric, 2) AS promedio_diario
         FROM productos p
         LEFT JOIN (
           SELECT producto_id, SUM(cantidad) AS total_vendido
           FROM (
             SELECT dv.producto_id, dv.cantidad FROM detalle_venta dv
             JOIN ventas v ON v.id = dv.venta_id
             WHERE v.empresa_id = $1 AND v.fecha >= NOW() - INTERVAL '30 days'
             UNION ALL
             SELECT dp.producto_id, dp.cantidad FROM detalle_pedido_online dp
             JOIN pedidos_online po ON po.id = dp.pedido_id
             WHERE po.empresa_id = $1 AND po.fecha_pedido >= NOW() - INTERVAL '30 days'
               AND po.estado != 'cancelado'
           ) t
           GROUP BY producto_id
         ) v30 ON v30.producto_id = p.id
         WHERE p.empresa_id = $1 AND LOWER(p.nombre) LIKE LOWER($2)
         ORDER BY p.nombre
         LIMIT 10`,
        [empresa_id, `%${nombre}%`]
      );

      if (result.rows.length === 0) {
        return {
          content: [{ type: "text", text: `No se encontraron productos con el nombre "${nombre}".` }],
        };
      }

      const lista = result.rows
        .map((p) => {
          const stockStatus =
            p.stock_minimo && Number(p.stock) <= Number(p.stock_minimo)
              ? "⚠️ STOCK BAJO"
              : "✅ OK";
          return (
            `${p.nombre} [${stockStatus}]\n` +
            `  Stock: ${Number(p.stock).toFixed(1)} ${p.unidad || "uds."}\n` +
            `  Precio venta: $${Number(p.precio_venta || 0).toLocaleString("es-CO")} COP\n` +
            `  Promedio diario vendido (30d): ${Number(p.promedio_diario)} ${p.unidad || "uds."}`
          );
        })
        .join("\n\n");

      return { content: [{ type: "text", text: lista }] };
    }
  );
}
