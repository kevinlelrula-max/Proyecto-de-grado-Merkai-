import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/ventas`;

export const crearVenta = async (data, token) => {
  const res = await axios.post(API, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

// ✅ Nuevo — trae solo las ventas de hoy para el historial y la caja
export const listarVentasHoy = async (token) => {
  const res = await axios.get(`${API}/empresa`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { hoy: true } // el backend filtra por fecha de hoy
  });
  return res.data;
};
 