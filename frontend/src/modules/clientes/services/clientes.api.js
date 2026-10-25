import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/clientes`;

export const getClientes = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const crearCliente = async (data, token) => {
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const actualizarCliente = async (id, data, token) => {
  const res = await axios.put(`${API}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const eliminarCliente = async (id, token) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const cambiarEstadoCliente = async (id, token) => {
  const res = await axios.patch(`${API}/${id}/estado`, null, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const anonimizarCliente = async (id, token) => {
  const res = await axios.post(`${API}/${id}/anonimizar`, null, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const buscarClientes = async (query, token) => {
  const res = await axios.get(`${API}/buscar?q=${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};