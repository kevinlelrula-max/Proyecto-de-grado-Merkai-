import { describe, it, expect, vi } from "vitest";

vi.mock("../config/db.js", () => ({ default: { query: vi.fn() } }));

import { calcularPedido, ErrorPedido } from "../utils/calcularPedido.js";

// Base de datos falsa: responde según el texto de la consulta
function crearDb({ productos, nivel = null, empresa, referido = null, cupon = null, usosCliente = 0 }) {
  return {
    query: vi.fn(async (sql) => {
      if (sql.includes("FROM productos")) return { rows: productos };
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
