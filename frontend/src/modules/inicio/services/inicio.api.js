const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

export async function fetchResumenInicio() {
  const res = await fetch(`${API_BASE}/api/reportesEmpresa/inicio`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("No se pudo cargar el resumen.");
  return res.json();
}
