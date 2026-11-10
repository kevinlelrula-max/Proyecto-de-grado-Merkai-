import { useState, useEffect } from "react";
import { getEmpresasPublicas } from "../services/tiendaService";

export function useEmpresas() {
  const [empresas, setEmpresas]   = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [busqueda, setBusqueda]   = useState("");
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    (async () => {
      setCargando(true);
      setError(null);
      const data = await getEmpresasPublicas();
      if (!data || data.error) {
        setError("No se pudieron cargar las empresas.");
      } else {
        setEmpresas(data);
        setFiltradas(data);
      }
      setCargando(false);
    })();
  }, []);

  useEffect(() => {
    const q = busqueda.toLowerCase().trim();
    setFiltradas(
      q
        ? empresas.filter(
            (e) =>
              e.nombre.toLowerCase().includes(q) ||
              (e.nit ?? "").includes(q)
          )
        : empresas
    );
  }, [busqueda, empresas]);

  return { empresas, filtradas, busqueda, setBusqueda, cargando, error };
}
