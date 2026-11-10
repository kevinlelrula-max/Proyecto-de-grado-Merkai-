import { useEffect, useState } from "react";

// true cuando la pantalla es angosta (celular o tablet pequeña). Se actualiza al girar o redimensionar.
export function useEsMovil(maxAncho = 768) {
  const consulta = `(max-width: ${maxAncho}px)`;
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== "undefined" && window.matchMedia(consulta).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const alCambiar = (e) => setEsMovil(e.matches);
    setEsMovil(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, [consulta]);
  return esMovil;
}
