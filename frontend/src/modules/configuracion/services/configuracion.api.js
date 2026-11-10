const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

export async function getConfiguracion() {
  const res = await fetch(`${BASE_URL}/api/configuracion`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Error al obtener configuración");
  return res.json();
}

export async function updateDatosEmpresa(datos) {
  const res = await fetch(`${BASE_URL}/api/configuracion/empresa`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error("Error al guardar datos de empresa");
  return res.json();
}

export async function updateMetodosPago(metodos) {
  const res = await fetch(`${BASE_URL}/api/configuracion/metodos`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ metodos }),
  });
  if (!res.ok) throw new Error("Error al guardar métodos de pago");
  return res.json();
}

export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  const res = await fetch(`${BASE_URL}/api/configuracion/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Error al subir el logo");
  return res.json();
}

export async function getLayout() {
  const res = await fetch(`${BASE_URL}/api/configuracion/layout`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Error al obtener layout");
  return res.json();
}

export async function updateLayout(layout) {
  const res = await fetch(`${BASE_URL}/api/configuracion/layout`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ layout }),
  });
  if (!res.ok) throw new Error("Error al guardar layout");
  return res.json();
}

export async function uploadBanner(file) {
  const formData = new FormData();
  formData.append("banner", file);

  const res = await fetch(`${BASE_URL}/api/configuracion/banner`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Error al subir el banner");
  return res.json();
}