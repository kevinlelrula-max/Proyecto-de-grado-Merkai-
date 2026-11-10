import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { imgUrl } from "../../../utils/imgUrl";
import Estrellas from "../../reseñas/components/Estrellas";

const PLACEHOLDER = null;

function useCardState(producto, onAgregar) {
  const [cantidad, setCantidad] = useState(1);
  const [añadido, setAñadido]   = useState(false);
  const navigate      = useNavigate();
  const { empresaSlug } = useParams();
  const sinStock = producto.stock <= 0;
  const precioMostrar  = producto.precio_final ?? parseFloat(producto.precio);
  const precioOriginal = parseFloat(producto.precio);
  const tieneDescuento = producto.tiene_descuento && precioMostrar < precioOriginal;
  const imagenes = producto.imagenes?.length > 0
    ? producto.imagenes
    : (producto.imagen_url ? [{ url: producto.imagen_url }] : []);
  const imgSrc = imagenes[0] ? imgUrl(imagenes[0].url) : null;

  const handleAgregar = () => {
    if (sinStock) return;
    onAgregar({ ...producto, precio: precioMostrar }, cantidad);
    setAñadido(true);
    setTimeout(() => setAñadido(false), 1500);
  };
  const irDetalle = () => {
    const empresa = JSON.parse(localStorage.getItem("ultima_empresa") || "null");
    navigate(`/tienda/${empresaSlug}/producto/${producto.id}`, { state: { empresa, producto } });
  };
  return { cantidad, setCantidad, añadido, sinStock, precioMostrar, precioOriginal, tieneDescuento, imgSrc, handleAgregar, irDetalle };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTÁNDAR
// ─────────────────────────────────────────────────────────────────────────────
export function CardEstandar({ producto, onAgregar, statsReseña, onVerReseñas, colorMarca = "#0F6E56" }) {
  const [hovered, setHovered] = useState(false);
  const { añadido, sinStock, precioMostrar, precioOriginal, tieneDescuento, imgSrc, handleAgregar, irDetalle } = useCardState(producto, onAgregar);

  return (
    <div
      style={{ backgroundColor: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.2s", boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.05)", transform: hovered && !sinStock ? "translateY(-2px)" : "none", opacity: sinStock ? 0.65 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div onClick={irDetalle} style={{ height: 160, backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#e2e8f0" }} />}
        {sinStock && <div style={{ position: "absolute", top: 8, left: 8, backgroundColor: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>Sin stock</div>}
        {tieneDescuento && !sinStock && <div style={{ position: "absolute", top: 8, right: 8, backgroundColor: `${colorMarca}15`, color: colorMarca, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>Precio especial</div>}
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, cursor: "pointer" }} onClick={irDetalle}>{producto.nombre}</h3>
        {statsReseña && Number(statsReseña.total) > 0 && (
          <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onVerReseñas}>
            <Estrellas valor={Math.round(parseFloat(statsReseña.promedio))} tamaño="sm" color={colorMarca} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{parseFloat(statsReseña.promedio).toFixed(1)} ({statsReseña.total})</span>
          </button>
        )}
        {producto.descripcion && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{producto.descripcion}</p>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto" }}>
          {tieneDescuento && <span style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>${precioOriginal.toLocaleString("es-CO")}</span>}
          <span style={{ fontSize: 18, fontWeight: 800, color: colorMarca }}>${precioMostrar.toLocaleString("es-CO")}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>/ {producto.unidad || "unidad"}</span>
        </div>
        <button
          style={{ width: "100%", padding: "9px 0", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: sinStock ? "not-allowed" : "pointer", backgroundColor: añadido ? "#059669" : sinStock ? "#e2e8f0" : colorMarca, transition: "background 0.2s" }}
          onClick={handleAgregar} disabled={sinStock}
        >
          {añadido ? "Añadido" : sinStock ? "Sin stock" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MINIMALISTA
// ─────────────────────────────────────────────────────────────────────────────
export function CardMinimalista({ producto, onAgregar, statsReseña, onVerReseñas, colorMarca = "#0F6E56" }) {
  const [hovered, setHovered] = useState(false);
  const { añadido, sinStock, precioMostrar, precioOriginal, tieneDescuento, imgSrc, handleAgregar, irDetalle } = useCardState(producto, onAgregar);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 10, opacity: sinStock ? 0.55 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen cuadrada */}
      <div onClick={irDetalle} style={{ aspectRatio: "1/1", borderRadius: 12, overflow: "hidden", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
        {imgSrc
          ? <img src={imgSrc} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.04)" : "scale(1)" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#e2e8f0" }} />}
        {sinStock && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#ef4444" }}>Sin stock</div>}
      </div>
      {/* Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, cursor: "pointer" }} onClick={irDetalle}>{producto.nombre}</h3>
        {statsReseña && Number(statsReseña.total) > 0 && (
          <button style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onVerReseñas}>
            <Estrellas valor={Math.round(parseFloat(statsReseña.promedio))} tamaño="sm" color={colorMarca} />
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            {tieneDescuento && <span style={{ fontSize: 11, color: "#cbd5e1", textDecoration: "line-through" }}>${precioOriginal.toLocaleString("es-CO")}</span>}
            <span style={{ fontSize: 15, fontWeight: 700, color: colorMarca }}>${precioMostrar.toLocaleString("es-CO")}</span>
          </div>
          {!sinStock && (
            <button
              style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${añadido ? "#059669" : colorMarca}`, backgroundColor: añadido ? "#059669" : "transparent", color: añadido ? "white" : colorMarca, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
              onClick={handleAgregar}
            >
              {añadido ? "✓" : "+"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OSCURA
// ─────────────────────────────────────────────────────────────────────────────
export function CardOscura({ producto, onAgregar, statsReseña, onVerReseñas, colorMarca = "#0F6E56" }) {
  const [hovered, setHovered] = useState(false);
  const { añadido, sinStock, precioMostrar, precioOriginal, tieneDescuento, imgSrc, handleAgregar, irDetalle } = useCardState(producto, onAgregar);

  return (
    <div
      style={{ backgroundColor: "#0f172a", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid rgba(255,255,255,0.07)`, transition: "all 0.2s", boxShadow: hovered ? `0 0 0 1px ${colorMarca}60, 0 12px 32px rgba(0,0,0,0.3)` : "none", opacity: sinStock ? 0.55 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div onClick={irDetalle} style={{ height: 160, backgroundColor: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.05)" : "scale(1)" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#e2e8f0" }} />}
        {sinStock && <div style={{ position: "absolute", top: 8, left: 8, backgroundColor: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>Sin stock</div>}
        {tieneDescuento && !sinStock && <div style={{ position: "absolute", top: 8, right: 8, backgroundColor: `${colorMarca}30`, color: colorMarca, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>Precio especial</div>}
      </div>
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0, cursor: "pointer" }} onClick={irDetalle}>{producto.nombre}</h3>
        {statsReseña && Number(statsReseña.total) > 0 && (
          <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onVerReseñas}>
            <Estrellas valor={Math.round(parseFloat(statsReseña.promedio))} tamaño="sm" color={colorMarca} />
            <span style={{ fontSize: 11, color: "#64748b" }}>({statsReseña.total})</span>
          </button>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto" }}>
          {tieneDescuento && <span style={{ fontSize: 12, color: "#475569", textDecoration: "line-through" }}>${precioOriginal.toLocaleString("es-CO")}</span>}
          <span style={{ fontSize: 22, fontWeight: 900, color: colorMarca }}>${precioMostrar.toLocaleString("es-CO")}</span>
          <span style={{ fontSize: 11, color: "#475569" }}>/ {producto.unidad || "unidad"}</span>
        </div>
        <button
          style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: sinStock ? "not-allowed" : "pointer", backgroundColor: añadido ? "#059669" : sinStock ? "#1e293b" : colorMarca, color: sinStock ? "#475569" : "white", transition: "background 0.2s" }}
          onClick={handleAgregar} disabled={sinStock}
        >
          {añadido ? "✓ Agregado" : sinStock ? "Sin stock" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOUTIQUE
// ─────────────────────────────────────────────────────────────────────────────
export function CardBoutique({ producto, onAgregar, statsReseña, onVerReseñas, colorMarca = "#0F6E56" }) {
  const [hovered, setHovered] = useState(false);
  const { añadido, sinStock, precioMostrar, tieneDescuento, imgSrc, handleAgregar, irDetalle } = useCardState(producto, onAgregar);

  return (
    <div
      style={{ borderRadius: 16, overflow: "hidden", position: "relative", aspectRatio: "3/4", cursor: "pointer", opacity: sinStock ? 0.65 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen de fondo */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#1e293b" }}>
        {imgSrc
          ? <img src={imgSrc} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hovered ? "scale(1.06)" : "scale(1)" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ width: "100%", height: "100%", backgroundColor: "#334155" }} />
        }
      </div>
      {/* Gradiente inferior */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
      {/* Badges */}
      {sinStock && <div style={{ position: "absolute", top: 10, left: 10, backgroundColor: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>Sin stock</div>}
      {tieneDescuento && !sinStock && <div style={{ position: "absolute", top: 10, right: 10, backgroundColor: `${colorMarca}cc`, color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>Especial</div>}
      {/* Info overlay */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }} onClick={irDetalle}>{producto.nombre}</h3>
        {statsReseña && Number(statsReseña.total) > 0 && (
          <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onVerReseñas}>
            <Estrellas valor={Math.round(parseFloat(statsReseña.promedio))} tamaño="sm" color={colorMarca} />
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>${precioMostrar.toLocaleString("es-CO")}</span>
          {!sinStock && (
            <button
              style={{ padding: "7px 14px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: añadido ? "#059669" : colorMarca, color: "white", transition: "all 0.2s", opacity: hovered ? 1 : 0.85 }}
              onClick={e => { e.stopPropagation(); handleAgregar(); }}
            >
              {añadido ? "✓" : "+ Agregar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL
// ─────────────────────────────────────────────────────────────────────────────
export function CardHorizontal({ producto, onAgregar, statsReseña, onVerReseñas, colorMarca = "#0F6E56" }) {
  const [hovered, setHovered] = useState(false);
  const { añadido, sinStock, precioMostrar, precioOriginal, tieneDescuento, imgSrc, handleAgregar, irDetalle } = useCardState(producto, onAgregar);

  return (
    <div
      style={{ backgroundColor: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "row", transition: "all 0.2s", boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.08)" : "none", opacity: sinStock ? 0.65 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen izquierda */}
      <div onClick={irDetalle} style={{ width: 120, flexShrink: 0, backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden" }}>
        {imgSrc
          ? <img src={imgSrc} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
          : <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#e2e8f0" }} />}
        {sinStock && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444" }}>Sin stock</span></div>}
      </div>
      {/* Info derecha */}
      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, cursor: "pointer" }} onClick={irDetalle}>{producto.nombre}</h3>
        {statsReseña && Number(statsReseña.total) > 0 && (
          <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={onVerReseñas}>
            <Estrellas valor={Math.round(parseFloat(statsReseña.promedio))} tamaño="sm" color={colorMarca} />
            <span style={{ fontSize: 11, color: "#64748b" }}>({statsReseña.total})</span>
          </button>
        )}
        {producto.descripcion && <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{producto.descripcion}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {tieneDescuento && <span style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>${precioOriginal.toLocaleString("es-CO")}</span>}
            <span style={{ fontSize: 17, fontWeight: 800, color: colorMarca }}>${precioMostrar.toLocaleString("es-CO")}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>/ {producto.unidad || "unidad"}</span>
          </div>
          <button
            style={{ padding: "7px 14px", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: sinStock ? "not-allowed" : "pointer", backgroundColor: añadido ? "#059669" : sinStock ? "#e2e8f0" : colorMarca, flexShrink: 0, transition: "background 0.2s" }}
            onClick={handleAgregar} disabled={sinStock}
          >
            {añadido ? "✓" : sinStock ? "Sin stock" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR — exporta la tarjeta correcta según el estilo
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductoCardEstilo({ estilo = "estandar", ...props }) {
  if (estilo === "minimalista") return <CardMinimalista {...props} />;
  if (estilo === "oscuro")      return <CardOscura      {...props} />;
  if (estilo === "boutique")    return <CardBoutique    {...props} />;
  if (estilo === "horizontal")  return <CardHorizontal  {...props} />;
  return <CardEstandar {...props} />;
}
