import { useState, useCallback } from "react";
import { getSesionActiva, getHistorialCaja, abrirCaja, cerrarCaja } from "../services/caja.api";

// Todos los totales los calcula el servidor para la sesión de caja abierta
// (solo ventas del punto de venta hechas desde la apertura).
export function useCaja() {
  const [sesion,    setSesion]    = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [msg,       setMsg]       = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [sesionData, histData] = await Promise.allSettled([
        getSesionActiva(),
        getHistorialCaja(),
      ]);
      setSesion(sesionData.status === "fulfilled" ? sesionData.value : null);
      setHistorial(histData.status === "fulfilled" ? histData.value.slice(0, 10) : []);
    } finally {
      setCargando(false);
    }
  }, []);

  const handleAbrir = useCallback(async (monto_apertura) => {
    try {
      await abrirCaja(monto_apertura);
      setMsg({ tipo: "ok", texto: "Caja abierta. Ya puedes registrar ventas." });
      await cargar();
      return true;
    } catch (err) {
      setMsg({ tipo: "error", texto: err.message });
      return false;
    }
  }, [cargar]);

  const handleCerrar = useCallback(async (sesion_id, observaciones) => {
    try {
      const cerrada = await cerrarCaja(sesion_id, observaciones);
      setMsg({
        tipo: "ok",
        texto: `Caja cerrada. Efectivo en caja: $${Number(cerrada.monto_cierre || 0).toLocaleString("es-CO")}`,
      });
      await cargar();
      return true;
    } catch (err) {
      setMsg({ tipo: "error", texto: err.message });
      return false;
    }
  }, [cargar]);

  const limpiarMsg = useCallback(() => setMsg(null), []);

  const totalVentas = sesion?.ventas_cantidad ?? 0;
  const totalSesion = Number(sesion?.ventas_total ?? 0);
  const promedio    = totalVentas ? totalSesion / totalVentas : 0;
  const porMetodo   = (sesion?.por_metodo ?? []).reduce((acc, m) => {
    acc[m.metodo] = Number(m.total);
    return acc;
  }, {});

  return {
    cargando, sesion, historial,
    totalSesion, totalVentas, promedio, porMetodo,
    msg, limpiarMsg,
    cargar, handleAbrir, handleCerrar,
  };
}
