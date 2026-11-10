import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:3000/api";

// =========================
// 🔹 REGISTRO USUARIO
// =========================
export const register = async (data, token) => {
  try {
    const res = await axios.post(`${API_URL}/usuarios`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en registro" };
  }
};

// =========================
// 🔹 REGISTRO EMPRESA
// =========================
export const registroEmpresa = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/empresa/registro`, data);
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en registro empresa" };
  }
};

// =========================
// 🔹 LOGIN EMPRESA
// =========================
export const loginEmpresa = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, data);
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en login empresa" };
  }
};

export const loginGoogleEmpresa = async (credential) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login/google`, { credential });
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en login con Google" };
  }
};

// =========================
// 🔹 LOGIN USUARIO
// =========================
export const login = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/usuarios/login`, data);
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en login de usuario" };
  }
};

// =========================
// 🛒 REGISTRO CLIENTE (tienda)
// =========================
export const registroCliente = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/clientes/registro`, data);
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en registro de cliente" };
  }
};

// =========================
// 🛒 LOGIN CLIENTE (tienda)
// Permite clientes (rol 4) y usuarios de empresa (roles 1,2,3)
// =========================
export const loginCliente = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/clientes/login`, data);
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error en login de cliente" };
  }
};

export const loginGoogleCliente = async (credential) => {
  try {
    const res = await axios.post(`${API_URL}/clientes/login/google`, { credential });
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al iniciar sesión con Google" };
  }
};

// =========================
// 🛒 EMPRESAS PÚBLICAS (marketplace)
// =========================
export const getEmpresasPublicas = async () => {
  try {
    const res = await axios.get(`${API_URL}/tienda/empresas`);
    return res.data;
  } catch (error) {
    console.error("Error getEmpresasPublicas:", error);
    return [];
  }
};

// =========================
// 🛒 PRODUCTOS PÚBLICOS DE UNA EMPRESA
// =========================
export const getProductosPublicos = async (empresaId) => {
  try {
    const res = await axios.get(`${API_URL}/productos/empresa/${empresaId}`);
    return res.data;
  } catch (error) {
    console.error("Error getProductosPublicos:", error);
    return [];
  }
};

// =========================
// 🛒 CREAR PEDIDO ONLINE
// =========================
export const crearPedidoOnline = async (data, token) => {
  try {
    const res = await axios.post(`${API_URL}/pedidos`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al crear pedido" };
  }
};

// =========================
// 🛒 MIS PEDIDOS (cliente)
// =========================
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

// =========================
// 🛒 ESTADO DE UN PEDIDO (polling)
// =========================
export const getEstadoPedido = async (pedidoId, token) => {
  try {
    const res = await axios.get(`${API_URL}/pedidos/${pedidoId}/estado`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error getEstadoPedido:", error);
    return null;
  }
};

// =========================
// 🔥 PEDIDOS ONLINE (panel cajero)
// =========================
export const getPedidosOnlineEmpresa = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/pedidos/empresa`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error getPedidosOnlineEmpresa:", error);
    return [];
  }
};

// =========================
// 🔥 ACTUALIZAR ESTADO PEDIDO (cajero)
// =========================
export const actualizarEstadoPedido = async (pedidoId, estado, token) => {
  try {
    const res = await axios.patch(
      `${API_URL}/pedidos/${pedidoId}/estado`,
      { estado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al actualizar estado" };
  }
};

// =========================
// 🔹 PRODUCTOS
// =========================
export const getProductos = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const agregarProducto = async (data, token) => {
  try {
    const res = await axios.post(`${API_URL}/productos`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    return { error: "No se pudo agregar el producto" };
  }
};

// =========================
// 🔹 CLIENTES (panel empresa)
// =========================
export const agregarCliente = async (data, token) => {
  try {
    const res = await axios.post(`${API_URL}/usuarios`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    return { error: "No se pudo agregar el cliente" };
  }
};

export const getClientes = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// =========================
// 🔹 VENTAS (POS - CREAR)
// =========================
export const crearVenta = async (data, token) => {
  try {
    const res = await axios.post(`${API_URL}/ventas`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al crear venta" };
  }
};

// =========================
// 🔹 VENTAS (GENERAL)
// =========================
export const getVentas = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/ventas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// =========================
// 🔥 VENTAS EMPRESA (HISTORIAL)
// =========================
export const getVentasEmpresa = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/ventas/empresa`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error getVentasEmpresa:", error);
    return [];
  }
};

// =========================
// 🔹 MÉTODOS DE PAGO
// =========================
export const getMetodosPago = async () => {
  try {
    const res = await axios.get(`${API_URL}/metodo_pago`);
    return res.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

// =========================
// 🔹 REPORTES PRODUCTOS (legacy — ya no se usa en Reportes.jsx)
// =========================
export const getReporteProductos = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/ventas/reportes/productos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error reporte:", error);
    return [];
  }
};

// 🔹 REPORTE EMPRESA COMPLETO (con filtro de período)
// =========================
export const getReporteEmpresa = async (token, periodo = "mes") => {
  try {
    const res = await axios.get(`${API_URL}/reportesEmpresa/resumen?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error reporte empresa:", error);
    return null;
  }
};

export const getReporteRentabilidad = async (token, periodo = "mes") => {
  try {
    const res = await axios.get(`${API_URL}/reportesEmpresa/rentabilidad?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error rentabilidad:", error);
    return null;
  }
};

export const getReporteComparativa = async (token, periodo = "mes") => {
  try {
    const res = await axios.get(`${API_URL}/reportesEmpresa/comparativa?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error comparativa:", error);
    return null;
  }
};

export const getEmpresaPorSlug = async (slug) => {
  try {
    const res = await axios.get(`${API_URL}/empresa/slug/${slug}`);
    return res.data;
  } catch (error) {
    return null;
  }
};

// =========================
// 🤝 VINCULACIÓN ENTRE EMPRESAS
// =========================

// EMP2 envía solicitud de vinculación a EMP1
export const solicitarVinculacion = async (empresa_origen_id, token) => {
  try {
    const res = await axios.post(
      `${API_URL}/empresa/vincular`,
      { empresa_origen_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al enviar solicitud" };
  }
};

// EMP1 ve sus solicitudes pendientes/aceptadas/rechazadas
export const getSolicitudesVinculacion = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/empresa/solicitudes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error getSolicitudes:", error);
    return [];
  }
};

// EMP1 acepta o rechaza una solicitud
export const responderSolicitud = async (solicitudId, estado, token) => {
  try {
    const res = await axios.patch(
      `${API_URL}/empresa/solicitudes/${solicitudId}`,
      { estado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { error: "Error al responder solicitud" };
  }
};

// Ver mi red de empresas vinculadas
export const getMiRed = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/empresa/mi-red`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Error getMiRed:", error);
    return [];
  }
};