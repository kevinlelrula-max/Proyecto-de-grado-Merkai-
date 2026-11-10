import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useEnvioConfig() {
  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [costoDefecto,          setCostoDefecto]          = useState(0);
  const [costosDepts,           setCostosDepts]           = useState({});
  const [departamentos,         setDepartamentos]         = useState([]);
  const [loading,               setLoading]               = useState(true);
  const [guardando,             setGuardando]             = useState(false);
  const [error,                 setError]                 = useState("");
  const [exito,                 setExito]                 = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/ubicacion/departamentos`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setDepartamentos(data))
      .catch(() => {});
  }, []);

  const cargarConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/envio`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCostoDefecto(data.costo_defecto || 0);
      setCostosDepts(data.costos_departamentos || {});
    } catch {
      setError("Error al cargar la configuración de envío");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarConfig(); }, [cargarConfig]);

  const setCostoDept = (deptId, valor) => {
    if (valor === undefined) {
      setCostosDepts(prev => {
        const nuevo = { ...prev };
        delete nuevo[String(deptId)];
        return nuevo;
      });
    } else {
      const costo = valor === "" ? "" : Math.max(0, Number(valor));
      setCostosDepts(prev => ({ ...prev, [String(deptId)]: costo }));
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    setExito(false);
    // Limpiar entradas vacías antes de guardar
    const costosLimpios = Object.fromEntries(
      Object.entries(costosDepts).filter(([, v]) => v !== "")
    );
    try {
      const res = await fetch(`${API_URL}/api/envio`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ costo_defecto: costoDefecto, costos_departamentos: costosLimpios }),
      });
      if (!res.ok) throw new Error();
      setCostosDepts(costosLimpios);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
      toast.success("Configuración de envío guardada");
    } catch {
      setError("Error al guardar la configuración");
      toast.error("Error al guardar la configuración de envío");
    } finally {
      setGuardando(false);
    }
  };

  return {
    costoDefecto, setCostoDefecto,
    costosDepts, setCostoDept,
    departamentos,
    loading, guardando, error, exito,
    guardar,
  };
}
