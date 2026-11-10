import { useState, useEffect } from "react";
import { buscarClientes } from "../../clientes/services/clientes.api";
export function useClientes(token) {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    if (busqueda.length < 2) {
      setClientes([]);
      return;
    }

    const timer = setTimeout(async () => {
      const data = await buscarClientes(busqueda, token);
      setClientes(data);
    }, 400);

    return () => clearTimeout(timer);
  }, [busqueda]);

  return { busqueda, setBusqueda, clientes, setClientes };
}