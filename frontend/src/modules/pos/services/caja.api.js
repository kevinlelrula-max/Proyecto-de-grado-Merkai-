const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export async function getSesionActiva() {
  const res = await fetch(`${BASE_URL}/api/caja/activa`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error al obtener sesión activa");
  // null cuando no hay caja abierta; si hay, trae el resumen en vivo (ventas, efectivo esperado…)
  return res.json();
}

export async function getHistorialCaja() {
  const res = await fetch(`${BASE_URL}/api/caja/historial`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Error al obtener historial de caja");
  return res.json();
}

export async function abrirCaja(monto_apertura) {
  const res = await fetch(`${BASE_URL}/api/caja/abrir`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ monto_apertura: Number(monto_apertura) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al abrir caja");
  return data;
}

// El monto de cierre lo calcula el servidor (apertura + ventas en efectivo − devoluciones en efectivo)
export async function cerrarCaja(sesion_id, observaciones) {
  const res = await fetch(`${BASE_URL}/api/caja/cerrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ sesion_id, observaciones }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al cerrar caja");
  return data;
}
