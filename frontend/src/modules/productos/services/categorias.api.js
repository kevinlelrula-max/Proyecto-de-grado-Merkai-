import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/categorias`;

export const getCategorias = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const crearCategoria = async (data, token) => {
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const actualizarCategoria = async (id, data, token) => {
  const res = await axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const toggleCategoria = async (id, token) => {
  const res = await axios.patch(`${API}/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const eliminarCategoria = async (id, token) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};