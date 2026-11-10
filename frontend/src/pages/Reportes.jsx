import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, Sparkles, Target,
  DollarSign, Receipt, Package, Users, Banknote, Layers, BarChart2,
  Download, Printer, Inbox, AlertTriangle, Star,
} from "lucide-react";
import MetaVentas from "../modules/reportes/components/MetaVentas";
import { useMetaVentas } from "../modules/reportes/hooks/useMetaVentas";
import { getReporteEmpresa, getReporteRentabilidad, getReporteComparativa } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  verde:   "#00C9A7",
  azul:    "#3B82F6",
  violeta: "#8B5CF6",
  naranja: "#F59E0B",
  rojo:    "#EF4444",
  cielo:   "#0EA5E9",
  rosa:    "#EC4899",
  lima:    "#84CC16",
};
const PALETTE = Object.values(C);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtShort = (n) => {
  n = parseFloat(n) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};

const fmtDia = (str) => {
  if (!str) return "";
  const d = new Date(String(str).slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
};

const pctColor = (v) => v > 0 ? C.verde : v < 0 ? C.rojo : "#94a3b8";
const pctArrow = (v) => v > 0 ? "↑" : v < 0 ? "↓" : "—";

// ── Tooltip ────────────────────────────────────────────────────────────────────
const TooltipDark = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>{fmtDia(label) || label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || "#fff", margin: 0 }}>
          {fmtShort(p.value)}
          {payload.length > 1 && (
            <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 5, color: "rgba(255,255,255,0.45)" }}>
              {p.name}
            </span>
          )}
        </p>
      ))}
    </div>
  );
};

// ── Componentes reutilizables ──────────────────────────────────────────────────
function Spinner() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ padding: 40, display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #e2e8f0", borderTopColor: C.verde, animation: "spin 0.8s linear infinite" }} />
        Cargando...
      </div>
    </>
  );
}

function Empty({ msg = "Sin datos en este período" }) {
  return (
    <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <Inbox size={28} color="#e2e8f0" />
      {msg}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon, delta }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 5 }}>
      <div>
        <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</span>
        {delta != null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: pctColor(delta) }}>
            {pctArrow(delta)} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Selector de período (compartido) ──────────────────────────────────────────
