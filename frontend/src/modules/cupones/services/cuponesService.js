import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const headers = (token) => ({ Authorization: `Bearer ${token}` });

export const getCupones = (token) =>
  axios.get(`${API_URL}/api/cupones`, { headers: headers(token) }).then((r) => r.data);

export const crearCupon = (data, token) =>
  axios.post(`${API_URL}/api/cupones`, data, { headers: headers(token) }).then((r) => r.data);

export const actualizarCupon = (id, data, token) =>
  axios.put(`${API_URL}/api/cupones/${id}`, data, { headers: headers(token) }).then((r) => r.data);

export const toggleCupon = (id, token) =>
  axios.patch(`${API_URL}/api/cupones/${id}/toggle`, {}, { headers: headers(token) }).then((r) => r.data);

export const eliminarCupon = (id, token) =>
  axios.delete(`${API_URL}/api/cupones/${id}`, { headers: headers(token) }).then((r) => r.data);

export const getUsosCupon = (id, token) =>
  axios.get(`${API_URL}/api/cupones/${id}/usos`, { headers: headers(token) }).then((r) => r.data);

export const validarCupon = (data) =>
  axios.post(`${API_URL}/api/cupones/validar`, data).then((r) => r.data);
