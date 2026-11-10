import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useStockPredictor() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/reportesEmpresa/predictor-avanzado`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setProductos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const criticos = productos.filter(p => {
    const d = parseFloat(p.dias_hasta_agotarse);
    return isNaN(d) || d <= 3;
  });

  const urgentes = productos.filter(p => {
    const d = parseFloat(p.dias_hasta_agotarse);
    return !isNaN(d) && d > 3 && d <= 7;
  });

  return { productos, criticos, urgentes, loading };
}
