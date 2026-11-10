import { useState } from "react";
import { X, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { registrarDevolucion } from "./services/devoluciones.api";

const METODOS_REEMBOLSO = [
  { value: "efectivo",       label: "Efectivo" },
  { value: "transferencia",  label: "Transferencia" },
  { value: "credito_tienda", label: "Crédito en tienda" },
];

// ── Sub-componentes ────────────────────────────────────────────────────────

function ProductoRow({ item, idx, onChange, onToggle }) {
  return (
    <div
      onClick={() => onToggle(idx)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${item.seleccionado ? "#2563eb" : "#e2e8f0"}`, background: item.seleccionado ? "#eff6ff" : "#fafafa", cursor: "pointer", transition: "all 0.15s" }}
    >
      <input type="checkbox" checked={item.seleccionado}
        onChange={() => onToggle(idx)}
        onClick={e => e.stopPropagation()}
        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#2563eb" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{item.nombre}</p>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>
          ${Number(item.precio_unitario || 0).toLocaleString("es-CO")} × {item.cantidad}
        </p>
      </div>
      {item.seleccionado && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Cant:</span>
          <input
            type="number" min={1} max={item.cantidad}
            value={item.cantidadDevolver}
            onChange={e => onChange(idx, e.target.value)}
            style={{ width: 52, padding: "4px 8px", border: "1.5px solid #bfdbfe", borderRadius: 7, fontSize: 13, fontWeight: 700, textAlign: "center", outline: "none" }}
          />
        </div>
      )}
    </div>
  );
}

function Resultado({ resultado }) {
  if (!resultado) return null;
  const ok = resultado.ok;
  return (
    <div style={{ padding: "12px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, background: ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}` }}>
      {ok ? <CheckCircle size={16} color="#16a34a" /> : <AlertTriangle size={16} color="#dc2626" />}
      <span style={{ fontSize: 13, fontWeight: 600, color: ok ? "#15803d" : "#dc2626" }}>{resultado.msg}</span>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function ModalDevolucion({ pedido, tipo = "pedido", onCerrar, onExito }) {
  const items = pedido.items || pedido.productos || [];

  const [seleccionados, setSeleccionados] = useState(
    items.map(p => ({ ...p, seleccionado: false, cantidadDevolver: 1 }))
  );
  const [motivo,    setMotivo]    = useState("");
  const [metodo,    setMetodo]    = useState("efectivo");
  const [cargando,  setCargando]  = useState(false);
  const [resultado, setResultado] = useState(null);

  const toggleItem = (idx) =>
    setSeleccionados(prev => prev.map((p, i) =>
      i === idx ? { ...p, seleccionado: !p.seleccionado } : p
    ));

  const setCantidad = (idx, val) =>
    setSeleccionados(prev => prev.map((p, i) =>
      i === idx ? { ...p, cantidadDevolver: Math.max(1, Math.min(Number(val), p.cantidad)) } : p
    ));

  const itemsDevolver  = seleccionados.filter(p => p.seleccionado);
  const totalDevolver  = itemsDevolver.reduce(
    (a, p) => a + (Number(p.precio_unitario || 0) * p.cantidadDevolver), 0
  );
  const puedeEnviar    = motivo.trim() !== "" && itemsDevolver.length > 0;

  const handleSubmit = async () => {
    if (!puedeEnviar) return;
    setCargando(true);
    try {
      const data = await registrarDevolucion({
        tipo,
        referencia_id:   pedido.id,
        motivo,
        metodo_reembolso: metodo,
        productos: itemsDevolver.map(p => ({
          producto_id:     p.producto_id || p.id,
          nombre:          p.nombre,
          cantidad:        p.cantidadDevolver,
          precio_unitario: Number(p.precio_unitario || 0),
        })),
      });
      setResultado({ ok: true, msg: "Devolución registrada. El stock fue restaurado." });
      if (onExito) setTimeout(() => { onExito(data); onCerrar(); }, 1800);
    } catch (err) {
      setResultado({ ok: false, msg: err.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onCerrar}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={s.headerIcon}><RotateCcw size={16} /></span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Registrar devolución</h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>Pedido #{pedido.id}</p>
            </div>
          </div>
          <button style={s.cerrarBtn} onClick={onCerrar}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <Resultado resultado={resultado} />

          {/* Productos */}
          <div>
            <p style={s.sectionLabel}>Productos a devolver</p>
            {items.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8" }}>No hay productos en este pedido</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {seleccionados.map((p, idx) => (
                  <ProductoRow key={idx} item={p} idx={idx} onChange={setCantidad} onToggle={toggleItem} />
                ))}
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label style={s.sectionLabel}>Motivo de la devolución *</label>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2}
              placeholder="Ej: Producto en mal estado, pedido incorrecto, etc."
              style={s.textarea} />
          </div>

          {/* Método */}
          <div>
            <label style={s.sectionLabel}>Método de reembolso</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)} style={s.select}>
              {METODOS_REEMBOLSO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Total */}
          {itemsDevolver.length > 0 && (
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Total a reembolsar</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#2563eb" }}>
                ${totalDevolver.toLocaleString("es-CO")}
              </span>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCerrar} style={s.btnCancelar}>Cancelar</button>
            <button onClick={handleSubmit} disabled={!puedeEnviar || cargando}
              style={{ ...s.btnConfirmar, background: puedeEnviar ? "#2563eb" : "#94a3b8", cursor: puedeEnviar ? "pointer" : "not-allowed" }}>
              {cargando ? "Registrando..." : "Registrar devolución"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, zIndex: 10000, backgroundColor: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal:   { background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column" },
  header:  { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" },
  cerrarBtn: { width: 32, height: 32, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 },
  textarea: { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#334155", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" },
  select:   { width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff", cursor: "pointer" },
  btnCancelar:  { flex: 1, padding: "11px", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 13, color: "#64748b", fontWeight: 600, cursor: "pointer" },
  btnConfirmar: { flex: 2, padding: "11px", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff" },
};
