export default function PredictorStock({ productos }) {
  if (!productos || productos.length === 0) return null;

  function nivel(dias) {
    if (dias === null || dias <= 0) return { label: "Agotado", color: "#7f1d1d", bg: "#fef2f2", border: "#fca5a5", barra: "#ef4444" };
    if (dias <= 3)  return { label: "Crítico",  color: "#7f1d1d", bg: "#fef2f2", border: "#fca5a5", barra: "#ef4444" };
    if (dias <= 7)  return { label: "Urgente",  color: "#7c2d12", bg: "#fff7ed", border: "#fdba74", barra: "#f97316" };
    if (dias <= 15) return { label: "Pronto",   color: "#713f12", bg: "#fffbeb", border: "#fcd34d", barra: "#f59e0b" };
    return             { label: "Vigilar",  color: "#1e3a5f", bg: "#eff6ff", border: "#93c5fd", barra: "#3b82f6" };
  }

  const criticos = productos.filter(p => parseFloat(p.dias_hasta_agotarse) <= 3 || p.dias_hasta_agotarse === null);
  const urgentes = productos.filter(p => parseFloat(p.dias_hasta_agotarse) > 3 && parseFloat(p.dias_hasta_agotarse) <= 7);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Predictor de quiebre de stock</h3>
          <p style={s.sub}>
            Basado en ventas de los últimos 30 días · {productos.length} producto{productos.length !== 1 ? "s" : ""} en riesgo
          </p>
        </div>
        {criticos.length > 0 && (
          <span style={s.alertBadge}>
            {criticos.length} crítico{criticos.length !== 1 ? "s" : ""}
          </span>
        )}
        {criticos.length === 0 && urgentes.length > 0 && (
          <span style={{ ...s.alertBadge, backgroundColor: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" }}>
            {urgentes.length} urgente{urgentes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div style={s.lista}>
        {productos.map((p) => {
          const dias = p.dias_hasta_agotarse !== null ? parseFloat(p.dias_hasta_agotarse) : null;
          const n    = nivel(dias);
          const pct  = dias === null ? 100 : Math.min(100, Math.max(0, 100 - (dias / 30) * 100));

          return (
            <div key={p.id} style={{ ...s.row, borderLeftColor: n.barra }}>
              <div style={s.rowLeft}>
                <span style={{ ...s.badge, backgroundColor: n.bg, color: n.color, border: `1px solid ${n.border}` }}>
                  {n.label}
                </span>
                <div style={s.info}>
                  <p style={s.nombre}>{p.nombre}</p>
                  <p style={s.detalle}>
                    Stock: <strong>{Number(p.stock).toFixed(1)} {p.unidad || "uds."}</strong>
                    &nbsp;·&nbsp;
                    Promedio: <strong>{Number(p.promedio_diario).toFixed(2)}/día</strong>
                  </p>
                </div>
              </div>

              <div style={s.rowRight}>
                <div style={s.contadorWrap}>
                  {dias === null || dias <= 0 ? (
                    <span style={{ ...s.contador, color: n.barra }}>Sin stock</span>
                  ) : (
                    <>
                      <span style={{ ...s.contador, color: n.barra }}>
                        {dias % 1 === 0 ? dias : dias.toFixed(1)}
                      </span>
                      <span style={s.contadorLabel}>días</span>
                    </>
                  )}
                </div>
                <div style={s.barraWrap}>
                  <div style={{ ...s.barraFill, width: `${pct}%`, backgroundColor: n.barra }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={s.formula}>
        Fórmula: stock actual ÷ promedio diario (últimos 30 días) = días restantes
      </p>
    </div>
  );
}

const s = {
  wrap: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px 14px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 2px",
  },
  sub: {
    fontSize: 11,
    color: "#94a3b8",
    margin: 0,
  },
  alertBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 12px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  lista: {
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid #f8fafc",
    borderLeft: "3px solid transparent",
    gap: 12,
    flexWrap: "wrap",
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 200,
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 6,
    flexShrink: 0,
  },
  info: { flex: 1 },
  nombre: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    margin: "0 0 2px",
  },
  detalle: {
    fontSize: 11,
    color: "#64748b",
    margin: 0,
  },
  rowRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
    minWidth: 90,
  },
  contadorWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: 3,
  },
  contador: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
  },
  contadorLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
  },
  barraWrap: {
    width: 90,
    height: 5,
    backgroundColor: "#f1f5f9",
    borderRadius: 99,
    overflow: "hidden",
  },
  barraFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  formula: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "right",
    padding: "8px 16px",
    margin: 0,
    borderTop: "1px solid #f1f5f9",
    fontStyle: "italic",
  },
};
