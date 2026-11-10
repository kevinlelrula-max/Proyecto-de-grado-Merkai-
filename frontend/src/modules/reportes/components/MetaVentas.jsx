import { useState } from "react";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n ?? 0);

export default function MetaVentas({ ventasMes = 0, onIrA }) {
  const storageKey = "fw_meta_ventas";
  const [meta, setMeta]         = useState(() => parseFloat(localStorage.getItem(storageKey)) || 0);
  const [editando, setEditando] = useState(false);
  const [input, setInput]       = useState("");

  const pct = meta > 0 ? Math.min(100, Math.round((ventasMes / meta) * 100)) : 0;
  const color = pct >= 100 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#2563eb";

  const guardar = () => {
    const val = parseFloat(input.replace(/\./g, "").replace(",", "."));
    if (!isNaN(val) && val > 0) {
      localStorage.setItem(storageKey, val);
      setMeta(val);
    }
    setEditando(false);
    setInput("");
  };

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div>
          <p style={s.label}>Meta de ventas — este mes</p>
          <p style={s.actual}>{fmt(ventasMes)}</p>
        </div>
        <button style={s.btnEditar} onClick={() => { setEditando(true); setInput(""); }}>
          {meta > 0 ? "✏️" : "＋ Meta"}
        </button>
      </div>

      {meta > 0 ? (
        <>
          <div style={s.barWrap}>
            <div style={{ ...s.bar, width: `${pct}%`, backgroundColor: color }} />
          </div>
          <div style={s.info}>
            <span style={{ color, fontWeight: 700 }}>{pct}% completado</span>
            <span style={s.metaLabel}>Meta: {fmt(meta)}</span>
          </div>
          {pct >= 100 && (
            <div style={s.logro}>🎉 ¡Meta alcanzada este mes!</div>
          )}
          {pct < 100 && (
            <p style={s.falta}>Faltan {fmt(meta - ventasMes)} para la meta</p>
          )}
        </>
      ) : (
        <p style={s.sinMeta}>
          Define una meta mensual para ver tu progreso aquí.{" "}
          <button style={s.btnLink} onClick={() => setEditando(true)}>Establecer meta →</button>
        </p>
      )}

      {editando && (
        <div style={s.editWrap}>
          <input
            style={s.input}
            type="number"
            placeholder="Ej: 5000000"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") guardar(); if (e.key === "Escape") setEditando(false); }}
            autoFocus
          />
          <button style={s.btnGuardar} onClick={guardar}>Guardar</button>
          <button style={s.btnCancelar} onClick={() => setEditando(false)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

const s = {
  card:      { backgroundColor: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  label:     { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 },
  actual:    { fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  btnEditar: { background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#2563eb", whiteSpace: "nowrap" },
  barWrap:   { height: 10, backgroundColor: "#f1f5f9", borderRadius: 999, overflow: "hidden" },
  bar:       { height: "100%", borderRadius: 999, transition: "width 0.6s ease" },
  info:      { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 },
  metaLabel: { color: "#94a3b8", fontWeight: 500 },
  logro:     { fontSize: 13, fontWeight: 700, color: "#10b981", textAlign: "center", background: "#f0fdf4", borderRadius: 8, padding: "6px 12px" },
  falta:     { fontSize: 12, color: "#64748b", margin: 0 },
  sinMeta:   { fontSize: 13, color: "#94a3b8", margin: 0 },
  btnLink:   { background: "none", border: "none", color: "#2563eb", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 },
  editWrap:  { display: "flex", gap: 8, alignItems: "center" },
  input:     { flex: 1, padding: "8px 12px", border: "1.5px solid #2563eb", borderRadius: 8, fontSize: 13, outline: "none" },
  btnGuardar:  { padding: "8px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnCancelar: { padding: "8px 12px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" },
};
