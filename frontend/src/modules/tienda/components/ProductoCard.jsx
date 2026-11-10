import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Estrellas from "../../reseñas/components/Estrellas";

import { imgUrl } from "../../../utils/imgUrl";


export default function ProductoCard({ producto, onAgregar, statsReseña, onVerReseñas, colorMarca = "#0F6E56" }) {
  const [cantidad, setCantidad] = useState(1);
  const [hovered, setHovered]   = useState(false);
  const [añadido, setAñadido]   = useState(false);
  const [imgIdx, setImgIdx]     = useState(0);

  const navigate      = useNavigate();
  const { empresaSlug } = useParams();

  const irAlDetalle = () => {
    if (!empresaSlug) return;
    const empresa = JSON.parse(localStorage.getItem("ultima_empresa") || "null");
    navigate(`/tienda/${empresaSlug}/producto/${producto.id}`, { state: { empresa, producto } });
  };

  // Unificar fuentes de imágenes: array nuevo o imagen_url legacy
  const imagenes = producto.imagenes?.length > 0
    ? producto.imagenes
    : (producto.imagen_url ? [{ url: producto.imagen_url }] : []);

  const sinStock = producto.stock <= 0;

  // ✅ Usar precio_final si existe (precio inteligente), sino precio normal
  const precioMostrar   = producto.precio_final ?? parseFloat(producto.precio);
  const precioOriginal  = parseFloat(producto.precio);
  const tieneDescuento  = producto.tiene_descuento && precioMostrar < precioOriginal;

  // Unidad de medida
  const unidad = producto.unidad || "unidad";
  const esGranel = ["kg", "gramo", "litro", "ml", "metro"].includes(unidad);

  const handleAgregar = () => {
    if (sinStock) return;
    // ✅ Pasar producto con precio_final para que el carrito use el precio correcto
    onAgregar({ ...producto, precio: precioMostrar }, cantidad);
    setAñadido(true);
    setTimeout(() => setAñadido(false), 1500);
  };

  const handleCantidad = (delta) => {
    const paso = esGranel ? 0.5 : 1;
    setCantidad((prev) => Math.max(paso, Math.min(prev + delta, producto.stock)));
  };

  const formatCantidad = () => {
    if (esGranel) return `${cantidad.toFixed(1)} ${unidad}`;
    return `${cantidad} ${unidad}`;
  };

  return (
    <div
      style={{
        ...s.card,
        boxShadow: hovered ? "0 12px 32px rgba(15,110,86,0.13)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered && !sinStock ? "translateY(-3px)" : "translateY(0)",
        opacity: sinStock ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagen / carrusel — click navega al detalle */}
      <div
        onClick={irAlDetalle}
        style={{
          ...s.imgWrap,
          backgroundColor: sinStock ? "#f1f5f9" : hovered ? "#E1F5EE" : "#f8fafc",
          cursor: "pointer",
        }}
      >
        {imagenes.length > 0 ? (
          <img
            src={imgUrl(imagenes[imgIdx].url)}
            alt={producto.nombre}
            style={s.img}
          />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#e2e8f0" }} />
        )}

        {/* Flechas de carrusel */}
        {imagenes.length > 1 && (
          <>
            <button
              style={{ ...s.carruselBtn, left: 4 }}
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imagenes.length) % imagenes.length); }}
            >‹</button>
            <button
              style={{ ...s.carruselBtn, right: 4 }}
              onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imagenes.length); }}

            >›</button>
            {/* Dots */}
            <div style={s.dots}>
              {imagenes.map((_, i) => (
                <span key={i} style={{ ...s.dot, opacity: i === imgIdx ? 1 : 0.4 }} />
              ))}
            </div>
          </>
        )}

        {sinStock && <div style={s.sinStockBadge}>Sin stock</div>}

        {tieneDescuento && !sinStock && (
          <div style={s.descuentoBadge}>Precio especial</div>
        )}

        {producto.categoria && !tieneDescuento && (
          <div style={s.categoriaBadge}>{producto.categoria}</div>
        )}
      </div>

      {/* Info */}
      <div style={s.body}>
        <h3 style={{ ...s.nombre, cursor: "pointer" }} onClick={irAlDetalle}>{producto.nombre}</h3>

        {/* Reseñas */}
        {statsReseña && Number(statsReseña.total) > 0 ? (
          <button style={s.reseñasBtn} onClick={onVerReseñas}>
            <Estrellas valor={Math.round(parseFloat(statsReseña.promedio))} tamaño="sm" color={colorMarca} />
            <span style={s.reseñasCount}>
              {parseFloat(statsReseña.promedio).toFixed(1)} ({statsReseña.total})
            </span>
          </button>
        ) : onVerReseñas && (
          <button style={{ ...s.reseñasBtn, ...s.reseñasSinData }} onClick={onVerReseñas}>
            <Estrellas valor={0} tamaño="sm" />
            <span style={s.reseñasCount}>Sin reseñas aún</span>
          </button>
        )}

        {/* Descripción si existe */}
        {producto.descripcion && (
          <p style={s.descripcion}>{producto.descripcion}</p>
        )}

        {/* Precio */}
        <div style={s.precioWrap}>
          {tieneDescuento && (
            <span style={s.precioOriginal}>
              ${precioOriginal.toLocaleString("es-CO")}
            </span>
          )}
          <div style={s.precioRow}>
            <span style={{ ...s.precio, color: tieneDescuento ? "#0F6E56" : "#0F6E56" }}>
              ${precioMostrar.toLocaleString("es-CO")}
            </span>
            <span style={s.unidadLabel}>/ {unidad}</span>
          </div>
          {tieneDescuento && (
            <span style={s.ahorroLabel}>
              Ahorras ${(precioOriginal - precioMostrar).toLocaleString("es-CO")}
            </span>
          )}
        </div>

        {!sinStock && (
          <p style={s.stock}>
            Stock: {Number(producto.stock).toFixed(esGranel ? 1 : 0)} {unidad}
          </p>
        )}

        {/* Selector cantidad */}
        {!sinStock && (
          <div style={s.cantidadRow}>
            <button style={s.cantidadBtn} onClick={() => handleCantidad(esGranel ? -0.5 : -1)}>−</button>
            <span style={s.cantidadVal}>{formatCantidad()}</span>
            <button style={s.cantidadBtn} onClick={() => handleCantidad(esGranel ? 0.5 : 1)}>+</button>
          </div>
        )}

        {/* Subtotal */}
        {!sinStock && (
          <p style={s.subtotal}>
            Subtotal: <strong>${(cantidad * precioMostrar).toLocaleString("es-CO")}</strong>
          </p>
        )}

        {/* Botón agregar */}
        <button
          style={{
            ...s.btnAgregar,
            backgroundColor: añadido ? "#059669" : sinStock ? "#e2e8f0" : "#0F6E56",
            cursor: sinStock ? "not-allowed" : "pointer",
          }}
          onClick={handleAgregar}
          disabled={sinStock}
        >
          {añadido ? "Añadido" : sinStock ? "Sin stock" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

const s = {
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    transition: "all 0.2s ease",
    display: "flex",
    flexDirection: "column",
  },
  imgWrap: {
    height: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "background 0.2s",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  emoji: { fontSize: "52px", lineHeight: 1 },
  carruselBtn: {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: 24, height: 24, borderRadius: "50%",
    backgroundColor: "rgba(15,23,42,0.55)", color: "white",
    border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2, lineHeight: 1,
  },
  dots: {
    position: "absolute", bottom: 6, left: 0, right: 0,
    display: "flex", justifyContent: "center", gap: 4,
  },
  dot: {
    width: 5, height: 5, borderRadius: "50%",
    backgroundColor: "white",
  },
  sinStockBadge: {
    position: "absolute", top: "10px", left: "10px",
    backgroundColor: "#ef4444", color: "white",
    fontSize: "10px", fontWeight: "700",
    padding: "3px 8px", borderRadius: "999px",
  },
  descuentoBadge: {
    position: "absolute", top: "10px", right: "10px",
    backgroundColor: "rgba(251,191,36,0.9)",
    color: "#92400e",
    fontSize: "10px", fontWeight: "700",
    padding: "3px 8px", borderRadius: "999px",
  },
  categoriaBadge: {
    position: "absolute", top: "10px", right: "10px",
    backgroundColor: "rgba(15,110,86,0.1)", color: "#0F6E56",
    fontSize: "10px", fontWeight: "600",
    padding: "3px 8px", borderRadius: "999px",
  },
  body: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  nombre: {
    fontSize: "14px", fontWeight: "700",
    color: "#0f172a", lineHeight: "1.3", margin: 0,
  },
  descripcion: {
    fontSize: "11px", color: "#94a3b8",
    lineHeight: "1.4", margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  precioWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  precioOriginal: {
    fontSize: "12px",
    color: "#94a3b8",
    textDecoration: "line-through",
  },
  precioRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
  },
  precio: {
    fontSize: "18px",
    fontWeight: "800",
  },
  unidadLabel: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  ahorroLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#0F6E56",
    backgroundColor: "#E1F5EE",
    padding: "2px 6px",
    borderRadius: "999px",
    alignSelf: "flex-start",
  },
  reseñasBtn:     { display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" },
  reseñasSinData: { opacity: 0.5 },
  reseñasCount:   { fontSize: "11px", color: "#64748b", fontWeight: "500" },
  stock: { fontSize: "11px", color: "#94a3b8", margin: 0 },
  cantidadRow: {
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: "#f8fafc", borderRadius: "8px",
    padding: "6px 10px", border: "1px solid #e2e8f0",
  },
  cantidadBtn: {
    width: "24px", height: "24px", borderRadius: "6px",
    border: "1px solid #e2e8f0", backgroundColor: "white",
    fontSize: "14px", fontWeight: "700", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#0F6E56", flexShrink: 0,
  },
  cantidadVal: {
    flex: 1, textAlign: "center",
    fontSize: "13px", fontWeight: "600", color: "#0f172a",
  },
  subtotal: { fontSize: "12px", color: "#64748b", margin: 0 },
  btnAgregar: {
    width: "100%", padding: "10px",
    color: "white", border: "none",
    borderRadius: "10px", fontSize: "13px",
    fontWeight: "600", transition: "background 0.2s",
    marginTop: "auto",
  },
};