const PERIODOS = [
  { key: "hoy",    label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes",    label: "Este mes" },
  { key: "año",    label: "Este año" },
];

function SelectorPeriodo({ value, onChange }) {
  return (
    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2 }}>
      {PERIODOS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)} style={{
          padding: "6px 14px", borderRadius: 8, border: "none",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          background: value === p.key ? "#fff" : "transparent",
          color:      value === p.key ? "#0f172a" : "#94a3b8",
          boxShadow:  value === p.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.15s",
        }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — RESUMEN
// ══════════════════════════════════════════════════════════════════════════════
function TabResumen({ periodo }) {
  const token = localStorage.getItem("token");
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    setLoad(true);
    getReporteEmpresa(token, periodo).then(d => { setData(d); setLoad(false); });
  }, [periodo]);

  const exportar = () => {
    if (!data) return;
    const rows = [
      ["Reporte Resumen", periodo],
      ["Ingresos", data.kpis.ingresos],
      ["Ventas", data.kpis.total_ventas],
      ["Ticket promedio", data.kpis.ticket_promedio],
      ["Clientes activos", data.kpis.clientes_activos],
      [],
      ["Top productos", "Ingresos", "Unidades"],
      ...data.topProductos.map(p => [p.nombre, p.ingresos, p.unidades]),
      [],
      ["Top clientes", "Total", "Compras"],
      ...data.topClientes.map(c => [c.nombre, c.total, c.compras]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `resumen_${periodo}_${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <Spinner />;
  if (!data)   return <Empty msg="No se pudo cargar el resumen." />;

  const { kpis, ventasPorDia, topProductos, topClientes, posVsOnline } = data;

  // Rellena días sin ventas con total:0 para que la línea no se entrecorte
  const filledVentasPorDia = (() => {
    const map = {};
    ventasPorDia.forEach(r => { map[String(r.dia).slice(0, 10)] = parseFloat(r.total || 0); });
    const hoy   = new Date();
    const desde = new Date();
    if (periodo === "semana") desde.setDate(hoy.getDate() - 6);
    else if (periodo === "mes")  { desde.setDate(1); }
    else if (periodo === "año")  { desde.setMonth(0); desde.setDate(1); }
    const result = [];
    let cur = new Date(desde.toISOString().slice(0, 10) + "T00:00:00");
    const fin = new Date(hoy.toISOString().slice(0, 10) + "T00:00:00");
    while (cur <= fin) {
      const key = cur.toISOString().slice(0, 10);
      result.push({ dia: key, total: map[key] ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  })();

  const maxIngreso   = Math.max(...topProductos.map(p => parseFloat(p.ingresos)), 1);
  const totalCanales = parseFloat(posVsOnline.pos) + parseFloat(posVsOnline.online);
  const pieData      = [
    { name: "POS",    value: parseFloat(posVsOnline.pos) },
    { name: "Online", value: parseFloat(posVsOnline.online) },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Botones exportar */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }} className="rep-export-btns">
        <button onClick={exportar} style={sBtn}><Download size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />CSV</button>
        <button onClick={() => window.print()} style={sBtn}><Printer size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />Imprimir</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="rep-kpi-grid">
        <KpiCard label="Ingresos totales"  value={fmt(kpis.ingresos)}         sub="Total del período"         color={C.azul} icon={<DollarSign size={16} />} />
        <KpiCard label="Ticket promedio"   value={fmt(kpis.ticket_promedio)}   sub="Por transacción"           color={C.azul} icon={<Receipt size={16} />} />
        <KpiCard label="Total ventas"      value={kpis.total_ventas}           sub="POS + online"              color={C.azul} icon={<Package size={16} />} />
        <KpiCard label="Clientes activos"  value={kpis.clientes_activos}       sub="Compraron en este período" color={C.azul} icon={<Users size={16} />} />
      </div>

      {/* Línea de ingresos */}
      <div style={sCard}>
        <div style={sCardHdr}><h3 style={sCardTitle}>Tendencia de ingresos</h3><span style={sCardSub}>POS + Online por día</span></div>
        {filledVentasPorDia.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={filledVentasPorDia} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs />
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dia" tickFormatter={fmtDia} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<TooltipDark />} />
              <Line type="monotone" dataKey="total" stroke={C.azul} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: C.azul }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top productos + Canal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }} className="rep-two-col">
        <div style={sCard}>
          <div style={sCardHdr}><h3 style={sCardTitle}>Top productos</h3><span style={sCardSub}>Por ingresos generados</span></div>
          {topProductos.length === 0 ? <Empty /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topProductos.map((p, i) => {
                const pct = (parseFloat(p.ingresos) / maxIngreso * 100);
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.azul, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{p.nombre}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{parseFloat(p.unidades).toFixed(1)} und</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmtShort(p.ingresos)}</span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: "#f1f5f9" }}>
                      <div style={{ height: "100%", borderRadius: 999, width: `${pct}%`, background: C.azul, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={sCard}>
          <div style={sCardHdr}><h3 style={sCardTitle}>Canal de venta</h3><span style={sCardSub}>POS vs Tienda online</span></div>
          {pieData.length === 0 ? <Empty /> : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={38}>
                    {pieData.map((_, i) => <Cell key={i} fill={[C.azul, C.verde][i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtShort(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {pieData.map((d, i) => {
                  const pct = totalCanales > 0 ? ((d.value / totalCanales) * 100).toFixed(1) : 0;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 2, background: [C.azul, C.verde][i] }} />
                        <span style={{ fontSize: 13, color: "#475569" }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmtShort(d.value)} <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>{pct}%</span></span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top clientes */}
      <div style={sCard}>
        <div style={sCardHdr}><h3 style={sCardTitle}>Mejores clientes</h3><span style={sCardSub}>Por ingresos generados</span></div>
        {topClientes.length === 0 ? <Empty msg="Sin datos de clientes" /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["#","Cliente","Compras","Total","Participación"].map(h => <th key={h} style={sTh}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {topClientes.map((c, i) => {
                const tot = topClientes.reduce((a, x) => a + parseFloat(x.total), 0);
                const pct = tot > 0 ? ((parseFloat(c.total) / tot) * 100).toFixed(1) : 0;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={sTd}><span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:6,fontSize:12,fontWeight:700,background:i===0?"#fef9c3":"#f8fafc",color:i===0?"#854d0e":"#64748b" }}>{i+1}</span></td>
                    <td style={{ ...sTd, fontWeight: 500, color: "#0f172a" }}>{c.nombre}</td>
                    <td style={sTd}>{c.compras} compras</td>
                    <td style={{ ...sTd, fontWeight: 700 }}>{fmt(c.total)}</td>
                    <td style={sTd}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <div style={{ flex:1,height:5,borderRadius:999,background:"#f1f5f9",minWidth:60 }}>
                          <div style={{ height:"100%",borderRadius:999,width:`${pct}%`,background:C.azul }} />
                        </div>
                        <span style={{ fontSize:12,color:"#64748b",width:34,textAlign:"right" }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — RENTABILIDAD
// ══════════════════════════════════════════════════════════════════════════════
function TabRentabilidad({ periodo }) {
  const token = localStorage.getItem("token");
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);
  const [orden, setOrden]  = useState("ganancia"); // ganancia | margen | ingresos

  useEffect(() => {
    setLoad(true);
    getReporteRentabilidad(token, periodo).then(d => { setData(d); setLoad(false); });
  }, [periodo]);

  if (loading) return <Spinner />;
  if (!data || data.productos.length === 0) return <Empty msg="Sin datos de ventas para calcular rentabilidad." />;

  const { productos, totales } = data;

  const sorted = [...productos].sort((a, b) => parseFloat(b[orden === "ganancia" ? "ganancia_bruta" : orden === "margen" ? "margen_pct" : "ingresos_brutos"]) - parseFloat(a[orden === "ganancia" ? "ganancia_bruta" : orden === "margen" ? "margen_pct" : "ingresos_brutos"]));
  const maxGanancia = Math.max(...sorted.map(p => parseFloat(p.ganancia_bruta)), 1);
  const sinCosto    = productos.filter(p => !p.precio_costo || parseFloat(p.precio_costo) === 0).length;

  const exportarCSV = () => {
    const rows = [
      ["Reporte de Rentabilidad", periodo, new Date().toLocaleDateString("es-CO")],
      [],
      ["RESUMEN GLOBAL"],
      ["Ingresos brutos", totales.ingresos],
      ["Costo total",     totales.costo],
      ["Ganancia bruta",  totales.ganancia],
      ["Margen promedio", totales.margen_pct + "%"],
      [],
      ["DETALLE POR PRODUCTO"],
      ["Producto","Unidades vendidas","Precio venta","Precio costo","Ingresos","Costo total","Ganancia","Margen %"],
      ...sorted.map(p => [
        p.nombre, parseFloat(p.unidades_vendidas).toFixed(1),
        p.precio || "", p.precio_costo || "",
        p.ingresos_brutos, p.costo_total, p.ganancia_bruta, p.margen_pct + "%",
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `rentabilidad_${periodo}_${new Date().toISOString().slice(0,10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Botones exportar */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }} className="rep-export-btns">
        <button onClick={exportarCSV} style={sBtn}><Download size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />CSV</button>
        <button onClick={() => window.print()} style={sBtn}><Printer size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />Imprimir</button>
      </div>

      {/* Alerta si hay productos sin costo cargado */}
      {sinCosto > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span><strong>{sinCosto} producto{sinCosto > 1 ? "s" : ""}</strong> no tiene precio de costo cargado — el margen puede estar inflado. Cárgalo desde la sección de Productos.</span>
        </div>
      )}

      {/* KPIs globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="rep-kpi-grid">
        <KpiCard label="Ingresos brutos"   value={fmtShort(totales.ingresos)}  sub="Total vendido"          color={C.azul} icon={<Banknote size={16} />} />
        <KpiCard label="Costo total"        value={fmtShort(totales.costo)}     sub="Costo de lo vendido"    color={C.azul} icon={<Layers size={16} />} />
        <KpiCard label="Ganancia bruta"     value={fmtShort(totales.ganancia)}  sub="Ingresos − Costos"      color={C.azul} icon={<TrendingUp size={16} />} />
        <KpiCard label="Margen promedio"    value={`${totales.margen_pct}%`}    sub="Sobre ingresos totales" color={C.azul} icon={<BarChart2 size={16} />} />
      </div>

      {/* Barra global ingresos vs costo vs ganancia */}
      <div style={sCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><h3 style={sCardTitle}>Rentabilidad por producto</h3><span style={sCardSub}>Ganancia bruta = Ingresos − Costo de lo vendido</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["ganancia","Ganancia"],["margen","Margen %"],["ingresos","Ingresos"]].map(([k,l]) => (
              <button key={k} onClick={() => setOrden(k)} style={{
                padding: "5px 12px", borderRadius: 7, border: "1px solid",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderColor: orden === k ? C.azul : "#e2e8f0",
                background:  orden === k ? `${C.azul}12` : "#fff",
                color:       orden === k ? C.azul : "#94a3b8",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sorted.map((p, i) => {
            const ingresos  = parseFloat(p.ingresos_brutos);
            const ganancia  = parseFloat(p.ganancia_bruta);
            const margen    = parseFloat(p.margen_pct);
            const barPct    = (ganancia / maxGanancia * 100);
            const margenColor = margen >= 30 ? C.verde : margen >= 15 ? C.naranja : C.rojo;

            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px 80px 70px", gap: 12, alignItems: "center" }}>
                {/* Nombre */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.azul, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.nombre}>{p.nombre}</span>
                </div>
                {/* Barra doble: ingreso gris, ganancia coloreada */}
                <div style={{ position: "relative", height: 10, borderRadius: 999, background: "#f1f5f9" }}>
                  <div style={{ position:"absolute", top:0, left:0, height:"100%", borderRadius:999, width:`${Math.min(100, ingresos / maxGanancia * 100)}%`, background:"#e2e8f0" }} />
                  <div style={{ position:"absolute", top:0, left:0, height:"100%", borderRadius:999, width:`${Math.max(0, barPct)}%`, background: ganancia >= 0 ? C.azul : C.rojo, transition:"width 0.4s" }} />
                </div>
                {/* Ingresos */}
                <span style={{ fontSize: 12, color: "#64748b", textAlign: "right" }}>{fmtShort(ingresos)}</span>
                {/* Ganancia */}
                <span style={{ fontSize: 13, fontWeight: 700, color: ganancia >= 0 ? "#0f172a" : C.rojo, textAlign: "right" }}>{fmtShort(ganancia)}</span>
                {/* Margen % */}
                <span style={{ fontSize: 12, fontWeight: 700, color: margenColor, textAlign: "right", background: `${margenColor}12`, padding: "2px 7px", borderRadius: 6 }}>
                  {margen}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Leyenda */}
        <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
          <span><span style={{ color: "#e2e8f0", fontWeight:700 }}>■</span> Ingresos brutos</span>
          <span><span style={{ color: C.azul, fontWeight:700 }}>■</span> Ganancia bruta</span>
          <span style={{ color: C.verde }}>≥30% buen margen</span>
          <span style={{ color: C.naranja }}>15–30% margen medio</span>
          <span style={{ color: C.rojo }}>&lt;15% margen bajo</span>
        </div>
      </div>

      {/* Tabla detalle */}
      <div style={sCard}>
        <div style={sCardHdr}><h3 style={sCardTitle}>Detalle completo</h3><span style={sCardSub}>Todos los productos con actividad en el período</span></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Producto","Und. vendidas","Precio venta","Precio costo","Ingresos","Costo total","Ganancia","Margen"].map(h => <th key={h} style={sTh}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const margen = parseFloat(p.margen_pct);
              const mc = margen >= 30 ? C.verde : margen >= 15 ? C.naranja : C.rojo;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ ...sTd, fontWeight: 500, color: "#0f172a" }}>{p.nombre}</td>
                  <td style={sTd}>{parseFloat(p.unidades_vendidas).toFixed(1)}</td>
                  <td style={sTd}>{p.precio ? fmt(p.precio) : "—"}</td>
                  <td style={sTd}>{p.precio_costo ? fmt(p.precio_costo) : <span style={{ color: C.naranja }}>Sin costo</span>}</td>
                  <td style={{ ...sTd, fontWeight: 600 }}>{fmt(p.ingresos_brutos)}</td>
                  <td style={{ ...sTd, color: "#64748b" }}>{fmt(p.costo_total)}</td>
                  <td style={{ ...sTd, fontWeight: 700, color: parseFloat(p.ganancia_bruta) >= 0 ? "#0f172a" : C.rojo }}>{fmt(p.ganancia_bruta)}</td>
                  <td style={sTd}><span style={{ fontSize: 12, fontWeight: 700, color: mc, background: `${mc}12`, padding: "2px 8px", borderRadius: 6 }}>{margen}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — COMPARATIVA
// ══════════════════════════════════════════════════════════════════════════════
function TabComparativa({ periodo }) {
  const token = localStorage.getItem("token");
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    setLoad(true);
    getReporteComparativa(token, periodo).then(d => { setData(d); setLoad(false); });
  }, [periodo]);

  if (loading) return <Spinner />;
  if (!data)   return <Empty msg="No se pudo cargar la comparativa." />;

  const { actual, anterior, cambios, label, labelAnterior } = data;

  const exportarCSV = () => {
    const rows = [
      ["Reporte Comparativa", periodo, new Date().toLocaleDateString("es-CO")],
      [],
      ["Métrica", label, labelAnterior, "Cambio %"],
      ["Ingresos",         actual.ingresos,         anterior.ingresos,         cambios.ingresos         + "%"],
      ["Ventas",           actual.total_ventas,     anterior.total_ventas,     cambios.total_ventas     + "%"],
      ["Ticket promedio",  actual.ticket_promedio,  anterior.ticket_promedio,  cambios.ticket_promedio  + "%"],
      ["Clientes activos", actual.clientes_activos, anterior.clientes_activos, cambios.clientes_activos + "%"],
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `comparativa_${periodo}_${new Date().toISOString().slice(0,10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  // Unir días para gráfica superpuesta
  const todasFechas = [...new Set([
    ...actual.ventasPorDia.map(d => d.dia),
    ...anterior.ventasPorDia.map(d => d.dia),
  ])].sort();

  // Para la gráfica usamos índice de día (Día 1, Día 2…) alineando por posición
  const maxLen  = Math.max(actual.ventasPorDia.length, anterior.ventasPorDia.length);
  const grafica = Array.from({ length: maxLen }, (_, i) => ({
    dia:      `Día ${i + 1}`,
    actual:   actual.ventasPorDia[i]   ? parseFloat(actual.ventasPorDia[i].total)   : null,
    anterior: anterior.ventasPorDia[i] ? parseFloat(anterior.ventasPorDia[i].total) : null,
  }));

  const kpisMeta = [
    { key: "ingresos",         label: "Ingresos",         fmt: fmt    },
    { key: "total_ventas",     label: "Ventas",            fmt: v => v },
    { key: "ticket_promedio",  label: "Ticket promedio",   fmt: fmt    },
    { key: "clientes_activos", label: "Clientes activos",  fmt: v => v },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Botones exportar */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }} className="rep-export-btns">
        <button onClick={exportarCSV} style={sBtn}><Download size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />CSV</button>
        <button onClick={() => window.print()} style={sBtn}><Printer size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />Imprimir</button>
      </div>

      {/* KPIs comparativos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="rep-kpi-grid">
        {kpisMeta.map(m => {
          const delta = cambios[m.key];
          return (
            <div key={m.key} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{m.label}</span>
              </div>
              {/* Período actual */}
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 6 }}>
                {m.fmt(actual[m.key])}
              </div>
              {/* Delta */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: pctColor(delta),
                  background: `${pctColor(delta)}15`, padding: "2px 8px", borderRadius: 6,
                }}>
                  {pctArrow(delta)} {Math.abs(delta)}%
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>vs {labelAnterior}</span>
              </div>
              {/* Período anterior */}
              <div style={{ fontSize: 12, color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                {labelAnterior}: <strong style={{ color: "#64748b" }}>{m.fmt(anterior[m.key])}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfica superpuesta */}
      <div style={sCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={sCardTitle}>Ingresos día a día</h3>
            <span style={sCardSub}>Comparación alineada por posición en el período</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 3, borderRadius: 2, background: C.azul, display: "inline-block" }} />{label}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 3, borderRadius: 2, background: "#cbd5e1", display: "inline-block", borderBottom: "2px dashed #cbd5e1" }} />{labelAnterior}</span>
          </div>
        </div>
        {grafica.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={grafica} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<TooltipDark />} />
              <Line type="monotone" dataKey="actual"   name={label}         stroke={C.azul}   strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="anterior" name={labelAnterior} stroke="#cbd5e1"  strokeWidth={2}   dot={false} strokeDasharray="5 3" activeDot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla resumen lado a lado */}
      <div style={sCard}>
        <div style={sCardHdr}><h3 style={sCardTitle}>Resumen comparativo</h3><span style={sCardSub}>{label} vs {labelAnterior}</span></div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={sTh}>Métrica</th>
              <th style={{ ...sTh, color: C.azul }}>{label}</th>
              <th style={{ ...sTh, color: "#94a3b8" }}>{labelAnterior}</th>
              <th style={sTh}>Variación</th>
            </tr>
          </thead>
          <tbody>
            {kpisMeta.map(m => {
              const delta = cambios[m.key];
              return (
                <tr key={m.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ ...sTd, fontWeight: 500 }}>{m.label}</td>
                  <td style={{ ...sTd, fontWeight: 700, color: "#0f172a" }}>{m.fmt(actual[m.key])}</td>
                  <td style={{ ...sTd, color: "#94a3b8" }}>{m.fmt(anterior[m.key])}</td>
                  <td style={sTd}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: pctColor(delta), background: `${pctColor(delta)}15`, padding: "3px 10px", borderRadius: 7 }}>
                      {pctArrow(delta)} {Math.abs(delta)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB PRONÓSTICO
// ══════════════════════════════════════════════════════════════════════════════
const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function TabPronostico() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/reportesEmpresa/pronostico`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("No se pudo cargar el pronóstico."); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Calculando pronóstico...</div>;
  if (error)   return <div style={{ padding: 20, color: "#b91c1c" }}>{error}</div>;
  if (!data)   return null;

  const { historial, predicciones, baseline, trend } = data;

  const sinDatos = historial.length === 0;
  const trendPct = (trend * 100).toFixed(1);
  const trendUp  = trend > 0.02;
  const trendDn  = trend < -0.02;

  // Últimos 14 días de historial para la gráfica
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const histMap = {};
  historial.forEach(r => { histMap[r.dia] = r.ingresos; });

  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartData.push({
      label: `${DOW_LABELS[d.getDay()]} ${d.getDate()}`,
      actual: histMap[key] || 0,
      prediccion: null,
    });
  }
  predicciones.forEach(p => {
    const d = new Date(p.dia + "T00:00:00");
    chartData.push({
      label: `${DOW_LABELS[p.dow]} ${d.getDate()}`,
      actual: null,
      prediccion: p.prediccion,
    });
  });

  const totalSemana = predicciones.reduce((s, p) => s + p.prediccion, 0);
  const mejorDia    = predicciones.reduce((best, p) => p.prediccion > best.prediccion ? p : best, predicciones[0] || {});
  const mejorDiaLabel = mejorDia?.dia ? `${DOW_LABELS[mejorDia.dow]} ${new Date(mejorDia.dia + "T00:00:00").getDate()}` : "—";

  // Promedios por día de la semana (historial completo)
  const dowSum = {}; const dowCnt = {};
  historial.forEach(r => {
    dowSum[r.dow] = (dowSum[r.dow] || 0) + r.ingresos;
    dowCnt[r.dow] = (dowCnt[r.dow] || 0) + 1;
  });
  const dowData = DOW_LABELS.map((lbl, i) => ({
    dow: i, label: lbl,
    promedio: dowCnt[i] ? Math.round(dowSum[i] / dowCnt[i]) : 0,
  })).sort((a, b) => b.promedio - a.promedio);
  const maxDow = dowData[0]?.promedio || 1;

  if (sinDatos) return (
    <div style={{ ...sCard, textAlign: "center", padding: "48px 24px", color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <TrendingUp size={36} color="#e2e8f0" />
      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Aún no hay suficientes datos para generar un pronóstico.</p>
      <p style={{ fontSize: 12, margin: 0 }}>Registra ventas durante al menos una semana y vuelve aquí.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="rep-kpi-grid">
        {/* Tendencia */}
        <div style={{ ...sCard, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Tendencia actual
          </p>
          <p style={{ fontSize: 32, fontWeight: 900, margin: "0 0 4px", color: trendUp ? "#16a34a" : trendDn ? "#dc2626" : "#64748b" }}>
            {trendUp ? "↑" : trendDn ? "↓" : "→"} {Math.abs(trendPct)}%
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            {trendUp ? "Creciendo" : trendDn ? "Bajando" : "Estable"} vs semana anterior
          </p>
        </div>

        {/* Mejor día previsto */}
        <div style={{ ...sCard, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Mejor día previsto
          </p>
          <p style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", color: C.verde }}>
            {mejorDiaLabel}
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            ${Number(mejorDia?.prediccion || 0).toLocaleString("es-CO")} estimado
          </p>
        </div>

        {/* Total semana */}
        <div style={{ ...sCard, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
            Próximos 7 días
          </p>
          <p style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", color: "#2563eb" }}>
            ${Number(totalSemana).toLocaleString("es-CO")}
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            promedio diario: ${Number(baseline).toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      {/* ── GRÁFICA PRINCIPAL ── */}
      <div style={sCard}>
        <div style={sCardHdr}>
          <p style={sCardTitle}>Ventas: últimas 2 semanas + próximos 7 días</p>
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 12, height: 12, background: "#94a3b8", borderRadius: 3, display: "inline-block" }} />
              Ventas reales
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 12, height: 12, background: C.verde, borderRadius: 3, display: "inline-block" }} />
              Pronóstico
            </span>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={1} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-35} textAnchor="end" height={46} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`} />
              <Tooltip
                formatter={(val, name) => [`$${Number(val).toLocaleString("es-CO")}`, name === "actual" ? "Venta real" : "Pronóstico"]}
                contentStyle={{ borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="actual"     fill="#cbd5e1" radius={[4,4,0,0]} />
              <Bar dataKey="prediccion" fill={C.verde}  radius={[4,4,0,0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
          {/* Línea divisora "HOY" */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "66.5%",
            height: "calc(100% - 46px)",
            width: 2,
            backgroundColor: "#2563eb",
            opacity: 0.4,
            pointerEvents: "none",
          }} />
          <span style={{
            position: "absolute",
            top: 4,
            left: "66.5%",
            transform: "translateX(-50%)",
            fontSize: 9,
            fontWeight: 800,
            color: "#2563eb",
            backgroundColor: "white",
            padding: "1px 4px",
            borderRadius: 4,
          }}>HOY</span>
        </div>
      </div>

      {/* ── MEJOR DÍA DE LA SEMANA (HISTORIAL) ── */}
      <div style={sCard}>
        <div style={sCardHdr}>
          <p style={sCardTitle}>Desempeño histórico por día de la semana</p>
          <p style={sCardSub}>Promedio de ingresos por día · últimos 28 días</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dowData.map((d, i) => (
            <div key={d.dow} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: i === 0 ? C.verde : "#64748b" }}>
                {d.label}
              </span>
              <div style={{ flex: 1, height: 10, backgroundColor: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${maxDow > 0 ? (d.promedio / maxDow) * 100 : 0}%`,
                  backgroundColor: i === 0 ? C.verde : "#93c5fd",
                  borderRadius: 99,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.verde : "#334155", minWidth: 90, textAlign: "right" }}>
                ${Number(d.promedio).toLocaleString("es-CO")}
              </span>
              {i === 0 && <span style={{ fontSize: 10, color: C.verde, fontWeight: 800, display: "flex", alignItems: "center", gap: 3 }}><Star size={10} fill={C.verde} /> mejor</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── TABLA DE PREDICCIONES ── */}
      <div style={sCard}>
        <div style={sCardHdr}>
          <p style={sCardTitle}>Detalle de predicciones — próximos 7 días</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={sTh}>Día</th>
              <th style={{ ...sTh, textAlign: "right" }}>Pronóstico</th>
              <th style={{ ...sTh, textAlign: "right" }}>vs promedio</th>
            </tr>
          </thead>
          <tbody>
            {predicciones.map((p, i) => {
              const d    = new Date(p.dia + "T00:00:00");
              const pct  = baseline > 0 ? ((p.prediccion - baseline) / baseline * 100).toFixed(0) : 0;
              const sube = p.prediccion > baseline;
              return (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "white" }}>
                  <td style={sTd}>
                    <strong>{DOW_LABELS[p.dow]}</strong>{" "}
                    <span style={{ color: "#94a3b8" }}>{d.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                  </td>
                  <td style={{ ...sTd, textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                    ${Number(p.prediccion).toLocaleString("es-CO")}
                  </td>
                  <td style={{ ...sTd, textAlign: "right" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      backgroundColor: sube ? "#dcfce7" : "#fef2f2",
                      color: sube ? "#16a34a" : "#dc2626",
                    }}>
                      {sube ? "+" : ""}{pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", textAlign: "right", marginTop: 10, marginBottom: 0 }}>
          Metodología: promedio móvil por día de la semana × tendencia reciente (últimos 14 vs 14 anteriores)
        </p>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE RAÍZ
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: "resumen",      label: "Resumen"        },
  { key: "rentabilidad", label: "Rentabilidad"   },
  { key: "comparativa",  label: "Comparativa"    },
  { key: "pronostico",   label: "Pronóstico"     },
  { key: "meta",         label: "Meta de ventas" },
];

function TabMeta() {
  const { ventasMes, loading } = useMetaVentas();
  if (loading) return null;
  return <MetaVentas ventasMes={ventasMes} />;
}

export default function Reportes() {
  const [tab,     setTab]     = useState("resumen");
  const [periodo, setPeriodo] = useState("mes");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }} className="rep-page">
      <style>{`
        @media (max-width: 768px) {
          .rep-page { padding: 16px !important; }
          .rep-tabs { overflow-x: auto; flex-wrap: nowrap !important; }
          .rep-tabs button { white-space: nowrap; padding: 10px 14px !important; font-size: 12px !important; }
          .rep-kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .rep-two-col  { grid-template-columns: 1fr !important; }
          .rep-header   { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media print {
          body * { visibility: hidden; }
          .rep-page, .rep-page * { visibility: visible; }
          .rep-page { position: fixed; top: 0; left: 0; width: 100%; padding: 24px !important; }
          .rep-export-btns { display: none !important; }
          .rep-tabs         { display: none !important; }
          .rep-header       { margin-bottom: 16px; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }} className="rep-header">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>Reportes</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>
            Análisis y toma de decisiones
          </p>
        </div>
        <SelectorPeriodo value={periodo} onChange={setPeriodo} />
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #f1f5f9", paddingBottom: 0 }} className="rep-tabs">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", border: "none", background: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: tab === t.key ? "#0f172a" : "#94a3b8",
            borderBottom: `2px solid ${tab === t.key ? C.azul : "transparent"}`,
            marginBottom: -2, transition: "color 0.15s, border-color 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO DEL TAB ACTIVO */}
      {tab === "resumen"      && <TabResumen      periodo={periodo} />}
      {tab === "rentabilidad" && <TabRentabilidad periodo={periodo} />}
      {tab === "comparativa"  && <TabComparativa  periodo={periodo} />}
      {tab === "pronostico"   && <TabPronostico />}
      {tab === "meta"         && <TabMeta />}

    </div>
  );
}

// ── Estilos compartidos ────────────────────────────────────────────────────────
const sCard    = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" };
const sCardHdr = { marginBottom: 14 };
const sCardTitle = { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 3px" };
const sCardSub   = { fontSize: 12, color: "#94a3b8" };
const sBtn = { padding: "7px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" };
const sTh  = { padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e2e8f0" };
const sTd  = { padding: "11px 12px", fontSize: 13, color: "#334155" };
