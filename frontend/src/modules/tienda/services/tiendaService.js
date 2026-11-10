import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api`;

export const getEmpresasPublicas = async () => {
  try {
    const res = await axios.get(`${API_URL}/empresas/publicas`);
    return res.data;
  } catch (error) {
    console.error("Error getEmpresasPublicas:", error);
    return [];
  }
};

export const crearPedido = async (data, token) => {
  try {
    const res = await axios.post(`${API_URL}/pedidos`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al crear pedido" };
  }
};

export const getMisPedidos = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/pedidos/mis-pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error getMisPedidos:", error);
    return [];
  }
};

export const getMetodosPago = async () => {
  try {
    const res = await axios.get(`${API_URL}/metodo_pago`);
    return res.data;
  } catch (error) {
    console.error("Error getMetodosPago:", error);
    return [];
  }
};