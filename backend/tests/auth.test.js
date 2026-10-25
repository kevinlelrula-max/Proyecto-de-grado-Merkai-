import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock de la base de datos antes de importar la app
vi.mock("../config/db.js", () => ({
  default: { query: vi.fn() },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import app from "../app.js";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 400 si faltan usuario o contraseña", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ usuario: "admin" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Usuario y contraseña son obligatorios");
  });

  it("devuelve 401 si el usuario no existe", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ usuario: "noexiste", contrasena: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales incorrectas");
  });

  it("devuelve 401 si la contraseña es incorrecta", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, nombre: "Admin", apellido: "Test", usuario: "admin",
               empresa_id: 1, rol_id: 1, contrasena: "$2b$10$hasheado",
               codigo_referido: "ABC123" }],
    });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ usuario: "admin", contrasena: "incorrecta" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales incorrectas");
  });

  it("devuelve 200 con token si las credenciales son correctas", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, nombre: "Admin", apellido: "Test", usuario: "admin",
                 empresa_id: 1, rol_id: 1, contrasena: "$2b$10$hasheado",
                 codigo_referido: "ABC123" }],
      })
      .mockResolvedValueOnce({ rows: [] });

    bcrypt.compare.mockResolvedValueOnce(true);

    process.env.JWT_SECRET = "test_secret";

    const res = await request(app)
      .post("/api/auth/login")
      .send({ usuario: "admin", contrasena: "correcta" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.usuario).toBe("admin");
  });

  it("devuelve 403 si el usuario está desactivado", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 3, nombre: "Cajero", apellido: "Test", usuario: "cajero",
               empresa_id: 1, rol_id: 3, contrasena: "$2b$10$hasheado",
               activo: false, codigo_referido: null }],
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ usuario: "cajero", contrasena: "correcta" });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("desactivado");
  });

  it("devuelve 403 si el rol del usuario es cliente (rol_id = 4)", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 2, nombre: "Cliente", apellido: "Test", usuario: "cliente",
               empresa_id: 1, rol_id: 4, contrasena: "$2b$10$hasheado",
               codigo_referido: null }],
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ usuario: "cliente", contrasena: "cualquiera" });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("no tiene acceso");
  });
});
