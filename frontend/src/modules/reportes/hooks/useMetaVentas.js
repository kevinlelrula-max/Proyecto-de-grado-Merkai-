import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useMetaVentas() {
  const [ventasMes, setVentasMes] = useState(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/reportesEmpresa/inicio`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setVentasMes(data?.ventasMes || 0))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { ventasMes, loading };
}
