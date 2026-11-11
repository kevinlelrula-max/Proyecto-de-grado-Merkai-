import { describe, it, expect, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: { query: vi.fn() } }));

import { calcularPedido, ErrorPedido } from "../utils/calcularPedido.js";

// Base de datos falsa: responde según el texto de la consulta
function crearDb({ productos, nivel = null, nivelHeredado = null, comprasPrevias = 0, empresa, referido = null, cupon = null, usosCliente = 0 }) {
  return {
    query: vi.fn(async (sql) => {
      if (sql.includes("nivel_heredado_id")) return { rows: nivelHeredado ? [nivelHeredado] : [] };
      if (sql.includes("FROM productos")) return { rows: productos };
      // El conteo de compras previas del cliente (primera compra) usa COUNT(*); la suma del mes usa SUM(total)
      if (sql.includes("COUNT(*)")) return { rows: [{ total: comprasPrevias }] };
      if (sql.includes("FROM ventas") || sql.includes("FROM pedidos_online")) return { rows: [{ total: 0 }] };
      if (sql.includes("FROM niveles_lealtad")) return { rows: nivel ? [nivel] : [] };
      if (sql.includes("FROM empresas")) return { rows: [empresa] };
      if (sql.includes("FROM referidos")) return { rows: referido ? [referido] : [] };
      if (sql.includes("FROM cupones_usos")) return { rows: [{ total: usosCliente }] };
      if (sql.includes("FROM cupones")) return { rows: cupon ? [cupon] : [] };
      throw new Error(`Consulta no esperada: ${sql}`);
    }),
  };
}

const empresa = { envio_costo: 8000, envio_costos_departamentos: { 11: 5000, 5: 0 } };
const atun = { id: 1, nombre: "Atún", precio: "10000", precio_mayoreo: null, stock: "50", activo: true };

