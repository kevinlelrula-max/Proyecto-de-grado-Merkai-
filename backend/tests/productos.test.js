import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../config/db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("../config/cloudinary.js", () => ({
  subirImagen: vi.fn(),
}));

import app from "../app.js";
import pool from "../config/db.js";

const JWT_SECRET = "test_secret";
process.env.JWT_SECRET = JWT_SECRET;

const tokenValido = jwt.sign(
  { id: 1, empresa_id: 1, rol_id: 1 },
  JWT_SECRET,
  { expiresIn: "1h" }
);

describe("GET /api/productos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 401 si no se envía token", async () => {
    const res = await request(app).get("/api/productos");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No autorizado");
  });

  it("devuelve 200 con lista de productos si el token es válido", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ activo: true }] });
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, nombre: "Atún en lata", precio: 5000, stock: 100, empresa_id: 1, imagenes: [] },
        { id: 2, nombre: "Salmón ahumado", precio: 25000, stock: 30, empresa_id: 1, imagenes: [] },
      ],
    });

    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].nombre).toBe("Atún en lata");
  });

  it("devuelve 401 con token inválido", async () => {
    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", "Bearer token_invalido_xyz");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token inválido");
  });

  it("devuelve 401 si el usuario del token fue desactivado", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ activo: false }] });

    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("desactivado");
  });
});

describe("DELETE /api/productos/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 409 y no borra si el producto tiene ventas", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ activo: true }] })
      .mockResolvedValueOnce({ rows: [{ imagen_url: null }] })
      .mockResolvedValueOnce({ rows: [{ ventas: 3, pedidos: 1 }] });

    const res = await request(app)
      .delete("/api/productos/7")
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("TIENE_HISTORIAL");
    expect(pool.query).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM productos"), expect.anything()
    );
  });

  it("elimina el producto si no tiene historial", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ activo: true }] })
      .mockResolvedValueOnce({ rows: [{ imagen_url: null }] })
      .mockResolvedValueOnce({ rows: [{ ventas: 0, pedidos: 0 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/productos/7")
      .set("Authorization", `Bearer ${tokenValido}`);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/productos/empresa/:id (ruta pública)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 200 con productos de una empresa sin necesitar token", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, nombre: "Merluza fresca", precio: 18000, stock: 50, imagenes: [] },
      ],
    });

    const res = await request(app).get("/api/productos/empresa/1");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
