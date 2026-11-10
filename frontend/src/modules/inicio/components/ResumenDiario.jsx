import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ResumenDiario() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/reportesEmpresa/resumen-diario`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data)   return null;

  const { hoy, ayer, topProductos, porHora, pedidosEntregados } = data;

  const pctIngresos = ayer.ingresos > 0
    ? (((hoy.ingresos - ayer.ingresos) / ayer.ingresos) * 100).toFixed(1)
    : null;

  const sube = pctIngresos !== null && parseFloat(pctIngresos) >= 0;

  const maxHora = porHora.length > 0
    ? Math.max(...porHora.map(h => parseFloat(h.total)))
    : 0;

  const maxProd = topProductos.length > 0
    ? parseFloat(topProductos[0].ingresos)
    : 0;

  const hoy_label = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
  });

  const sinVentas = hoy.transacciones === 0;

  return (
    <div style={s.wrap}>
      {/* ── ENCABEZADO ── */}
      <button style={s.header} onClick={() => setAbierto(v => !v)}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <p style={s.headerTitle}>Resumen del día</p>
            <p style={s.headerSub}>{hoy_label}</p>
          </div>
        </div>
        <div style={s.headerRight}>
          {!sinVentas && (
            <span style={{ ...s.trendBadge, backgroundColor: sube ? "#dcfce7" : "#fef2f2", color: sube ? "#166534" : "#b91c1c" }}>
              {sube ? "↑" : "↓"} {Math.abs(pctIngresos)}% vs ayer
            </span>
          )}
          <span style={s.chevron}>{abierto ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* ── KPIs PRINCIPALES ── */}
      <div style={s.kpiRow}>
        <div style={s.kpi}>
          <p style={s.kpiVal}>
            {sinVentas ? "$0" : `$${Number(hoy.ingresos).toLocaleString("es-CO")}`}
          </p>
          <p style={s.kpiLabel}>ingresos hoy</p>
          {ayer.ingresos > 0 && (
            <p style={{ ...s.kpiComp, color: sube ? "#16a34a" : "#dc2626" }}>
              vs ${Number(ayer.ingresos).toLocaleString("es-CO")} ayer
            </p>
          )}
        </div>
        <div style={s.kpiDiv} />
        <div style={s.kpi}>
          <p style={s.kpiVal}>{hoy.transacciones}</p>
          <p style={s.kpiLabel}>transacciones</p>
          {ayer.transacciones > 0 && (
            <p style={s.kpiComp}>vs {ayer.transacciones} ayer</p>
          )}
        </div>
        <div style={s.kpiDiv} />
        <div style={s.kpi}>
          <p style={s.kpiVal}>{pedidosEntregados}</p>
          <p style={s.kpiLabel}>entregados</p>
        </div>
      </div>

      {/* ── CUERPO EXPANDIBLE ── */}
      {abierto && (
        <div style={s.body}>

          {/* Top productos */}
          {topProductos.length > 0 && (
            <div style={s.section}>
              <p style={s.secTitle}>Top productos hoy</p>
              <div style={s.prodList}>
                {topProductos.map((p, i) => {
                  const pct = maxProd > 0 ? (parseFloat(p.ingresos) / maxProd) * 100 : 0;
                  return (
                    <div key={i} style={s.prodRow}>
                      <span style={s.medal}>{i + 1}</span>
                      <div style={s.prodInfo}>
                        <div style={s.prodNameRow}>
                          <span style={s.prodNombre}>{p.nombre}</span>
                          <span style={s.prodIngreso}>
                            ${Number(p.ingresos).toLocaleString("es-CO")}
                          </span>
                        </div>
                        <div style={s.barraWrap}>
                          <div style={{ ...s.barraFill, width: `${pct}%`, backgroundColor: i === 0 ? "#0F6E56" : i === 1 ? "#2563eb" : "#8b5cf6" }} />
                        </div>
                        <span style={s.prodUnidades}>{p.unidades} unidades</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Distribución por hora */}
          {porHora.length > 0 && (
            <div style={s.section}>
              <p style={s.secTitle}>Ventas por hora (POS)</p>
              <div style={s.chartWrap}>
                {Array.from({ length: 24 }, (_, h) => {
                  const entry = porHora.find(r => r.hora === h);
                  const val   = entry ? parseFloat(entry.total) : 0;
                  const pct   = maxHora > 0 ? (val / maxHora) * 100 : 0;
                  const esPico = val === maxHora && val > 0;
                  return (
                    <div key={h} style={s.barCol} title={val > 0 ? `${h}:00 — $${Number(val).toLocaleString("es-CO")}` : `${h}:00 — sin ventas`}>
                      <div style={s.barSlot}>
                        {pct > 0 && (
                          <div style={{ ...s.barFill, height: `${pct}%`, backgroundColor: esPico ? "#0F6E56" : "#93c5fd" }} />
                        )}
                      </div>
                      {h % 4 === 0 && <span style={s.horaLabel}>{h}h</span>}
                    </div>
                  );
                })}
              </div>
              {maxHora > 0 && (
                <p style={s.picoLabel}>
                  Hora pico: {porHora.find(r => parseFloat(r.total) === maxHora)?.hora}:00 · ${Number(maxHora).toLocaleString("es-CO")}
                </p>
              )}
            </div>
          )}

          {sinVentas && (
            <p style={s.sinVentas}>Aún no hay ventas registradas hoy. ¡El día apenas comienza!</p>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: {
    backgroundColor: "white",
    borderRadius: 16,
    border: "1.5px solid #e2e8f0",
    overflow: "hidden",
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    border: "none",
    cursor: "pointer",
    gap: 12,
    flexWrap: "wrap",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerIcon: { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", borderRadius: 8, flexShrink: 0 },
  headerTitle: { fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" },
  headerSub:   { fontSize: 11, color: "#94a3b8", margin: 0, textTransform: "capitalize" },
  headerRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  trendBadge: {
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
  },
  chevron: { fontSize: 11, color: "#94a3b8" },

  kpiRow: {
    display: "flex",
    alignItems: "center",
    padding: "18px 24px",
    gap: 0,
    borderBottom: "1px solid #f1f5f9",
  },
  kpi: { flex: 1, textAlign: "center" },
  kpiVal: { fontSize: 26, fontWeight: 900, color: "#0f172a", margin: "0 0 2px", lineHeight: 1 },
  kpiLabel: { fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 },
  kpiComp: { fontSize: 10, color: "#94a3b8", margin: 0 },
  kpiDiv: { width: 1, height: 44, backgroundColor: "#f1f5f9", flexShrink: 0 },

  body: { padding: "0 20px 20px" },
  section: { marginTop: 20 },
  secTitle: { fontSize: 12, fontWeight: 800, color: "#0f172a", margin: "0 0 12px", letterSpacing: "0.02em" },

  prodList: { display: "flex", flexDirection: "column", gap: 12 },
  prodRow: { display: "flex", alignItems: "flex-start", gap: 10 },
  medal: { fontSize: 11, fontWeight: 800, color: "#94a3b8", width: 18, textAlign: "center", flexShrink: 0, marginTop: 2 },
  prodInfo: { flex: 1 },
  prodNameRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 },
  prodNombre: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  prodIngreso: { fontSize: 13, fontWeight: 800, color: "#0F6E56" },
  barraWrap: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 99, overflow: "hidden", marginBottom: 3 },
  barraFill: { height: "100%", borderRadius: 99, transition: "width 0.5s ease" },
  prodUnidades: { fontSize: 10, color: "#94a3b8" },

  chartWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 64,
    padding: "0 0 18px",
    position: "relative",
  },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", position: "relative" },
  barSlot: {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    borderRadius: "3px 3px 0 0",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: "3px 3px 0 0", minHeight: 3, transition: "height 0.4s ease" },
  horaLabel: {
    fontSize: 9,
    color: "#94a3b8",
    position: "absolute",
    bottom: -16,
    left: "50%",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
  },
  picoLabel: { fontSize: 11, color: "#0F6E56", fontWeight: 700, marginTop: 4, textAlign: "right" },

  sinVentas: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    padding: "20px 0 4px",
    fontStyle: "italic",
  },
};
