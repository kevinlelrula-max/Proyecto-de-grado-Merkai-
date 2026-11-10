import { z } from "zod";
import { fechaCO } from "./fechas.js";

export function registerClientesTools(server, pool, empresa_id) {
  server.tool(
    "get_clientes_frecuentes",
    "Clientes con más compras en los últimos meses, con total acumulado y número de órdenes",
    {
      limite: z.number().optional().describe("Cantidad de clientes a mostrar (por defecto 10)"),
      dias: z.number().optional().describe("Rango de días hacia atrás a analizar (por defecto 90)"),
    },
    async ({ limite = 10, dias = 90 }) => {
      const result = await pool.query(
        `SELECT
           c.nombre || ' ' || COALESCE(c.apellido, '') AS nombre,
           c.usuario AS email,
           c.telefono,
           COUNT(DISTINCT src.ref_id) AS total_compras,
           COALESCE(SUM(src.total), 0) AS total_gastado
         FROM persona c
         JOIN (
           SELECT cliente_id, id AS ref_id, total
           FROM ventas
           WHERE empresa_id = $1 AND fecha >= NOW() - ($2 || ' days')::INTERVAL
           UNION ALL
           SELECT cliente_id, id AS ref_id, total
           FROM pedidos_online
           WHERE empresa_id = $1
             AND estado IN ('entregado','confirmado','en_preparacion','enviado')
             AND fecha_pedido >= NOW() - ($2 || ' days')::INTERVAL
         ) src ON src.cliente_id = c.id
         WHERE c.rol_id = 4
         GROUP BY c.id, c.nombre, c.apellido, c.usuario, c.telefono
         ORDER BY total_compras DESC, total_gastado DESC
         LIMIT $3`,
        [empresa_id, dias, limite]
      );

      if (result.rows.length === 0) {
        return {
          content: [{ type: "text", text: `No hay clientes con compras en los últimos ${dias} días.` }],
        };
      }

      const lista = result.rows
        .map(
          (c, i) =>
            `${i + 1}. ${c.nombre}${c.email ? ` (${c.email})` : ""}\n` +
            `   ${c.total_compras} compra(s) · $${Number(c.total_gastado).toLocaleString("es-CO")} COP total`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Top ${result.rows.length} clientes más frecuentes (últimos ${dias} días):\n\n${lista}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_historial_cliente",
    "Historial de compras de un cliente específico: qué compró, cuándo y cuánto gastó",
    {
      nombre: z.string().describe("Nombre o parte del nombre del cliente"),
    },
    async ({ nombre }) => {
      const clienteResult = await pool.query(
        `SELECT p.id, p.nombre || ' ' || COALESCE(p.apellido, '') AS nombre, p.usuario AS email, p.telefono
         FROM persona p
         WHERE p.rol_id = 4
           AND LOWER(p.nombre || ' ' || COALESCE(p.apellido, '')) LIKE LOWER($2)
           AND (p.empresa_id = $1
                OR EXISTS (SELECT 1 FROM ventas v WHERE v.cliente_id = p.id AND v.empresa_id = $1)
                OR EXISTS (SELECT 1 FROM pedidos_online o WHERE o.cliente_id = p.id AND o.empresa_id = $1))
         LIMIT 1`,
        [empresa_id, `%${nombre}%`]
      );

      if (clienteResult.rows.length === 0) {
        return {
          content: [{ type: "text", text: `No se encontró ningún cliente con el nombre "${nombre}".` }],
        };
      }

      const cliente = clienteResult.rows[0];

      const historialResult = await pool.query(
        `SELECT id, fecha, total, origen, productos
         FROM (
           SELECT
             v.id,
             v.fecha,
             v.total,
             'POS' AS origen,
             JSON_AGG(
               JSON_BUILD_OBJECT('producto', p.nombre, 'cantidad', dv.cantidad)
               ORDER BY p.nombre
             ) AS productos
           FROM ventas v
           JOIN detalle_venta dv ON dv.venta_id = v.id
           JOIN productos p ON p.id = dv.producto_id
           WHERE v.empresa_id = $1 AND v.cliente_id = $2
           GROUP BY v.id, v.fecha, v.total
           UNION ALL
           SELECT
             po.id,
             po.fecha_pedido AS fecha,
             po.total,
             'Tienda online' AS origen,
             JSON_AGG(
               JSON_BUILD_OBJECT('producto', p.nombre, 'cantidad', dp.cantidad)
               ORDER BY p.nombre
             ) AS productos
           FROM pedidos_online po
           JOIN detalle_pedido_online dp ON dp.pedido_id = po.id
           JOIN productos p ON p.id = dp.producto_id
           WHERE po.empresa_id = $1 AND po.cliente_id = $2
             AND po.estado IN ('entregado','confirmado','en_preparacion','enviado')
           GROUP BY po.id, po.fecha_pedido, po.total
         ) src
         ORDER BY fecha DESC
         LIMIT 20`,
        [empresa_id, cliente.id]
      );

      if (historialResult.rows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `${cliente.nombre} está registrado pero no tiene compras registradas.`,
            },
          ],
        };
      }

      const totalGastado = historialResult.rows.reduce((acc, v) => acc + Number(v.total), 0);

      const historial = historialResult.rows
        .map(
          (v) =>
            `• ${fechaCO(v.fecha)} [${v.origen}] — $${Number(v.total).toLocaleString("es-CO")} COP\n` +
            `  ${v.productos.map((p) => `${p.producto} x${p.cantidad}`).join(", ")}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text:
              `Cliente: ${cliente.nombre}${cliente.email ? ` · ${cliente.email}` : ""}${cliente.telefono ? ` · ${cliente.telefono}` : ""}\n` +
              `Total gastado: $${totalGastado.toLocaleString("es-CO")} COP en ${historialResult.rows.length} compra(s)\n\n` +
              `Historial:\n${historial}`,
          },
        ],
      };
    }
  );
}
