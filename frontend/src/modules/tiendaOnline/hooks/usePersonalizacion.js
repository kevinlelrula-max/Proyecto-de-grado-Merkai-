import { useState, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

export function usePersonalizacion(empresa, cargarConfiguracion) {
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState(null);
  const [exito, setExito]             = useState(false);

  // ── Banner
  const [bannerFile, setBannerFile]       = useState(null);
  const [bannerPreview, setBannerPreview] = useState(empresa?.banner_url
    ? `${BASE_URL}${empresa.banner_url}` : null);

  const handleBannerChange = useCallback((file) => {
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }, []);

  const quitarBanner = useCallback(() => {
    setBannerFile(null);
    setBannerPreview(null);
  }, []);

  // ── Guardar todo
  const guardar = useCallback(async (datosEmpresa) => {
    setGuardando(true);
    setError(null);
    setExito(false);

    try {
      // 1. Guardar datos de empresa
      const res = await fetch(`${BASE_URL}/api/configuracion/empresa`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(datosEmpresa),
      });
      if (!res.ok) throw new Error("Error al guardar datos");

      // 2. Subir banner si hay uno nuevo
      if (bannerFile) {
        const formData = new FormData();
        formData.append("banner", bannerFile);
        const resBanner = await fetch(`${BASE_URL}/api/configuracion/banner`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        });
        if (!resBanner.ok) throw new Error("Error al subir banner");
        setBannerFile(null);
      }

      await cargarConfiguracion();
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      setError(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }, [bannerFile, cargarConfiguracion]);

  return {
    guardando, error, exito,
    bannerPreview, bannerFile,
    handleBannerChange, quitarBanner,
    guardar,
  };
}