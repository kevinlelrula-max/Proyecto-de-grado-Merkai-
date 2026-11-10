export default function ReordenSugerencias({ sugerencias }) {
  if (!sugerencias || sugerencias.length === 0) return null;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Sugerencias de reorden</h3>
          <p style={s.hint}>Basado en ventas de los últimos 30 días · cobertura sugerida: 7 días</p>
        </div>
        <span style={s.badge}>{sugerencias.length} producto{sugerencias.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Producto</th>
              <th style={{ ...s.th, textAlign: "center" }}>Stock actual</th>
              <th style={{ ...s.th, textAlign: "center" }}>Promedio/día</th>
              <th style={{ ...s.th, textAlign: "center" }}>Pedir ahora</th>
            </tr>
          </thead>
          <tbody>
            {sugerencias.map((p, i) => {
              const sinMovimiento = parseFloat(p.promedio_diario) === 0;
              return (
                <tr key={p.id} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                  <td style={s.tdNombre}>{p.nombre}</td>
                  <td style={s.tdCenter}>
                    <span style={{ ...s.pill, backgroundColor: "#fef2f2", color: "#dc2626" }}>
                      {Number(p.stock).toFixed(1)} {p.unidad || "uds."}
                    </span>
                  </td>
                  <td style={s.tdCenter}>
                    {sinMovimiento ? (
                      <span style={s.sinMov}>Sin ventas</span>
                    ) : (
                      <span style={s.avgVal}>
                        {Number(p.promedio_diario).toFixed(2)} {p.unidad || "uds."}
                      </span>
                    )}
                  </td>
                  <td style={s.tdCenter}>
                    {sinMovimiento ? (
                      <span style={{ ...s.pill, backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
                        —
                      </span>
                    ) : (
                      <span style={{ ...s.pill, backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: "700" }}>
                        {Number(p.cantidad_sugerida).toFixed(1)} {p.unidad || "uds."}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={s.formula}>
        Fórmula: (promedio diario × 7 días) − stock actual
      </p>
    </div>
  );
}

const s = {
  wrap: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid #2563eb",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    gap: 12,
  },
  title: { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" },
  badge: {
    padding: "3px 12px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
  },
  hint: { fontSize: "11px", color: "#94a3b8", margin: 0 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 16px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    textAlign: "left",
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #f1f5f9",
  },
  rowEven: { backgroundColor: "white" },
  rowOdd:  { backgroundColor: "#fafcff" },
  tdNombre: {
    padding: "11px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    borderBottom: "1px solid #f8fafc",
  },
  tdCenter: {
    padding: "11px 16px",
    textAlign: "center",
    fontSize: "13px",
    color: "#374151",
    borderBottom: "1px solid #f8fafc",
  },
  pill: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
  },
  avgVal: {
    fontSize: "12px",
    color: "#0f172a",
    fontWeight: "600",
  },
  sinMov: {
    fontSize: "11px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  formula: {
    fontSize: "10px",
    color: "#94a3b8",
    textAlign: "right",
    padding: "8px 16px",
    margin: 0,
    borderTop: "1px solid #f1f5f9",
    fontStyle: "italic",
  },
};
