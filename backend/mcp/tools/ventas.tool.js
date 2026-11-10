import { z } from "zod";
import { aBogota } from "./fechas.js";

export function registerVentasTools(server, pool, empresa_id) {
  server.tool(
    "get_ventas_periodo",
    "Total de ventas, transacciones y ticket promedio en un rango de fechas",
    {
      desde: z.string().describe("Fecha de inicio en formato YYYY-MM-DD"),
      hasta: z.string().describe("Fecha de fin en formato YYYY-MM-DD"),
    },
    async ({ desde, hasta }) => {
      const result = await pool.query(
        `SELECT
           SUM(transacciones) AS transacciones,
           COALESCE(SUM(ingresos_total), 0) AS ingresos_total,
           CASE WHEN SUM(transacciones) > 0
                THEN SUM(ingresos_total) / SUM(transacciones)
                ELSE 0 END AS ticket_promedio
         FROM (
           SELECT COUNT(*) AS transacciones, COALESCE(SUM(total), 0) AS ingresos_total
           FROM ventas
           WHERE empresa_id = $1 AND ${aBogota("fecha")} BETWEEN $2 AND $3
           UNION ALL
           SELECT COUNT(*) AS transacciones, COALESCE(SUM(total), 0) AS ingresos_total
           FROM pedidos_online
           WHERE empresa_id = $1
             AND estado IN ('entregado', 'confirmado', 'en_preparacion', 'enviado')
             AND ${aBogota("fecha_pedido")} BETWEEN $2 AND $3
         ) src`,
        [empresa_id, desde, hasta]
      );

      const r = result.rows[0];
      return {
        content: [
          {
            type: "text",
            text:
              `Ventas del ${desde} al ${hasta}:\n` +
              `- Total ingresos: $${Number(r.ingresos_total).toLocaleString("es-CO")} COP\n` +
              `- Transacciones: ${r.transacciones}\n` +
              `- Ticket promedio: $${Math.round(Number(r.ticket_promedio)).toLocaleString("es-CO")} COP`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_top_productos",
    "Los productos más vendidos en un período con unidades vendidas e ingresos generados",
    {
      desde: z.string().describe("Fecha de inicio en formato YYYY-MM-DD"),
      hasta: z.string().describe("Fecha de fin en formato YYYY-MM-DD"),
      limite: z.number().optional().describe("Cantidad de productos a mostrar (por defecto 5)"),
    },
    async ({ desde, hasta, limite = 5 }) => {
      const result = await pool.query(
        `SELECT
           p.nombre,
           SUM(src.cantidad) AS unidades,
           SUM(src.ingresos) AS ingresos
         FROM (
           SELECT dv.producto_id, dv.cantidad, dv.cantidad * dv.precio_unitario AS ingresos
           FROM detalle_venta dv
           JOIN ventas v ON v.id = dv.venta_id
           WHERE v.empresa_id = $1 AND ${aBogota("v.fecha")} BETWEEN $2 AND $3
           UNION ALL
           SELECT dp.producto_id, dp.cantidad, dp.cantidad * dp.precio_unitario AS ingresos
           FROM detalle_pedido_online dp
           JOIN pedidos_online po ON po.id = dp.pedido_id
           WHERE po.empresa_id = $1
             AND po.estado IN ('entregado','confirmado','en_preparacion','enviado')
             AND ${aBogota("po.fecha_pedido")} BETWEEN $2 AND $3
         ) src
         JOIN productos p ON p.id = src.producto_id AND p.empresa_id = $1
         GROUP BY p.id, p.nombre
         ORDER BY unidades DESC
         LIMIT $4`,
        [empresa_id, desde, hasta, limite]
      );

      if (result.rows.length === 0) {
        return {
          content: [{ type: "text", text: "No hay ventas registradas en ese período." }],
        };
      }

      const lista = result.rows
        .map(
          (p, i) =>
            `${i + 1}. ${p.nombre} — ${Number(p.unidades).toFixed(1)} uds. · $${Number(p.ingresos).toLocaleString("es-CO")} COP`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Top ${result.rows.length} productos más vendidos (${desde} al ${hasta}):\n\n${lista}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_comparativa",
    "Compara ventas entre dos períodos: ingresos, transacciones y variación porcentual",
    {
      periodo1_desde: z.string().describe("Inicio del primer período YYYY-MM-DD"),
      periodo1_hasta: z.string().describe("Fin del primer período YYYY-MM-DD"),
      periodo2_desde: z.string().describe("Inicio del segundo período YYYY-MM-DD"),
      periodo2_hasta: z.string().describe("Fin del segundo período YYYY-MM-DD"),
    },
    async ({ periodo1_desde, periodo1_hasta, periodo2_desde, periodo2_hasta }) => {
      const [p1, p2] = await Promise.all([
        pool.query(
          `SELECT SUM(transacciones) AS transacciones, COALESCE(SUM(ingresos), 0) AS ingresos
           FROM (
             SELECT COUNT(*) AS transacciones, COALESCE(SUM(total), 0) AS ingresos
             FROM ventas WHERE empresa_id = $1 AND ${aBogota("fecha")} BETWEEN $2 AND $3
             UNION ALL
             SELECT COUNT(*) AS transacciones, COALESCE(SUM(total), 0) AS ingresos
             FROM pedidos_online
             WHERE empresa_id = $1
               AND estado IN ('entregado', 'confirmado', 'en_preparacion', 'enviado')
               AND ${aBogota("fecha_pedido")} BETWEEN $2 AND $3
           ) src`,
          [empresa_id, periodo1_desde, periodo1_hasta]
        ),
        pool.query(
          `SELECT SUM(transacciones) AS transacciones, COALESCE(SUM(ingresos), 0) AS ingresos
           FROM (
             SELECT COUNT(*) AS transacciones, COALESCE(SUM(total), 0) AS ingresos
             FROM ventas WHERE empresa_id = $1 AND ${aBogota("fecha")} BETWEEN $2 AND $3
             UNION ALL
             SELECT COUNT(*) AS transacciones, COALESCE(SUM(total), 0) AS ingresos
             FROM pedidos_online
             WHERE empresa_id = $1
               AND estado IN ('entregado', 'confirmado', 'en_preparacion', 'enviado')
               AND ${aBogota("fecha_pedido")} BETWEEN $2 AND $3
           ) src`,
          [empresa_id, periodo2_desde, periodo2_hasta]
        ),
      ]);

      const ing1 = Number(p1.rows[0].ingresos);
      const ing2 = Number(p2.rows[0].ingresos);
      const tx1 = Number(p1.rows[0].transacciones);
      const tx2 = Number(p2.rows[0].transacciones);

      const varIngresos =
        ing1 > 0 ? (((ing2 - ing1) / ing1) * 100).toFixed(1) : "N/A";
      const varTx =
        tx1 > 0 ? (((tx2 - tx1) / tx1) * 100).toFixed(1) : "N/A";

      const tendencia = (val) => {
        if (val === "N/A") return "";
        return Number(val) >= 0 ? `↑ ${val}%` : `↓ ${Math.abs(val)}%`;
      };

      return {
        content: [
          {
            type: "text",
            text:
              `Comparativa de ventas:\n\n` +
              `Período 1 (${periodo1_desde} → ${periodo1_hasta}):\n` +
              `  Ingresos: $${ing1.toLocaleString("es-CO")} COP | Transacciones: ${tx1}\n\n` +
              `Período 2 (${periodo2_desde} → ${periodo2_hasta}):\n` +
              `  Ingresos: $${ing2.toLocaleString("es-CO")} COP | Transacciones: ${tx2}\n\n` +
              `Variación:\n` +
              `  Ingresos: ${tendencia(varIngresos)}\n` +
              `  Transacciones: ${tendencia(varTx)}`,
          },
        ],
      };
    }
  );
}
