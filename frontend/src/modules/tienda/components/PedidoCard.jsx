import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Phone, Package, MapPin, CreditCard, RotateCcw,
  ChevronDown, ChevronUp, FileText, Clock, CheckCircle,
  Loader2, Truck, Gift, XCircle, ClipboardList,
} from "lucide-react";
import { ESTADOS } from "../hooks/useMisPedidos";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const PASOS = ["pendiente", "confirmado", "en_preparacion", "enviado", "entregado"];
const PASO_LABELS = ["Pendiente", "Confirmado", "Preparando", "Enviado", "Entregado"];

const ESTADO_ICONS = {
  pendiente:      Clock,
  confirmado:     CheckCircle,
  en_preparacion: Loader2,
  enviado:        Truck,
  entregado:      Gift,
  cancelado:      XCircle,
};

function useHistorial(pedidoId) {
  const [historial, setHistorial] = useState([]);
  const [abierto, setAbierto]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const cargar = async () => {
    if (historial.length > 0) { setAbierto(!abierto); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("cliente_token");
      const res   = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistorial(data);
      setAbierto(true);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  return { historial, abierto, loading, cargar };
}

export default function PedidoCard({ pedido, colorMarca = "#2563eb" }) {
  const navigate = useNavigate();
  const { historial, abierto, loading, cargar } = useHistorial(pedido.id);

  const estado = ESTADOS[pedido.estado] || ESTADOS.pendiente;
  const IconoEstado = ESTADO_ICONS[pedido.estado] || Clock;
  const indexActual = PASOS.indexOf(pedido.estado);
  const cancelado   = pedido.estado === "cancelado";

  const fecha = new Date(pedido.fecha_pedido).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const repetirPedido = () => {
    const items = pedido.detalle?.map(item => ({
      producto_id: item.producto_id,
      cantidad:    Math.max(1, Math.ceil(item.cantidad)),
      nombre:      item.nombre,
    })) || [];
    localStorage.setItem("fishware_repetir_pedido", JSON.stringify({
      empresa_slug: pedido.empresa_slug,
      items,
    }));
    navigate(`/tienda/${pedido.empresa_slug}/catalogo`);
  };

  return (
    <div style={{ ...s.card, borderLeft: `4px solid ${estado.color}` }}>

      {/* Header: número + status */}
      <div style={{ ...s.header, backgroundColor: `${colorMarca}0d` }}>
        <div style={s.headerLeft}>
          <div style={s.pedidoId}>Pedido #{pedido.id}</div>
          <div style={s.fecha}>{fecha}</div>
        </div>
        <div style={{ ...s.estadoBadge, backgroundColor: estado.bg, color: estado.color }}>
          <IconoEstado size={12} style={{ flexShrink: 0 }} />
          <span>{estado.label}</span>
        </div>
      </div>

      {/* Empresa */}
      <div style={s.empresa}>
        <Store size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
        <span style={s.empresaNombre}>{pedido.empresa_nombre}</span>
        {pedido.empresa_telefono && (
          <>
            <span style={s.empresaSep}>·</span>
            <Phone size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={s.empresaTel}>{pedido.empresa_telefono}</span>
          </>
        )}
      </div>

      {/* Tracker de progreso */}
      {!cancelado && (
        <div style={s.trackerSection}>
          <div style={s.tracker}>
            {PASOS.map((e, i) => {
              const pasado   = i < indexActual;
              const activo   = i <= indexActual;
              const esActual = e === pedido.estado;
              const StepIcon = ESTADO_ICONS[e] || Clock;
              const stepColor = activo ? (ESTADOS[e]?.color ?? colorMarca) : "#cbd5e1";

              return (
                <div key={e} style={s.trackerStep}>
                  {/* Línea izquierda */}
                  {i > 0 && (
                    <div style={{
                      ...s.trackerLine,
                      backgroundColor: pasado ? (ESTADOS[PASOS[i]]?.color ?? colorMarca) : "#e2e8f0",
                    }} />
                  )}

                  {/* Círculo */}
                  <div style={{
                    ...s.trackerDot,
                    backgroundColor: activo ? stepColor : "white",
                    border: activo ? `2px solid ${stepColor}` : "2px solid #e2e8f0",
                    width: esActual ? "34px" : "28px",
                    height: esActual ? "34px" : "28px",
                    boxShadow: esActual ? `0 0 0 4px ${ESTADOS[e]?.bg ?? "#eff6ff"}` : "none",
                    zIndex: esActual ? 2 : 1,
                  }}>
                    <StepIcon
                      size={esActual ? 15 : 12}
                      color={activo ? "white" : "#cbd5e1"}
                    />
                  </div>

                  {/* Línea derecha */}
                  {i < 4 && (
                    <div style={{
                      ...s.trackerLine,
                      backgroundColor: i < indexActual ? (ESTADOS[PASOS[i + 1]]?.color ?? colorMarca) : "#e2e8f0",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div style={s.trackerLabels}>
            {PASO_LABELS.map((l, i) => {
              const activo = i <= indexActual;
              const esActual = PASOS[i] === pedido.estado;
              return (
                <span key={l} style={{
                  ...s.trackerLabel,
                  color: esActual ? estado.color : activo ? "#374151" : "#94a3b8",
                  fontWeight: esActual ? "700" : "400",
                }}>
                  {l}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelado: aviso */}
      {cancelado && (
        <div style={s.canceladoBox}>
          <XCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "#b91c1c" }}>Este pedido fue cancelado</span>
        </div>
      )}

      {/* Productos */}
      <div style={s.productos}>
        <div style={s.productosHeader}>
          <ClipboardList size={12} color="#94a3b8" />
          <span style={s.productosTitle}>Productos · {pedido.detalle?.length ?? 0}</span>
        </div>
        {pedido.detalle?.map((item, i) => (
          <div key={i} style={s.productoItem}>
            <div style={{ ...s.productoIconWrap, backgroundColor: `${colorMarca}14` }}>
              <Package size={12} color={colorMarca} />
            </div>
            <span style={s.productoNombre}>{item.nombre}</span>
            <span style={s.productoCantidad}>
              {Number(item.cantidad).toFixed(1)} {item.unidad || "uds."}
            </span>
            <span style={s.productoSubtotal}>
              ${Number(item.subtotal).toLocaleString("es-CO")}
            </span>
          </div>
        ))}
      </div>

      {/* Historial toggle */}
      <button style={s.historialToggle} onClick={cargar}>
        {loading ? (
          "Cargando..."
        ) : abierto ? (
          <><ChevronUp size={13} /> Ocultar historial</>
        ) : (
          <><ChevronDown size={13} /> Ver historial de estados</>
        )}
      </button>

      {/* Timeline historial */}
      {abierto && historial.length > 0 && (
        <div style={s.historialWrap}>
          {historial.map((h, i) => {
            const est = ESTADOS[h.estado] || ESTADOS.pendiente;
            const HIcon = ESTADO_ICONS[h.estado] || Clock;
            return (
              <div key={i} style={s.historialItem}>
                <div style={s.historialLeft}>
                  <div style={{ ...s.historialDot, backgroundColor: est.color }}>
                    <HIcon size={9} color="white" />
                  </div>
                  {i < historial.length - 1 && <div style={s.historialLinea} />}
                </div>
                <div style={s.historialInfo}>
                  <span style={{ ...s.historialEstado, color: est.color }}>{est.label}</span>
                  <span style={s.historialFecha}>
                    {new Date(h.cambiado_en).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  {h.nota && (
                    <span style={s.historialNota}>
                      <FileText size={10} style={{ flexShrink: 0 }} /> {h.nota}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: meta + total */}
      <div style={s.footer}>
        <div style={s.footerMeta}>
          {pedido.direccion_entrega && (
            <span style={s.metaItem}>
              <MapPin size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
              {pedido.direccion_entrega}
            </span>
          )}
          {pedido.metodo_pago && (
            <span style={s.metaItem}>
              <CreditCard size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
              {pedido.metodo_pago}
            </span>
          )}
          {pedido.notas && (
            <span style={{ ...s.metaItem, fontStyle: "italic" }}>
              <FileText size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
              {pedido.notas}
            </span>
          )}
        </div>
        <div style={s.totalWrap}>
          <span style={s.totalLabel}>TOTAL</span>
          <span style={s.totalValor}>${Number(pedido.total).toLocaleString("es-CO")}</span>
        </div>
      </div>

      {/* Repetir pedido */}
      {pedido.estado === "entregado" && pedido.empresa_slug && (
        <div style={s.repetirRow}>
          <button style={{ ...s.repetirBtn, color: colorMarca, borderColor: colorMarca }} onClick={repetirPedido}>
            <RotateCcw size={13} />
            Repetir este pedido
          </button>
        </div>
      )}

    </div>
  );
}

const s = {
  card: {
    backgroundColor: "white",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
  },

  // Header
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "16px 20px 12px",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: "3px" },
  pedidoId: { fontSize: "15px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.01em" },
  fecha: { fontSize: "12px", color: "#94a3b8" },
  estadoBadge: {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "5px 12px", borderRadius: "999px",
    fontSize: "12px", fontWeight: "700",
  },

  // Empresa
  empresa: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 20px 10px",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
  },
  empresaNombre: { fontSize: "12px", fontWeight: "600", color: "#374151" },
  empresaSep: { fontSize: "12px", color: "#cbd5e1" },
  empresaTel: { fontSize: "12px", color: "#94a3b8" },

  // Tracker
  trackerSection: {
    padding: "20px 20px 12px",
  },
  tracker: {
    display: "flex", alignItems: "center",
    marginBottom: "8px",
  },
  trackerStep: {
    display: "flex", alignItems: "center", flex: 1,
  },
  trackerDot: {
    borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s ease",
    position: "relative",
  },
  trackerLine: {
    flex: 1, height: "2px",
    transition: "background 0.2s ease",
  },
  trackerLabels: {
    display: "flex",
    paddingLeft: "0px",
  },
  trackerLabel: {
    flex: 1, fontSize: "10px",
    textAlign: "center",
    lineHeight: 1.3,
    transition: "all 0.2s",
    letterSpacing: "0.01em",
  },

  // Cancelado
  canceladoBox: {
    display: "flex", alignItems: "center", gap: "8px",
    margin: "0 20px 0",
    padding: "10px 14px",
    backgroundColor: "#fef2f2", borderRadius: "8px",
    border: "1px solid #fecaca",
  },

  // Productos
  productos: {
    padding: "12px 20px",
    borderTop: "1px solid #f1f5f9",
  },
  productosHeader: {
    display: "flex", alignItems: "center", gap: "5px",
    marginBottom: "8px",
  },
  productosTitle: {
    fontSize: "10px", fontWeight: "700",
    color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em",
  },
  productoItem: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "6px 0",
    borderBottom: "1px solid #f8fafc",
  },
  productoIconWrap: {
    width: "24px", height: "24px", borderRadius: "6px",
    backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  productoNombre: { flex: 1, fontSize: "13px", color: "#374151", fontWeight: "500" },
  productoCantidad: { fontSize: "12px", color: "#94a3b8", minWidth: "52px", textAlign: "right" },
  productoSubtotal: { fontSize: "13px", fontWeight: "700", color: "#15803d", minWidth: "76px", textAlign: "right" },

  // Historial toggle
  historialToggle: {
    width: "100%",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "10px 20px",
    background: "none", border: "none", borderTop: "1px solid #f1f5f9",
    backgroundColor: "#fafafa",
    fontSize: "12px", fontWeight: "600", color: "#64748b",
    cursor: "pointer", userSelect: "none",
  },

  // Historial timeline
  historialWrap: {
    padding: "14px 20px 10px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
    display: "flex", flexDirection: "column", gap: "0",
  },
  historialItem: {
    display: "flex", gap: "10px",
  },
  historialLeft: {
    display: "flex", flexDirection: "column", alignItems: "center",
    flexShrink: 0, width: "18px",
  },
  historialDot: {
    width: "18px", height: "18px", borderRadius: "50%",
    flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  historialLinea: {
    flex: 1, width: "2px",
    backgroundColor: "#e2e8f0",
    margin: "2px 0",
    minHeight: "18px",
  },
  historialInfo: {
    display: "flex", flexDirection: "column", gap: "1px",
    paddingBottom: "14px",
  },
  historialEstado: { fontSize: "12px", fontWeight: "700" },
  historialFecha:  { fontSize: "11px", color: "#94a3b8" },
  historialNota: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "11px", color: "#64748b", fontStyle: "italic", marginTop: "1px",
  },

  // Footer
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    padding: "12px 20px",
    borderTop: "1px solid #f1f5f9",
  },
  footerMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  metaItem: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "12px", color: "#64748b",
  },
  totalWrap: {
    display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px",
  },
  totalLabel: {
    fontSize: "9px", fontWeight: "700", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.08em",
  },
  totalValor: {
    fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
  },

  // Repetir
  repetirRow: {
    padding: "10px 20px",
    borderTop: "1px solid #f1f5f9",
    backgroundColor: "#fafafa",
  },
  repetirBtn: {
    width: "100%",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
    padding: "9px 0",
    backgroundColor: "transparent",
    border: "1.5px solid #2563eb",
    borderRadius: "9px",
    color: "#2563eb",
    fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },
};
