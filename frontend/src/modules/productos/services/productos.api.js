import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/productos`;

export const getProductos = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ✅ Ahora recibe FormData para poder enviar imagen + datos
export const crearProducto = async (formData, token) => {
  const res = await axios.post(API, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
};

// ✅ Igual con actualizar
export const actualizarProducto = async (id, formData, token) => {
  const res = await axios.put(`${API}/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
};

export const eliminarProducto = async (id, token) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const cambiarEstadoProducto = async (id, token) => {
  const res = await axios.patch(`${API}/${id}/estado`, null, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const eliminarImagenProducto = async (productoId, imgId, token) => {
  const res = await axios.delete(`${API}/${productoId}/imagen/${imgId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};