import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Catálogo de pasarelas disponibles ────────────────────────────────────────
export const PASARELAS = [
  {
    key:         "wompi",
    nombre:      "Wompi",
    emoji:       "🏦",
    pais:        "🇨🇴 Colombia",
    descripcion: "Compañía del Grupo Bancolombia. Acepta tarjetas, PSE, Nequi y Bancolombia.",
    metodos:     ["Tarjeta crédito/débito", "PSE", "Nequi", "Bancolombia"],
    docs:        "https://docs.wompi.co",
    colorBrand:  "#7B3FE4",
    camposLlave: {
      publica: { label: "Llave pública",  placeholder: "pub_test_..." },
      privada: { label: "Llave privada",  placeholder: "prv_test_..." },
    },
  },
  {
    key:         "stripe",
    nombre:      "Stripe",
    emoji:       "💳",
    pais:        "🌍 Internacional",
    descripcion: "Líder mundial en pagos online. Ideal para tarjetas internacionales.",
    metodos:     ["Visa", "Mastercard", "American Express", "Apple Pay"],
    docs:        "https://stripe.com/docs",
    colorBrand:  "#635BFF",
    camposLlave: {
      publica: { label: "Publishable key", placeholder: "pk_test_..." },
      privada: { label: "Secret key",      placeholder: "sk_test_..." },
    },
  },
  {
    key:         "payu",
    nombre:      "PayU",
    emoji:       "💰",
    pais:        "🇨🇴 Colombia",
    descripcion: "Acepta pagos con múltiples métodos: tarjeta, PSE y efectivo.",
    metodos:     ["Tarjeta crédito/débito", "PSE", "Efecty", "Baloto"],
    docs:        "https://developers.payulatam.com",
    colorBrand:  "#00B1A5",
    camposLlave: {
      publica: { label: "API Key",   placeholder: "4Vj8eK4rloUd..." },
      privada: { label: "API Login", placeholder: "pRRXKOl8ikMmt..." },
    },
  },
  {
    key:         "mercadopago",
    nombre:      "MercadoPago",
    emoji:       "🛒",
    pais:        "🌎 Latinoamérica",
    descripcion: "La pasarela líder en Latinoamérica. Acepta tarjetas, PSE y efectivo.",
    metodos:     ["Tarjeta crédito/débito", "PSE", "Efectivo", "Mercado Crédito"],
    docs:        "https://www.mercadopago.com.co/developers",
    colorBrand:  "#009EE3",
    camposLlave: {
      publica: { label: "Public key",   placeholder: "APP_USR-..." },
      privada: { label: "Access token", placeholder: "APP_USR-..." },
    },
  },
];

export function useIntegraciones() {
  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [integraciones, setIntegraciones] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [guardando, setGuardando]         = useState(null);
  const [error, setError]                 = useState("");
  const [exito, setExito]                 = useState("");

  // ── Cargar
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/integraciones`, { headers });
      setIntegraciones(res.data);
    } catch {
      setError("No se pudieron cargar las integraciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Guardar (conectar o actualizar llaves)
  const guardar = useCallback(async (proveedor, llavePublica, llavePrivada) => {
    setGuardando(proveedor);
    setError("");
    setExito("");
    try {
      const res = await axios.post(
        `${API_URL}/api/integraciones`,
        { proveedor, llave_publica: llavePublica, llave_privada: llavePrivada },
        { headers }
      );
      setIntegraciones(prev => {
        const existe = prev.find(i => i.proveedor === proveedor);
        if (existe) return prev.map(i => i.proveedor === proveedor ? { ...i, ...res.data } : i);
        return [...prev, res.data];
      });
      setExito(proveedor);
      setTimeout(() => setExito(""), 3000);
      toast.success(`${proveedor} conectado correctamente`);
    } catch (e) {
      const msg = e.response?.data?.error || "Error al guardar integración.";
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(null);
    }
  }, []);

  // ── Toggle activo/pausado
  const toggle = useCallback(async (proveedor) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/integraciones/${proveedor}/toggle`,
        {},
        { headers }
      );
      setIntegraciones(prev =>
        prev.map(i => i.proveedor === proveedor ? { ...i, activo: res.data.activo } : i)
      );
      toast.success(res.data.activo ? `${proveedor} activado` : `${proveedor} pausado`);
    } catch {
      setError("Error al cambiar estado.");
      toast.error("Error al cambiar estado de la integración");
    }
  }, []);

  // ── Desconectar
  const desconectar = useCallback(async (proveedor) => {
    try {
      await axios.delete(`${API_URL}/api/integraciones/${proveedor}`, { headers });
      setIntegraciones(prev => prev.filter(i => i.proveedor !== proveedor));
      toast.success(`${proveedor} desconectado`);
    } catch {
      setError("Error al desconectar.");
      toast.error("Error al desconectar la integración");
    }
  }, []);

  // ── Helper: obtener datos de una integración conectada
  const getConectada = (proveedor) =>
    integraciones.find(i => i.proveedor === proveedor);

  return {
    integraciones,
    loading,
    guardando,
    error,
    exito,
    cargar,
    guardar,
    toggle,
    desconectar,
    getConectada,
  };
}
