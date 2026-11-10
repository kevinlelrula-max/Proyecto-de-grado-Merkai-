import { useState, useCallback } from "react";

export function useTiendaOnline(slug) {
  const [copiado, setCopiado] = useState(false);

  // ✅ Link generado dinámicamente — funciona en local y en producción
  const linkTienda = slug
    ? `${window.location.origin}/tienda/${slug}`
    : "";

  const copiarLink = useCallback(() => {
    if (!linkTienda) return;
    navigator.clipboard.writeText(linkTienda).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }, [linkTienda]);

  const abrirTienda = useCallback(() => {
    if (!linkTienda) return;
    window.open(linkTienda, "_blank");
  }, [linkTienda]);

  return {
    linkTienda,
    copiado,
    copiarLink,
    abrirTienda,
  };
}