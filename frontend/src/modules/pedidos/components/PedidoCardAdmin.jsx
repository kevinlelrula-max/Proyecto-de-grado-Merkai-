import { useState } from "react";
import { CreditCard, MapPin, Phone, FileText, ChevronDown, ChevronUp, CheckCircle, RotateCcw, AlertCircle } from "lucide-react";
import { ESTADOS, SIGUIENTE_ESTADO } from "../hooks/usePedidosAdmin";
import ModalDevolucion from "../../devoluciones/ModalDevolucion";

function getBadge(estado) {
  const e = ESTADOS.find(e => e.key === estado) || ESTADOS[0];
  return (
    <span style={{
      backgroundColor: e.bg, color: e.color,
      border: `1px solid ${e.color}30`,
      fontSize: "11px", fontWeight: "700",
      padding: "3px 10px", borderRadius: "999px",
      letterSpacing: "0.03em",
    }}>
      {e.label}
    </span>
  );
}

export default function PedidoCardAdmin({ pedido, cambiando, onCambiarEstado }) {
  const [expandido,            setExpandido]            = useState(false);
  const [modalDevolucion,      setModalDevolucion]      = useState(false);
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);

  const siguienteEstado = SIGUIENTE_ESTADO[pedido.estado];
  const estaActivo      = cambiando === pedido.id;

  const metodoPagoLower = pedido.metodo_pago?.toLowerCase() || "";
  const pagoSinVerificar =
    pedido.estado === "pendiente" &&
    (metodoPagoLower.includes("nequi") || metodoPagoLower.includes("transferencia"));

  return (
    <div style={s.card}>

      {/* ── Fila principal ── */}
      <div style={s.cardRow} onClick={() => setExpandido(!expandido)}>
        <div style={s.cardLeft}>
          <span style={s.cardId}>#{pedido.id}</span>
          <div>
            <p style={s.cardCliente}>
              {pedido.cliente_nombre} {pedido.cliente_apellido}
            </p>
            <p style={s.cardFecha}>
              {new Date(pedido.fecha_pedido).toLocaleString("es-CO", {
                day: "numeric", month: "short",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div style={s.cardMid}>
          {getBadge(pedido.estado)}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={s.cardMetodo}>
              <CreditCard size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
              {pedido.metodo_pago}
            </span>
            {pagoSinVerificar && (
              <span style={s.badgePago}>Pago por verificar</span>
            )}
          </div>
        </div>

        <div style={s.cardRight}>
          <span style={s.cardTotal}>
            ${Number(pedido.total).toLocaleString("es-CO")}
          </span>
          {expandido ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
        </div>
      </div>

      {/* ── Detalle expandido ── */}
      {expandido && (
        <div style={s.detalle}>

          {/* Aviso de pago pendiente */}
          {pagoSinVerificar && (
            <div style={s.avisoPago}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Este pedido fue pagado por <strong>{pedido.metodo_pago}</strong>. Verifica que el cliente haya realizado la transferencia antes de confirmarlo.
              </span>
            </div>
          )}

          {/* Info cliente */}
          <div style={s.detalleInfo}>
            <div style={s.detalleInfoItem}>
              <span style={s.detalleLabel}>
                <MapPin size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Dirección
              </span>
              <span style={s.detalleVal}>{pedido.direccion_entrega || "—"}</span>
            </div>
            {pedido.cliente_telefono && (
              <div style={s.detalleInfoItem}>
                <span style={s.detalleLabel}>
                  <Phone size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Teléfono
                </span>
                <span style={s.detalleVal}>{pedido.cliente_telefono}</span>
              </div>
            )}
            {pedido.notas && (
              <div style={s.detalleInfoItem}>
                <span style={s.detalleLabel}>
                  <FileText size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Notas
                </span>
                <span style={s.detalleVal}>{pedido.notas}</span>
              </div>
            )}
          </div>

          {/* Productos */}
          <div style={s.productos}>
            <p style={s.productosTitle}>Productos</p>
            {pedido.detalle?.map((item, i) => (
              <div key={i} style={s.productoRow}>
                <span style={s.productoNombre}>{item.nombre}</span>
                <span style={s.productoKilos}>{Number(item.cantidad).toFixed(1)} {item.unidad || "uds."}</span>
                <span style={s.productoSubtotal}>
                  ${Number(item.subtotal).toLocaleString("es-CO")}
                </span>
              </div>
            ))}
            <div style={s.totalRow}>
              <span>Total</span>
              <span style={{ fontWeight: "800", color: "#0f172a" }}>
                ${Number(pedido.total).toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div style={s.acciones}>
            {siguienteEstado && (
              <button
                style={{ ...s.btnAvanzar, opacity: estaActivo ? 0.7 : 1 }}
                disabled={estaActivo}
                onClick={() => onCambiarEstado(pedido.id, siguienteEstado)}
              >
                {estaActivo ? (
                  "Actualizando..."
                ) : (
                  <>
                    <CheckCircle size={14} style={{ marginRight: 6 }} />
                    {pagoSinVerificar
                      ? "Pago recibido — Confirmar pedido"
                      : `Marcar como "${ESTADOS.find(e => e.key === siguienteEstado)?.label}"`}
                  </>
                )}
              </button>
            )}

            {pedido.estado !== "cancelado" && pedido.estado !== "entregado" && (
              confirmandoCancelacion ? (
                <div style={s.cancelConfirm}>
                  <span style={s.cancelConfirmText}>¿Cancelar este pedido?</span>
                  <button
                    style={s.btnSiCancelar}
                    onClick={() => {
                      onCambiarEstado(pedido.id, "cancelado");
                      setConfirmandoCancelacion(false);
                    }}
                  >
                    Sí, cancelar
                  </button>
                  <button style={s.btnNo} onClick={() => setConfirmandoCancelacion(false)}>
                    No
                  </button>
                </div>
              ) : (
                <button
                  style={s.btnCancelar}
                  disabled={estaActivo}
                  onClick={() => setConfirmandoCancelacion(true)}
                >
                  Cancelar pedido
                </button>
              )
            )}

            {(pedido.estado === "entregado" || pedido.estado === "confirmado") && (
              <button
                style={s.btnDevolucion}
                onClick={() => setModalDevolucion(true)}
              >
                <RotateCcw size={13} style={{ marginRight: 5 }} />
                Devolución
              </button>
            )}
          </div>

        </div>
      )}

      {modalDevolucion && (
        <ModalDevolucion
          pedido={{
            ...pedido,
            items: (pedido.detalle || []).map(d => ({
              producto_id:     d.producto_id,
              nombre:          d.nombre,
              cantidad:        Number(d.cantidad),
              precio_unitario: Number(d.precio_unitario || d.subtotal / d.cantidad || 0),
            })),
          }}
          tipo="pedido"
          onCerrar={() => setModalDevolucion(false)}
          onExito={() => setModalDevolucion(false)}
        />
      )}
    </div>
  );
}

const s = {
  card: {
    backgroundColor: "white", border: "1.5px solid #e2e8f0",
    borderRadius: "14px", overflow: "hidden",
  },
  cardRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", cursor: "pointer", gap: "16px",
  },
  cardLeft:    { display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 },
  cardId: {
    fontSize: "13px", fontWeight: "800", color: "#2563eb",
    backgroundColor: "#eff6ff", padding: "4px 10px",
    borderRadius: "8px", flexShrink: 0,
  },
  cardCliente: { fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: 0 },
  cardFecha:   { fontSize: "11px", color: "#94a3b8", margin: "2px 0 0" },
  cardMid:     { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 },
  cardMetodo:  { fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center" },
  cardRight:   { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 },
  cardTotal:   { fontSize: "16px", fontWeight: "800", color: "#0f172a" },

  // Badge pago por verificar
  badgePago: {
    fontSize: "10px", fontWeight: "700",
    color: "#92400e", backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    padding: "2px 7px", borderRadius: "999px",
  },

  // Aviso en detalle
  avisoPago: {
    display: "flex", gap: "8px", alignItems: "flex-start",
    padding: "10px 14px",
    backgroundColor: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: "10px", fontSize: "12px", color: "#92400e", lineHeight: "1.5",
  },

  detalle: {
    borderTop: "1.5px solid #f1f5f9", padding: "20px",
    display: "flex", flexDirection: "column", gap: "16px",
    backgroundColor: "#fafafa",
  },
  detalleInfo:     { display: "flex", flexWrap: "wrap", gap: "16px" },
  detalleInfoItem: { display: "flex", flexDirection: "column", gap: "2px", minWidth: "200px" },
  detalleLabel:    { fontSize: "11px", color: "#94a3b8", fontWeight: "600" },
  detalleVal:      { fontSize: "13px", color: "#0f172a", fontWeight: "500" },
  productos: {
    backgroundColor: "white", border: "1px solid #e2e8f0",
    borderRadius: "10px", padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  productosTitle: {
    fontSize: "12px", fontWeight: "700", color: "#64748b",
    margin: 0, textTransform: "uppercase", letterSpacing: "0.05em",
  },
  productoRow:      { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },
  productoNombre:   { flex: 1, color: "#0f172a", fontWeight: "500" },
  productoKilos:    { color: "#64748b" },
  productoSubtotal: { fontWeight: "700", color: "#0f172a", minWidth: "80px", textAlign: "right" },
  totalRow: {
    display: "flex", justifyContent: "space-between",
    paddingTop: "10px", borderTop: "1px solid #f1f5f9",
    fontSize: "14px", fontWeight: "600", color: "#0f172a",
  },
  acciones: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" },
  btnAvanzar: {
    display: "inline-flex", alignItems: "center",
    padding: "10px 20px", backgroundColor: "#2563eb",
    color: "white", border: "none", borderRadius: "9px",
    fontSize: "13px", fontWeight: "700", cursor: "pointer",
  },
  btnCancelar: {
    padding: "10px 16px", backgroundColor: "white",
    color: "#ef4444", border: "1.5px solid #fecaca",
    borderRadius: "9px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },
  btnDevolucion: {
    display: "inline-flex", alignItems: "center",
    padding: "10px 16px", backgroundColor: "white",
    color: "#2563eb", border: "1.5px solid #bfdbfe",
    borderRadius: "9px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },

  // Confirmación inline de cancelación
  cancelConfirm: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 12px", backgroundColor: "#fef2f2",
    border: "1.5px solid #fecaca", borderRadius: "9px",
  },
  cancelConfirmText: { fontSize: "13px", color: "#b91c1c", fontWeight: "600", marginRight: 4 },
  btnSiCancelar: {
    padding: "6px 14px", backgroundColor: "#ef4444",
    color: "white", border: "none", borderRadius: "7px",
    fontSize: "12px", fontWeight: "700", cursor: "pointer",
  },
  btnNo: {
    padding: "6px 14px", backgroundColor: "white",
    color: "#64748b", border: "1px solid #e2e8f0",
    borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
  },
};
