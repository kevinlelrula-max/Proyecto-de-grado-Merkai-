import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/resenas";

// Reseñas públicas de un producto
export const getReseñasProducto = async (producto_id) => {
  const res = await axios.get(`${API_URL}/producto/${producto_id}`);
  return res.data; // { reseñas: [], stats: {} }
};

// Mi reseña para un producto (cliente autenticado)
export const getMiReseña = async (producto_id, token) => {
  const res = await axios.get(`${API_URL}/mi-reseña/${producto_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Crear o actualizar reseña
export const crearReseña = async (data, token) => {
  const res = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Admin: listar todas
export const getReseñasEmpresa = async (token) => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Admin: toggle activo
export const toggleReseña = async (id, token) => {
  const res = await axios.patch(`${API_URL}/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Admin: eliminar
export const eliminarReseña = async (id, token) => {
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
