import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/usuarios`;

export const getUsuarios = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const crearUsuario = async (data, token) => {
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const actualizarUsuario = async (id, data, token) => {
  const res = await axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const toggleUsuario = async (id, token) => {
  const res = await axios.patch(`${API}/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const eliminarUsuario = async (id, token) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getRoles = async (token) => {
  const res = await axios.get(`${API}/roles`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const crearRol = async (data, token) => {
  const res = await axios.post(`${API}/roles`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};