import { useState, useEffect, useCallback } from "react";
import { fetchResumenInicio } from "../services/inicio.api";

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getNombreUsuario() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "Usuario";
    return JSON.parse(atob(token.split(".")[1]))?.usuario || "Usuario";
  } catch {
    return "Usuario";
  }
}

export function useInicio() {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const cargarResumen = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchResumenInicio();
      setResumen(data);
    } catch (e) {
      setError(e.message || "No se pudo cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarResumen();
    const intervalo = setInterval(cargarResumen, 60_000);
    return () => clearInterval(intervalo);
  }, [cargarResumen]);

  return {
    resumen,
    loading,
    error,
    saludo:             getSaludo(),
    nombreUsuario:      getNombreUsuario(),
    onboarding:         resumen?.onboarding || null,
    esOnboardingCompleto: resumen?.onboarding?.completo ?? false,
    refetch:            cargarResumen,
  };
}
