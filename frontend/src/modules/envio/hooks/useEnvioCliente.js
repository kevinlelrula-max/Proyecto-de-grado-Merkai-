import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useEnvioCliente(empresa_id) {
  const [config,          setConfig]          = useState(null);
  const [depSeleccionado, setDepSeleccionado] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(false);

  useEffect(() => {
    if (!empresa_id) return;
    fetch(`${API_URL}/api/envio/publico/${empresa_id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setConfig(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [empresa_id]);

  // Costo del departamento seleccionado:
  // 1. Si tiene costo específico → usarlo (0 = gratis)
  // 2. Si no → usar el costo por defecto
  const costoAplicado = (() => {
    if (depSeleccionado === null) return 0;
    const costosDepts = config?.costos_departamentos || {};
    const key = String(depSeleccionado);
    if (key in costosDepts) return Number(costosDepts[key]);
    return config?.costo_defecto ?? 0;
  })();

  const esGratis = depSeleccionado !== null && costoAplicado === 0;

  // IDs de departamentos con envío gratis (costo === 0)
  const departamentos = Object.entries(config?.costos_departamentos || {})
    .filter(([, costo]) => Number(costo) === 0)
    .map(([id]) => Number(id));

  // Solo se exige elegir departamento si la tienda configuró costos de envío
  const requiereDepartamento =
    (config?.costo_defecto ?? 0) > 0 ||
    Object.keys(config?.costos_departamentos || {}).length > 0;

  return {
    requiereDepartamento,
    costoEnvio:              config?.costo_defecto ?? 0,
    departamentos,
    depSeleccionado,
    seleccionarDepartamento: setDepSeleccionado,
    esGratis,
    costoAplicado,
    loading,
    error,
  };
}
