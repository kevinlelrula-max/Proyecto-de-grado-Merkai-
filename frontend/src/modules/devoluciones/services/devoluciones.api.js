const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export async function registrarDevolucion({ tipo, referencia_id, motivo, metodo_reembolso, productos }) {
  const res = await fetch(`${BASE_URL}/api/devoluciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ tipo, referencia_id, motivo, metodo_reembolso, productos }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al registrar devolución");
  return data;
}

export async function getDevoluciones() {
  const res = await fetch(`${BASE_URL}/api/devoluciones`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error al obtener devoluciones");
  return res.json();
}
