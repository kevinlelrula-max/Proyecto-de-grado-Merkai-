import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const ESTADOS = [
  { key: "pendiente",      label: "Pendiente",   color: "#f59e0b", bg: "#fffbeb" },
  { key: "confirmado",     label: "Confirmado",  color: "#3b82f6", bg: "#eff6ff" },
  { key: "en_preparacion", label: "Preparando",  color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "enviado",        label: "Enviado",     color: "#0ea5e9", bg: "#f0f9ff" },
  { key: "entregado",      label: "Entregado",   color: "#10b981", bg: "#ecfdf5" },
  { key: "cancelado",      label: "Cancelado",   color: "#ef4444", bg: "#fef2f2" },
];

export const SIGUIENTE_ESTADO = {
  pendiente:      "confirmado",
  confirmado:     "en_preparacion",
  en_preparacion: "enviado",
  enviado:        "entregado",
};

export function usePedidosAdmin() {
  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [pedidos,   setPedidos]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [cambiando,    setCambiando]    = useState(null);
  const [notifPermiso, setNotifPermiso] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const prevPendientesRef = useRef(null);

  const pedirPermiso = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const permiso = await Notification.requestPermission();
    setNotifPermiso(permiso);
  }, []);

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/pedidos/empresa`, { headers });
      if (!res.ok) throw new Error("Error al cargar pedidos");
      const nuevos = await res.json();

      const pendientesAhora = nuevos.filter(p => p.estado === "pendiente").length;
      if (
        prevPendientesRef.current !== null &&
        pendientesAhora > prevPendientesRef.current &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const diff = pendientesAhora - prevPendientesRef.current;
        new Notification("Nuevo pedido recibido 🛒", {
          body: `Tienes ${diff} nuevo${diff > 1 ? "s" : ""} pedido${diff > 1 ? "s" : ""} sin atender`,
          icon: "/favicon.ico",
        });
      }
      prevPendientesRef.current = pendientesAhora;
      setPedidos(nuevos);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  // Auto-refresh cada 30 seg
  useEffect(() => {
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setCambiando(pedidoId);
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/estado`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      setPedidos(prev =>
        prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p)
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCambiando(null);
    }
  };

  const conteos = ESTADOS.reduce((acc, e) => {
    acc[e.key] = pedidos.filter(p => p.estado === e.key).length;
    return acc;
  }, {});

  return {
    pedidos,
    loading,
    error,
    cambiando,
    conteos,
    fetchPedidos,
    cambiarEstado,
    notifPermiso,
    pedirPermiso,
  };
}