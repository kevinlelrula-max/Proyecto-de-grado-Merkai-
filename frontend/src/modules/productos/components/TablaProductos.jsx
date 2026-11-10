import { useState } from "react";
import { formatearPrecio } from "../helpers/formatearPrecio";
import { imgUrl } from "../../../utils/imgUrl";

const IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%20viewBox%3D%220%200%20300%20200%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23f1f5f9%22%2F%3E%3Crect%20x%3D%22120%22%20y%3D%2272%22%20width%3D%2260%22%20height%3D%2245%22%20rx%3D%225%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%2294%22%20r%3D%2211%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%2294%22%20r%3D%224%22%20fill%3D%22%23cbd5e1%22%2F%3E%3C%2Fsvg%3E";

export default function TablaProductos({ productos, onEliminar, onToggleEstado, onEditar, onAgregar, vista = "grid" }) {
  const [copiadoId, setCopiadoId] = useState(null);
  // { id, paso: "eliminar" | "historial" }
  const [pendiente, setPendiente] = useState(null);
  const cerrar = () => setPendiente(null);

  const confirmarEliminar = async (id) => {
    const resultado = await onEliminar(id);
    setPendiente(resultado === "historial" ? { id, paso: "historial" } : null);
  };

  const renderAcciones = (p) => {
    const paso = pendiente?.id === p.id ? pendiente.paso : null;
    const activo = p.activo !== false;

    if (paso === "eliminar") return (
      <div style={styles.cardActions}>
        <span style={styles.confirmText}>¿Eliminar?</span>
        <button style={styles.btnConfirmYes} onClick={() => confirmarEliminar(p.id)}>Sí</button>
        <button style={styles.btnConfirmNo} onClick={cerrar}>No</button>
      </div>
    );

    if (paso === "historial") return (
      <div style={styles.historialBox}>
        <span style={styles.historialText}>Tiene ventas registradas, no se puede eliminar.</span>
        <div style={styles.cardActions}>
          {activo && (
            <button style={styles.warnBtn} onClick={() => { onToggleEstado(p.id); cerrar(); }}>Desactivar</button>
          )}
          <button style={styles.btnConfirmNo} onClick={cerrar}>{activo ? "Cancelar" : "Cerrar"}</button>
        </div>
      </div>
    );

    return (
      <div style={styles.cardActions}>
        <button style={styles.editBtn} onClick={() => onEditar(p)}>Editar</button>
        <button style={styles.deleteBtn} onClick={() => setPendiente({ id: p.id, paso: "eliminar" })}>Eliminar</button>
        <button
          style={activo ? styles.pauseBtn : styles.playBtn}
          onClick={() => onToggleEstado(p.id)}
          title={activo ? "Desactivar: ocultar de la tienda y del POS" : "Activar: volver a mostrar en la tienda y el POS"}
        >
          {activo ? "⏸" : "▶"}
        </button>
        {activo && (
          <button
            style={copiadoId === p.id ? styles.copiadoBtn : styles.copiarBtn}
            onClick={() => copiarLink(p.id)}
            title="Copiar link de producto para compartir"
          >
            {copiadoId === p.id ? "✓" : "🔗"}
          </button>
        )}
      </div>
    );
  };

  const copiarLink = (productoId) => {
    const slug = localStorage.getItem("empresa_slug") || "";
    const url  = `${window.location.origin}/tienda/${slug}/catalogo?producto=${productoId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiadoId(productoId);
      setTimeout(() => setCopiadoId(null), 2000);
    });
  };

  if (productos.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyTitle}>No hay productos aún</p>
        <p style={styles.emptyText}>Agrega tu primer producto para que aparezca en tu tienda online</p>
        {onAgregar && (
          <button style={styles.emptyBtn} onClick={onAgregar}>+ Agregar primer producto</button>
        )}
      </div>
    );
  }

  if (vista === "lista") {
    return (
      <div style={styles.listContainer}>
        {productos.map((p) => {
          const stockColor = getStockColor(p.stock);
          return (
            <div key={p.id} style={{ ...styles.listRow, ...(p.activo === false ? styles.inactivo : {}) }}>
              <img
                src={imgUrl(p.imagen_url) || IMG_PLACEHOLDER}
                alt={p.nombre}
                style={styles.listThumb}
                onError={(e) => { e.target.src = IMG_PLACEHOLDER; }}
              />
              <span style={styles.listName}>
                {p.nombre}
                {p.activo === false && <span style={styles.inactivoBadge}>Desactivado</span>}
              </span>
              <span style={styles.listPrice}>{formatearPrecio(p.precio)}</span>
              <span style={{ ...styles.badge, ...stockColor }}>
                Stock: {p.stock}
              </span>
              {renderAcciones(p)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {productos.map((p) => {
        const stockColor = getStockColor(p.stock);
        return (
          <div key={p.id} style={{ ...styles.card, ...(p.activo === false ? styles.inactivo : {}) }}>
            <div style={styles.imgWrap}>
              <img
                src={imgUrl(p.imagen_url) || IMG_PLACEHOLDER}
                alt={p.nombre}
                style={styles.cardImg}
                onError={(e) => { e.target.src = IMG_PLACEHOLDER; }}
              />
              <span style={{ ...styles.stockBadge, ...stockColor }}>
                Stock: {p.stock}
              </span>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.cardName}>{p.nombre}</p>
              {p.activo === false && <span style={{ ...styles.inactivoBadge, marginLeft: 0 }}>Desactivado</span>}
              <p style={styles.cardPrice}>{formatearPrecio(p.precio)}</p>
              {renderAcciones(p)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getStockColor(stock) {
  if (stock > 100) return { backgroundColor: "#dcfce7", color: "#166534" };
  if (stock > 20)  return { backgroundColor: "#fef9c3", color: "#854d0e" };
  return { backgroundColor: "#fee2e2", color: "#991b1b" };
}

const styles = {
  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "8px",
  },

  // Card
  card: {
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    border: "1.5px solid #cbd5e1",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "transform 0.15s, box-shadow 0.15s",
    cursor: "default",
  },
  imgWrap: {
    position: "relative",
    width: "100%",
    height: "140px",
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  stockBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 10px",
    borderRadius: "999px",
  },
  cardBody: {
    padding: "12px 14px",
  },
  cardName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardPrice: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: "10px",
  },
  cardActions: {
    display: "flex",
    gap: "6px",
  },

  // Lista
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "8px",
  },
  listRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1.5px solid #cbd5e1",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  listThumb: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    objectFit: "cover",
    flexShrink: 0,
    border: "1.5px solid #cbd5e1",
  },
  listName: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  listPrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2563eb",
    minWidth: "80px",
    textAlign: "right",
  },

  // Compartidos
  badge: {
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  editBtn: {
    flex: 1,
    padding: "6px 0",
    border: "1.5px solid #2563eb",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "600",
  },
  deleteBtn: {
    flex: 1,
    padding: "6px 0",
    border: "1.5px solid #ef4444",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "600",
  },

  copiarBtn: {
    padding: "6px 10px",
    border: "1.5px solid #3b82f6",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: "600",
    flexShrink: 0,
  },
  copiadoBtn: {
    padding: "6px 10px",
    border: "1.5px solid #10b981",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#f0fdf4",
    color: "#10b981",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0,
  },

  // Estado activo / inactivo
  inactivo: { opacity: 0.6, backgroundColor: "#f8fafc" },
  inactivoBadge: {
    display: "inline-block", marginLeft: "8px", marginBottom: "4px",
    padding: "1px 8px", fontSize: "11px", fontWeight: "600",
    borderRadius: "999px", backgroundColor: "#e2e8f0", color: "#475569",
  },
  pauseBtn: {
    padding: "6px 10px", border: "1.5px solid #f59e0b", borderRadius: "8px",
    cursor: "pointer", backgroundColor: "transparent", color: "#b45309",
    fontSize: "12px", fontWeight: "600", flexShrink: 0,
  },
  playBtn: {
    padding: "6px 10px", border: "1.5px solid #10b981", borderRadius: "8px",
    cursor: "pointer", backgroundColor: "#f0fdf4", color: "#047857",
    fontSize: "12px", fontWeight: "600", flexShrink: 0,
  },
  warnBtn: {
    padding: "5px 10px", border: "1.5px solid #f59e0b", borderRadius: "7px",
    cursor: "pointer", backgroundColor: "transparent", color: "#b45309",
    fontSize: "12px", fontWeight: "600",
  },
  historialBox: { display: "flex", flexDirection: "column", gap: "6px" },
  historialText: { fontSize: "12px", color: "#475569", lineHeight: 1.4 },

  // Confirm delete
  confirmText: { fontSize: "12px", color: "#dc2626", fontWeight: "600", whiteSpace: "nowrap" },
  btnConfirmYes: {
    padding: "5px 10px", fontSize: "12px", fontWeight: "700",
    backgroundColor: "#dc2626", color: "white",
    border: "none", borderRadius: "7px", cursor: "pointer",
  },
  btnConfirmNo: {
    padding: "5px 10px", fontSize: "12px", fontWeight: "600",
    backgroundColor: "#f1f5f9", color: "#64748b",
    border: "1px solid #e2e8f0", borderRadius: "7px", cursor: "pointer",
  },

  // Empty
  empty: {
    textAlign: "center",
    padding: "64px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
  },
  emptyIcon: { fontSize: "48px", lineHeight: 1 },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 },
  emptyText: { fontSize: "13px", color: "#94a3b8", maxWidth: "320px", lineHeight: 1.5, margin: 0 },
  emptyBtn: {
    marginTop: "6px", padding: "10px 22px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },
};
