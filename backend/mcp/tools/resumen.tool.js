import { z } from "zod";

export function registerResumenTools(server, pool, empresa_id) {
  server.tool(
    "get_resumen_hoy",
    "Resumen del dashboard de hoy: ventas del día, pedidos pendientes y productos con stock bajo",
    {},
    async () => {
      const [ventas, pedidos, stockBajo] = await Promise.all([
        pool.query(
          `SELECT
            COALESCE(SUM(ingresos), 0) AS ingresos,
            COALESCE(SUM(transacciones), 0) AS transacciones
           FROM (
             SELECT SUM(total) AS ingresos, COUNT(*) AS transacciones
             FROM ventas
             WHERE empresa_id = $1 AND DATE(fecha) = CURRENT_DATE
             UNION ALL
             SELECT SUM(total) AS ingresos, COUNT(*) AS transacciones
             FROM pedidos_online
             WHERE empresa_id = $1
               AND estado IN ('entregado', 'confirmado', 'en_preparacion', 'enviado')
               AND DATE(fecha_pedido) = CURRENT_DATE
           ) src`,
          [empresa_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM pedidos_online
           WHERE empresa_id = $1 AND estado = 'pendiente'`,
          [empresa_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS total
           FROM productos
           WHERE empresa_id = $1 AND activo AND stock_minimo IS NOT NULL AND stock <= stock_minimo`,
          [empresa_id]
        ),
      ]);

      const resumen = {
        ventas_hoy: {
          ingresos: Number(ventas.rows[0].ingresos),
          transacciones: Number(ventas.rows[0].transacciones),
        },
        pedidos_pendientes: Number(pedidos.rows[0].total),
        productos_stock_bajo: Number(stockBajo.rows[0].total),
      };

      return {
        content: [
          {
            type: "text",
            text: `Resumen del día:\n- Ingresos: $${resumen.ventas_hoy.ingresos.toLocaleString("es-CO")} COP en ${resumen.ventas_hoy.transacciones} transacciones\n- Pedidos pendientes: ${resumen.pedidos_pendientes}\n- Productos con stock bajo: ${resumen.productos_stock_bajo}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_pedidos_pendientes",
    "Lista de pedidos online sin atender con detalle del cliente y productos",
    {},
    async () => {
      const result = await pool.query(
        `SELECT
           po.id,
           po.fecha_pedido,
           po.total,
           c.nombre AS cliente,
           c.telefono,
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'producto', p.nombre,
               'cantidad', dp.cantidad,
               'precio', dp.precio_unitario
             )
           ) AS productos
         FROM pedidos_online po
         JOIN clientes c ON c.id = po.cliente_id
         JOIN detalle_pedido_online dp ON dp.pedido_id = po.id
         JOIN productos p ON p.id = dp.producto_id
         WHERE po.empresa_id = $1 AND po.estado = 'pendiente'
         GROUP BY po.id, po.fecha_pedido, po.total, c.nombre, c.telefono
         ORDER BY po.fecha_pedido ASC
         LIMIT 20`,
        [empresa_id]
      );

      if (result.rows.length === 0) {
        return { content: [{ type: "text", text: "No hay pedidos pendientes." }] };
      }

      const lista = result.rows
        .map(
          (p) =>
            `Pedido #${p.id} — ${p.cliente} (${p.telefono || "sin tel."})\n` +
            `  Fecha: ${new Date(p.fecha_pedido).toLocaleDateString("es-CO")}\n` +
            `  Total: $${Number(p.total).toLocaleString("es-CO")} COP\n` +
            `  Productos: ${p.productos.map((x) => `${x.producto} x${x.cantidad}`).join(", ")}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `${result.rows.length} pedido(s) pendiente(s):\n\n${lista}`,
          },
        ],
      };
    }
  );
}
