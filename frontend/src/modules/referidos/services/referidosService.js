const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const hdr = (token) => ({ Authorization: `Bearer ${token}` });

export const getMiReferido = (token, empresa_id) =>
  fetch(`${API}/api/referidos/mi-info?empresa_id=${empresa_id}`, { headers: hdr(token) })
    .then(r => r.ok ? r.json() : null);

export const getMiDescuentoActivo = (token, empresa_id) =>
  fetch(`${API}/api/referidos/mi-descuento-activo?empresa_id=${empresa_id}`, { headers: hdr(token) })
    .then(r => r.ok ? r.json() : { tiene_descuento: false });

export const validarCodigo = (codigo, empresa_id) =>
  fetch(`${API}/api/referidos/validar/${codigo}?empresa_id=${empresa_id}`)
    .then(r => r.json());

export const getConfigReferidos = (token) =>
  fetch(`${API}/api/referidos/config`, { headers: hdr(token) })
    .then(r => r.ok ? r.json() : null);

export const guardarConfigReferidos = (token, body) =>
  fetch(`${API}/api/referidos/config`, {
    method: "POST",
    headers: { ...hdr(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json());

export const getEstadisticasReferidos = (token) =>
  fetch(`${API}/api/referidos/estadisticas`, { headers: hdr(token) })
    .then(r => r.ok ? r.json() : null);
