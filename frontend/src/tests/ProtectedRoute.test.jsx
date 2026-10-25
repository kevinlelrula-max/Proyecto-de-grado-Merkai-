import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

function makeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = btoa(JSON.stringify(payload));
  return `${header}.${body}.firma_falsa`;
}

const futuro = Math.floor(Date.now() / 1000) + 3600;
const pasado = Math.floor(Date.now() / 1000) - 3600;

function renderConRuta(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");

  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Contenido protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/empresa/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirige a login si no hay token", () => {
    renderConRuta(null);
    expect(screen.getByText("Página de login")).toBeInTheDocument();
  });

  it("redirige a login si el token está expirado", () => {
    const tokenExpirado = makeToken({ id: 1, empresa_id: 1, rol_id: 1, exp: pasado });
    renderConRuta(tokenExpirado);
    expect(screen.getByText("Página de login")).toBeInTheDocument();
  });

  it("redirige a login si el rol es cliente (rol_id = 4)", () => {
    const tokenCliente = makeToken({ id: 5, empresa_id: 1, rol_id: 4, exp: futuro });
    renderConRuta(tokenCliente);
    expect(screen.getByText("Página de login")).toBeInTheDocument();
  });

  it("muestra el contenido protegido con token válido y rol correcto", () => {
    const tokenValido = makeToken({ id: 1, empresa_id: 1, rol_id: 1, exp: futuro });
    renderConRuta(tokenValido);
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });
});