describe("calcularPedido", () => {
  it("ignora el precio enviado por el navegador y usa el de la base", async () => {
    const db = crearDb({ productos: [atun], empresa });
    const r = await calcularPedido(
      { empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 2, precio_unitario: 1 }], departamento_id: 5 }, db
    );
    expect(r.items[0].precio_unitario).toBe(10000);
    expect(r.total).toBe(20000);
  });

  it("aplica el menor precio entre normal, mayoreo y lealtad", async () => {
    const db = crearDb({
      productos: [{ ...atun, precio_mayoreo: "9000" }],
      nivel: { descuento_porcentaje: "15" },
      empresa,
    });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 5 }, db);
    expect(r.items[0].precio_unitario).toBe(8500);
  });

  it("suma el envío del departamento y el costo por defecto si no tiene uno propio", async () => {
    const db = crearDb({ productos: [atun], empresa });
    const bogota = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 11 }, db);
    const huila  = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 41 }, db);
    expect(bogota.total).toBe(15000);
    expect(huila.total).toBe(18000);
  });

  it("exige departamento cuando la tienda tiene envío configurado", async () => {
    const db = crearDb({ productos: [atun], empresa });
    await expect(
      calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }] }, db)
    ).rejects.toThrow("departamento de envío");
  });

  it("no exige departamento si la tienda no tiene envío configurado", async () => {
    const db = crearDb({ productos: [atun], empresa: { envio_costo: 0, envio_costos_departamentos: {} } });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }] }, db);
    expect(r.total).toBe(10000);
  });

  it("aplica descuento y envío gratis de referido", async () => {
    const db = crearDb({
      productos: [atun], empresa,
      referido: { descuento_amigo_pct: "10", envio_gratis_amigo: true },
    });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 11 }, db);
    expect(r.descuento_referido).toBe(1000);
    expect(r.total).toBe(9000);
  });

  it("el descuento de referido solo vale para la primera compra", async () => {
    const referido = { descuento_amigo_pct: "10", envio_gratis_amigo: true };
    const primera = crearDb({ productos: [atun], empresa, referido, comprasPrevias: 0 });
    const conCompras = crearDb({ productos: [atun], empresa, referido, comprasPrevias: 1 });
    const pedido = { empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 11 };

    const r1 = await calcularPedido(pedido, primera);
    expect(r1.descuento_referido).toBe(1000);
    expect(r1.costo_envio).toBe(0);

    // Un pedido previo no cancelado (por ejemplo, otro pedido pendiente) ya consumió el beneficio
    const r2 = await calcularPedido(pedido, conCompras);
    expect(r2.descuento_referido).toBe(0);
    expect(r2.costo_envio).toBe(5000);
    expect(r2.total).toBe(15000);
  });

  it("usa el nivel heredado por referido cuando es mejor que el ganado", async () => {
    const db = crearDb({
      productos: [atun], empresa,
      nivel: { monto_minimo: "700000", descuento_porcentaje: "8" },
      nivelHeredado: { monto_minimo: "1000000", descuento_porcentaje: "10", nivel_heredado_hasta: "2099-01-01" },
    });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 5 }, db);
    expect(r.items[0].precio_unitario).toBe(9000); // 10 % de descuento del nivel heredado
  });

  it("aplica el nivel heredado aunque el cliente no tenga nivel ganado", async () => {
    const db = crearDb({
      productos: [atun], empresa,
      nivelHeredado: { monto_minimo: "700000", descuento_porcentaje: "8", nivel_heredado_hasta: "2099-01-01" },
    });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 5 }, db);
    expect(r.items[0].precio_unitario).toBe(9200);
  });

  it("conserva el nivel ganado si el heredado es peor", async () => {
    const db = crearDb({
      productos: [atun], empresa,
      nivel: { monto_minimo: "1000000", descuento_porcentaje: "10" },
      nivelHeredado: { monto_minimo: "700000", descuento_porcentaje: "8", nivel_heredado_hasta: "2099-01-01" },
    });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], departamento_id: 5 }, db);
    expect(r.items[0].precio_unitario).toBe(9000);
  });

  it("valida y aplica el cupón en el servidor", async () => {
    const cupon = {
      id: 3, activo: true, tipo: "porcentaje", valor: "20", maximo_descuento: null,
      minimo_compra: "0", usos_totales: null, usos_actuales: 0, usos_por_cliente: null,
    };
    const db = crearDb({ productos: [atun], empresa, cupon });
    const r = await calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], cupon_id: 3, departamento_id: 5 }, db);
    expect(r.descuento_cupon).toBe(2000);
    expect(r.total).toBe(8000);
  });

  it("rechaza un cupón inactivo", async () => {
    const db = crearDb({ productos: [atun], empresa, cupon: { id: 3, activo: false } });
    await expect(
      calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }], cupon_id: 3 }, db)
    ).rejects.toBeInstanceOf(ErrorPedido);
  });

  it("rechaza productos desactivados, de otra tienda o sin stock", async () => {
    const inactivo = crearDb({ productos: [{ ...atun, activo: false }], empresa });
    await expect(
      calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }] }, inactivo)
    ).rejects.toThrow("ya no están disponibles");

    const otraTienda = crearDb({ productos: [], empresa });
    await expect(
      calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 1 }] }, otraTienda)
    ).rejects.toThrow("ya no están disponibles");

    const sinStock = crearDb({ productos: [{ ...atun, stock: "1" }], empresa });
    await expect(
      calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: 3 }] }, sinStock)
    ).rejects.toThrow("Stock insuficiente");
  });

  it("rechaza cantidades negativas o cero", async () => {
    const db = crearDb({ productos: [atun], empresa });
    await expect(
      calcularPedido({ empresa_id: 1, cliente_id: 5, detalle: [{ producto_id: 1, cantidad: -2 }] }, db)
    ).rejects.toThrow("Cantidad o producto inválido");
  });
});
