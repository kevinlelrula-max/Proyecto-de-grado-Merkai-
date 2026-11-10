import { AlertTriangle, TrendingUp, TrendingDown, PackageX } from "lucide-react";
import { useStockPredictor } from "../../productos/hooks/useStockPredictor";

function nivelBarra(dias) {
  if (dias === null || dias <= 0) return "#ef4444";
  if (dias <= 3)  return "#ef4444";
  if (dias <= 7)  return "#f97316";
  if (dias <= 15) return "#f59e0b";
  return "#3b82f6";
}

function fechaCorta(dias) {
  if (!dias || dias <= 0) return "Agotado";
  const d = new Date(Date.now() + parseFloat(dias) * 86400000);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function StockCriticoWidget({ onIrA }) {
  const { productos, criticos, loading } = useStockPredictor();

  if (loading) return null;
  if (productos.length === 0) return null;

  const visibles = productos.slice(0, 5);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.iconWrap}>
            <AlertTriangle size={14} color="#b45309" />
          </span>
          <div>
            <p style={s.title}>Stock en riesgo</p>
            <p style={s.sub}>
              {criticos.length > 0
                ? `${criticos.length} producto${criticos.length > 1 ? "s" : ""} se agota${criticos.length > 1 ? "n" : ""} en menos de 3 días`
                : `${productos.length} producto${productos.length > 1 ? "s" : ""} por reabastecer`}
            </p>
          </div>
        </div>
        <button style={s.btnVer} onClick={() => onIrA?.("productos")}>
          Ver todo
        </button>
      </div>

      <div style={s.lista}>
        {visibles.map((p) => {
          const dias  = p.dias_hasta_agotarse !== null ? parseFloat(p.dias_hasta_agotarse) : null;
          const color = nivelBarra(dias);
          const fecha = fechaCorta(dias);
          const tend  = p.tendencia_pct !== null ? parseFloat(p.tendencia_pct) : null;
          const pct   = dias === null ? 100 : Math.min(100, Math.max(2, 100 - (dias / 30) * 100));

          return (
            <div key={p.id} style={s.row}>
              <div style={s.rowInfo}>
                <span style={s.nombre}>{p.nombre}</span>
                <div style={s.rowMeta}>
                  <span style={{ ...s.fechaChip, color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}>
                    {fecha}
                  </span>
                  {tend !== null && Math.abs(tend) > 10 && (
                    <span style={{ ...s.tendChip, color: tend > 0 ? "#b91c1c" : "#15803d" }}>
                      {tend > 0
                        ? <><TrendingUp size={10} /> +{Math.abs(tend).toFixed(0)}%</>
                        : <><TrendingDown size={10} /> {Math.abs(tend).toFixed(0)}% más lento</>}
                    </span>
                  )}
                </div>
              </div>
              <div style={s.barraCol}>
                <span style={{ ...s.diasNum, color }}>{dias === null || dias <= 0 ? "—" : Math.round(dias)}</span>
                <div style={s.barraWrap}>
                  <div style={{ ...s.barraFill, width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {productos.length > 5 && (
        <div style={s.footer}>
          <button style={s.btnMas} onClick={() => onIrA?.("productos")}>
            <PackageX size={12} style={{ marginRight: 4 }} />
            Ver {productos.length - 5} más en Productos &gt; Alertas
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: {
    backgroundColor: "white",
    border: "1.5px solid #fde68a",
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: "1px solid #fef9c3", gap: 10,
    backgroundColor: "#fffbeb",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontSize: 13, fontWeight: 700, color: "#78350f", margin: 0 },
  sub:   { fontSize: 11, color: "#92400e", margin: "2px 0 0" },
  btnVer: {
    fontSize: 11, fontWeight: 700, color: "#b45309",
    backgroundColor: "white", border: "1px solid #fde68a",
    borderRadius: 7, padding: "5px 11px", cursor: "pointer", flexShrink: 0,
  },
  lista: { padding: "4px 0" },
  row: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "9px 16px", borderBottom: "1px solid #f8fafc", gap: 12,
  },
  rowInfo:  { flex: 1, minWidth: 0 },
  nombre:   { fontSize: 13, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 3 },
  rowMeta:  { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  fechaChip: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5 },
  tendChip: { fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 },
  barraCol: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 },
  diasNum:  { fontSize: 18, fontWeight: 800, lineHeight: 1 },
  barraWrap:{ width: 64, height: 4, backgroundColor: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  barraFill:{ height: "100%", borderRadius: 99, transition: "width 0.4s" },
  footer: { padding: "8px 16px", borderTop: "1px solid #f1f5f9" },
  btnMas: {
    fontSize: 11, fontWeight: 600, color: "#64748b",
    background: "none", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", padding: 0,
  },
};
