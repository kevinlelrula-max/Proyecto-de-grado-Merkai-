/**
 * Estrellas — muestra y/o permite seleccionar una calificación de 1 a 5
 * Props:
 *   valor      : número actual (0-5)
 *   onChange   : (n) => void — si se pasa, las estrellas son interactivas
 *   tamaño     : "sm" | "md" | "lg"  (default "md")
 *   color      : color activo (default "#f59e0b")
 */
import { useState } from "react";

const TAMAÑOS = { sm: 14, md: 18, lg: 24 };

export default function Estrellas({ valor = 0, onChange, tamaño = "md", color = "#f59e0b" }) {
  const [hover, setHover] = useState(0);
  const size  = TAMAÑOS[tamaño] || 18;
  const activo = hover || valor;

  return (
    <span style={{ display: "inline-flex", gap: "2px", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: size,
            cursor: onChange ? "pointer" : "default",
            color: n <= activo ? color : "#d1d5db",
            transition: "color 0.1s",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
