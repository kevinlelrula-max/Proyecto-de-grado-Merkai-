import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../config/db.js", () => ({
  default: { query: vi.fn() },
}));

import app from "../app.js";
import pool from "../config/db.js";

const JWT_SECRET = "test_secret";
process.env.JWT_SECRET = JWT_SECRET;

const tokenEmpresa = jwt.sign(
  { id: 1, empresa_id: 1, rol_id: 1 },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const tokenCliente = jwt.sign(
  { id: 5, empresa_id: 1, rol_id: 4 },
  JWT_SECRET,
  { expiresIn: "1h" }
);

describe("GET /api/pedidos/empresa (pedidos del dashboard)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 401 si no se envía token", async () => {
    const res = await request(app).get("/api/pedidos/empresa");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No autorizado");
  });

  it("devuelve 200 con listado de pedidos si el token es válido", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ activo: true }] });
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 10, estado: "pendiente", total: 45000, empresa_id: 1, cliente_nombre: "Juan Pérez" },
        { id: 11, estado: "entregado", total: 80000, empresa_id: 1, cliente_nombre: "María López" },
      ],
    });

    const res = await request(app)
      .get("/api/pedidos/empresa")
      .set("Authorization", `Bearer ${tokenEmpresa}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].estado).toBe("pendiente");
  });
});

describe("GET /api/pedidos/mis-pedidos (pedidos del cliente)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 401 si no se envía token", async () => {
    const res = await request(app).get("/api/pedidos/mis-pedidos");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No autorizado");
  });

  it("devuelve 200 con los pedidos del cliente autenticado", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ activo: true }] });
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 20, estado: "enviado", total: 32000, cliente_id: 5 },
      ],
    });

    const res = await request(app)
      .get("/api/pedidos/mis-pedidos")
      .set("Authorization", `Bearer ${tokenCliente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].estado).toBe("enviado");
  });
});

describe("POST /api/pedidos (crear pedido)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 401 si no se envía token al crear pedido", async () => {
    const res = await request(app)
      .post("/api/pedidos")
      .send({ empresa_id: 1, items: [{ producto_id: 1, cantidad: 2 }] });

    expect(res.status).toBe(401);
  });

  it("devuelve 403 si quien crea el pedido no es un cliente", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ activo: true }] });
    pool.connect = vi.fn().mockResolvedValue({ query: vi.fn(), release: vi.fn() });

    const res = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${tokenEmpresa}`)
      .send({ empresa_id: 1, detalle: [{ producto_id: 1, cantidad: 1 }] });

    expect(res.status).toBe(403);
  });
});
