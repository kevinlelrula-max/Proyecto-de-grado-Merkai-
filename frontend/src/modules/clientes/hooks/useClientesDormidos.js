import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useClientesDormidos() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/reportesEmpresa/inicio`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setClientes(data?.clientesDormidos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { clientes, loading };
}
