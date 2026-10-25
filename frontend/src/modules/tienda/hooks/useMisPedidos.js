import { useState, useEffect, useCallback, useRef } from "react";
import { getMisPedidos, getEstadoPedido } from "../../../services/api";

const POLL_INTERVAL = 30000; // 30 segundos

// Estados con color y label visual
export const ESTADOS = {
  pendiente:      { label: "Pendiente",      color: "#f59e0b", bg: "#fffbeb" },
  confirmado:     { label: "Confirmado",     color: "#3b82f6", bg: "#eff6ff" },
  en_preparacion: { label: "En preparación", color: "#8b5cf6", bg: "#f5f3ff" },
  enviado:        { label: "Enviado",         color: "#0e7490", bg: "#ecfeff" },
  entregado:      { label: "Entregado",       color: "#15803d", bg: "#f0fdf4" },
  cancelado:      { label: "Cancelado",       color: "#ef4444", bg: "#fef2f2" },
};

export function useMisPedidos() {
  const [pedidos,      setPedidos]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [notifPermiso, setNotifPermiso] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const clienteToken  = localStorage.getItem("cliente_token");
  const clienteNombre = localStorage.getItem("cliente_nombre");
  const estaLogueado  = !!clienteToken;

  const prevEstadosRef = useRef(new Map());

  const pedirPermiso = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const permiso = await Notification.requestPermission();
    setNotifPermiso(permiso);
  }, []);

  // Cargar todos los pedidos
  const fetchPedidos = useCallback(async () => {
    if (!clienteToken) return;
    try {
      let data = await getMisPedidos(clienteToken);

      // Pagos con tarjeta que siguen pendientes: se verifican directamente con Stripe
      // (cubre pagos que redirigen o que el cliente dejó a medias, sin depender del webhook)
      const porVerificar = data.filter(p => p.estado === "pendiente" && p.metodo_pago?.toLowerCase() === "tarjeta");
      if (porVerificar.length > 0) {
        const base = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const resultados = await Promise.all(porVerificar.map(p =>
          fetch(`${base}/api/pagos/confirmar-stripe`, {
            method:  "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${clienteToken}` },
            body:    JSON.stringify({ pedido_id: p.id }),
          }).then(r => (r.ok ? r.json() : null)).catch(() => null)
        ));
        if (resultados.some(r => r && r.estado && r.estado !== "pendiente")) {
          data = await getMisPedidos(clienteToken);
        }
      }

      // Inicializar mapa de estados (sin notificar en la carga inicial)
      data.forEach(p => prevEstadosRef.current.set(p.id, p.estado));
      setPedidos(data);
    } catch {
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [clienteToken]);

  // Carga inicial
  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Polling — actualiza estado de pedidos activos cada 30 seg
  useEffect(() => {
    if (!clienteToken) return;

    const interval = setInterval(async () => {
      // Solo hacer polling de pedidos que no estén finalizados
      const pedidosActivos = pedidos.filter(
        (p) => !["entregado", "cancelado"].includes(p.estado)
      );

      if (pedidosActivos.length === 0) return;

      // Actualizar estado de cada pedido activo
      const actualizaciones = await Promise.all(
        pedidosActivos.map((p) => getEstadoPedido(p.id, clienteToken))
      );

      // Notificar cambios de estado
      actualizaciones.forEach(actualizado => {
        if (!actualizado) return;
        const estadoPrev = prevEstadosRef.current.get(actualizado.id);
        if (
          estadoPrev &&
          estadoPrev !== actualizado.estado &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          const estadoInfo = ESTADOS[actualizado.estado];
          new Notification(`Tu pedido #${actualizado.id} fue actualizado`, {
            body: `Estado: ${estadoInfo?.label ?? actualizado.estado}`,
            icon: "/favicon.ico",
          });
        }
        prevEstadosRef.current.set(actualizado.id, actualizado.estado);
      });

      setPedidos((prev) =>
        prev.map((pedido) => {
          const actualizado = actualizaciones.find(
            (a) => a && a.id === pedido.id
          );
          if (actualizado && actualizado.estado !== pedido.estado) {
            return { ...pedido, estado: actualizado.estado, fecha_actualizacion: actualizado.fecha_actualizacion };
          }
          return pedido;
        })
      );
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [clienteToken, pedidos]);

  return {
    pedidos,
    loading,
    error,
    estaLogueado,
    clienteNombre,
    refetch: fetchPedidos,
    notifPermiso,
    pedirPermiso,
  };
}