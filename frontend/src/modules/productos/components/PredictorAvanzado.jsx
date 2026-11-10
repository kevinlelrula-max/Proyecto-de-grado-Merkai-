import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

function nivelConfig(dias) {
  if (dias === null || dias <= 0)
    return { label: "Sin stock",  color: "#7f1d1d", bg: "#fef2f2", border: "#fca5a5", barra: "#ef4444" };
  if (dias <= 3)
    return { label: "Crítico",    color: "#7f1d1d", bg: "#fef2f2", border: "#fca5a5", barra: "#ef4444" };
  if (dias <= 7)
    return { label: "Urgente",    color: "#7c2d12", bg: "#fff7ed", border: "#fdba74", barra: "#f97316" };
  if (dias <= 15)
    return { label: "Pronto",     color: "#713f12", bg: "#fffbeb", border: "#fcd34d", barra: "#f59e0b" };
  return   { label: "Vigilar",   color: "#1e3a5f", bg: "#eff6ff", border: "#93c5fd", barra: "#3b82f6" };
}

function fechaAgotamiento(dias) {
  if (dias === null || dias <= 0) return null;
  const d = new Date(Date.now() + parseFloat(dias) * 86400000);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function TendenciaIcon({ pct }) {
  if (pct === null || pct === undefined) return null;
  const v = parseFloat(pct);
  if (v > 10)  return <TrendingUp  size={13} color="#ef4444" />;
  if (v < -10) return <TrendingDown size={13} color="#22c55e" />;
  return <Minus size={13} color="#94a3b8" />;
}

function etiquetaTendencia(pct) {
  if (pct === null || pct === undefined) return null;
  const v = parseFloat(pct);
  if (v > 10)  return { texto: `+${Math.abs(v).toFixed(0)}% más rápido`, color: "#ef4444" };
  if (v < -10) return { texto: `${Math.abs(v).toFixed(0)}% más lento`,   color: "#16a34a" };
  return { texto: "Velocidad estable", color: "#94a3b8" };
}

export default function PredictorAvanzado({ productos, loading }) {
  if (loading) return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.spinnerBox}>
          <div style={s.spinner} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Calculando predicciones...</span>
        </div>
      </div>
    </div>
  );

  if (!productos || productos.length === 0) return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Predictor de quiebre de stock</h3>
          <p style={s.sub}>Todos los productos tienen stock suficiente para más de 30 días</p>
        </div>
        <span style={s.okBadge}>Sin alertas</span>
      </div>
    </div>
  );

  const criticos = productos.filter(p => {
    const d = parseFloat(p.dias_hasta_agotarse);
    return isNaN(d) || d <= 3;
  });

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Predictor de quiebre de stock</h3>
          <p style={s.sub}>
            Velocidad de ventas últimos 30 días · {productos.length} producto{productos.length !== 1 ? "s" : ""} en riesgo
          </p>
        </div>
        {criticos.length > 0 && (
          <span style={s.alertBadge}>
            <AlertTriangle size={11} style={{ marginRight: 4 }} />
            {criticos.length} crítico{criticos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={s.lista}>
        {productos.map((p) => {
          const dias   = p.dias_hasta_agotarse !== null ? parseFloat(p.dias_hasta_agotarse) : null;
          const n      = nivelConfig(dias);
          const fecha  = fechaAgotamiento(dias);
          const tend   = etiquetaTendencia(p.tendencia_pct);
          const pctBar = dias === null ? 100 : Math.min(100, Math.max(0, 100 - (dias / 30) * 100));

          return (
            <div key={p.id} style={{ ...s.row, borderLeftColor: n.barra }}>

              {/* Izquierda: badge + nombre + tendencia */}
              <div style={s.rowLeft}>
                <span style={{ ...s.badge, backgroundColor: n.bg, color: n.color, border: `1px solid ${n.border}` }}>
                  {n.label}
                </span>
                <div style={s.info}>
                  <p style={s.nombre}>{p.nombre}</p>
                  <div style={s.detalleRow}>
                    <span style={s.detalle}>
                      Stock: <strong>{Number(p.stock).toFixed(1)} {p.unidad || "uds."}</strong>
                      &nbsp;·&nbsp;
                      Prom.: <strong>{Number(p.promedio_diario).toFixed(2)}/día</strong>
                    </span>
                    {tend && (
                      <span style={{ ...s.tendencia, color: tend.color }}>
                        <TendenciaIcon pct={p.tendencia_pct} />
                        {tend.texto}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Derecha: countdown + fecha + barra */}
              <div style={s.rowRight}>
                {dias === null || dias <= 0 ? (
                  <span style={{ ...s.contador, color: n.barra }}>Sin stock</span>
                ) : (
                  <div style={s.contadorWrap}>
                    <span style={{ ...s.contador, color: n.barra }}>
                      {dias % 1 === 0 ? dias : dias.toFixed(1)}
                    </span>
                    <span style={s.contadorLabel}>días</span>
                  </div>
                )}
                {fecha && (
                  <span style={{ ...s.fechaTag, backgroundColor: n.bg, color: n.color, border: `1px solid ${n.border}` }}>
                    {fecha}
                  </span>
                )}
                <div style={s.barraWrap}>
                  <div style={{ ...s.barraFill, width: `${pctBar}%`, backgroundColor: n.barra }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={s.formula}>
        Fórmula: stock ÷ promedio diario (30 días) · Tendencia: últimos 7 días vs. 7 días anteriores
      </p>
    </div>
  );
}

const s = {
  wrap: { backgroundColor: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" },
  header: {
    padding: "16px 20px 14px", borderBottom: "1px solid #f1f5f9",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
  },
  spinnerBox: { display: "flex", alignItems: "center", gap: 10 },
  spinner: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2px solid #e2e8f0", borderTop: "2px solid #2563eb",
    animation: "spin 0.8s linear infinite",
  },
  title: { fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" },
  sub:   { fontSize: 11, color: "#94a3b8", margin: 0 },
  alertBadge: {
    display: "inline-flex", alignItems: "center",
    padding: "4px 12px", backgroundColor: "#fef2f2", color: "#b91c1c",
    border: "1px solid #fca5a5", borderRadius: 999, fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  okBadge: {
    padding: "4px 12px", backgroundColor: "#f0fdf4", color: "#166534",
    border: "1px solid #bbf7d0", borderRadius: 999, fontSize: 12, fontWeight: 700,
  },
  lista: { display: "flex", flexDirection: "column" },
  row: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 20px", borderBottom: "1px solid #f8fafc",
    borderLeft: "3px solid transparent", gap: 12, flexWrap: "wrap",
  },
  rowLeft:  { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 180 },
  badge:    { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, flexShrink: 0, whiteSpace: "nowrap" },
  info:     { flex: 1, minWidth: 0 },
  nombre:   { fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 3px" },
  detalleRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 14px" },
  detalle:  { fontSize: 11, color: "#64748b" },
  tendencia:{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 },
  rowRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, minWidth: 90 },
  contadorWrap: { display: "flex", alignItems: "baseline", gap: 3 },
  contador:     { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  contadorLabel:{ fontSize: 11, fontWeight: 600, color: "#94a3b8" },
  fechaTag: {
    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap",
  },
  barraWrap: { width: 90, height: 5, backgroundColor: "#f1f5f9", borderRadius: 99, overflow: "hidden" },
  barraFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  formula:  { fontSize: 10, color: "#94a3b8", textAlign: "right", padding: "8px 16px", margin: 0, borderTop: "1px solid #f1f5f9", fontStyle: "italic" },
};
