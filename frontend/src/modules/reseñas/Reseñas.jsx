import { useState, useEffect, useCallback } from "react";
import { Star, Sparkles, Eye, EyeOff, Trash2, LayoutGrid, List, Package } from "lucide-react";
import { getReseñasEmpresa, toggleReseña, eliminarReseña } from "./services/reseñasService";
import Estrellas from "./components/Estrellas";
import AnalisisIA from "./components/AnalisisIA";
import { SkeletonTable } from "../../components/SkeletonLoader";

const sentimientoColor = (cal) => {
  if (cal >= 4) return { label: "Positiva", color: "#16a34a", bg: "#f0fdf4" };
  if (cal === 3) return { label: "Neutral",  color: "#d97706", bg: "#fffbeb" };
  return            { label: "Negativa", color: "#dc2626", bg: "#fef2f2" };
};

const AVATAR_COLORS = ["#2563eb","#0891b2","#7c3aed","#db2777","#ea580c","#059669","#d97706"];
const avatarBg = (nombre = "") => AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length];

export default function Reseñas() {
  const [reseñas,  setReseñas]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState("todas");
  const [tab,      setTab]      = useState("resenas");
  const [pendingId, setPendingId] = useState(null);
  const [vistaGrid, setVistaGrid] = useState(true);
  const token = localStorage.getItem("token");

  const cargar = useCallback(async () => {
    setLoading(true);
    try { setReseñas(await getReseñasEmpresa(token)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle  = async (id) => {
    await toggleReseña(id, token);
    setReseñas(prev => prev.map(r => r.id === id ? { ...r, activo: !r.activo } : r));
  };
  const handleEliminar = async (id) => {
    await eliminarReseña(id, token);
    setReseñas(prev => prev.filter(r => r.id !== id));
    setPendingId(null);
  };

  const visibles = reseñas.filter(r => r.activo);
  const filtradas = filtro === "visibles" ? visibles
    : filtro === "ocultas" ? reseñas.filter(r => !r.activo)
    : reseñas;

  const promedio = visibles.length > 0
    ? (visibles.reduce((a, r) => a + r.calificacion, 0) / visibles.length).toFixed(1)
    : null;

  if (loading) return <div style={{ padding: 28 }}><SkeletonTable rows={5} /></div>;

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Reseñas de clientes</h2>
          <p style={s.subtitle}>Lo que dicen tus clientes sobre tus productos</p>
        </div>
        <div style={s.tabsWrap}>
          <button
            style={{ ...s.tabBtn, ...(tab === "resenas"  ? s.tabActive : {}) }}
            onClick={() => setTab("resenas")}
          >
            Reseñas
          </button>
          <button
            style={{ ...s.tabBtn, ...(tab === "analisis" ? s.tabActive : {}) }}
            onClick={() => setTab("analisis")}
          >
            <Sparkles size={12} />
            Análisis IA
          </button>
        </div>
      </div>

      {tab === "analisis" && <AnalisisIA />}

      {tab === "resenas" && (
        <>
          {/* ── Resumen visual ── */}
          {reseñas.length > 0 && (
            <div style={s.resumen}>
              {/* Promedio destacado */}
              <div style={s.promedioBox}>
                <span style={s.promedioNum}>{promedio ?? "—"}</span>
                {promedio && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Estrellas valor={Math.round(parseFloat(promedio))} tamaño="md" />
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>de 5 posibles</span>
                  </div>
                )}
              </div>

              {/* Métricas secundarias */}
              <div style={s.metricas}>
                <div style={s.metrica}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{reseñas.length}</span>
                  <span style={s.metricaLabel}>en total</span>
                </div>
                <div style={s.separador} />
                <div style={s.metrica}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{visibles.length}</span>
                  <span style={s.metricaLabel}>visibles</span>
                </div>
                <div style={s.separador} />
                <div style={s.metrica}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8" }}>{reseñas.length - visibles.length}</span>
                  <span style={s.metricaLabel}>ocultas</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Filtros + toggle vista ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { key: "todas",    label: "Todas",    count: reseñas.length },
              { key: "visibles", label: "Visibles", count: visibles.length },
              { key: "ocultas",  label: "Ocultas",  count: reseñas.length - visibles.length },
            ].map(f => (
              <button
                key={f.key}
                style={{ ...s.chip, ...(filtro === f.key ? s.chipActive : {}) }}
                onClick={() => setFiltro(f.key)}
              >
                {f.label}
                <span style={{
                  ...s.chipCount,
                  background: filtro === f.key ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: filtro === f.key ? "white" : "#64748b",
                }}>
                  {f.count}
                </span>
              </button>
            ))}

            <div style={{ flex: 1 }} />

            {/* Toggle grid / lista */}
            <div style={s.vistasToggle}>
              <button
                title="Vista cuadrícula"
                style={{ ...s.vistaBtn, backgroundColor: vistaGrid ? "#2563eb" : "transparent", color: vistaGrid ? "white" : "#94a3b8" }}
                onClick={() => setVistaGrid(true)}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                title="Vista lista"
                style={{ ...s.vistaBtn, backgroundColor: !vistaGrid ? "#2563eb" : "transparent", color: !vistaGrid ? "white" : "#94a3b8" }}
                onClick={() => setVistaGrid(false)}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* ── Lista ── */}
          {filtradas.length === 0 ? (
            <div style={s.empty}>
              <Star size={32} color="#e2e8f0" />
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
                {filtro === "ocultas" ? "No tienes reseñas ocultas." : "Aún no hay reseñas aquí."}
              </p>
            </div>
          ) : (
            <div style={{ ...s.lista, gridTemplateColumns: vistaGrid ? "repeat(auto-fill, minmax(420px, 1fr))" : "1fr" }}>
              {filtradas.map(r => {
                const badge = sentimientoColor(r.calificacion);
                const isPending = pendingId === r.id;
                return (
                  <div
                    key={r.id}
                    style={{
                      ...s.card,
                      opacity: r.activo ? 1 : 0.6,
                      borderLeft: `3px solid ${badge.color}`,
                    }}
                  >
                    {/* Fila superior */}
                    <div style={s.cardHeader}>
                      <div style={s.cardUser}>
                        <div style={{ ...s.avatar, background: avatarBg(r.cliente_nombre) }}>
                          {r.cliente_nombre?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <span style={s.userName}>{r.cliente_nombre}</span>
                          {r.producto_nombre && (
                            <span style={s.productoBadge}>
                              <Package size={10} />
                              {r.producto_nombre}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={s.cardMeta}>
                        <Estrellas valor={r.calificacion} tamaño="sm" />
                        <span style={s.fecha}>
                          {new Date(r.creado_en).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Comentario */}
                    {r.comentario && (
                      <p style={s.comentario}>"{r.comentario}"</p>
                    )}

                    {/* Acciones */}
                    <div style={s.cardFooter}>
                      <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      <span style={{
                        ...s.badge,
                        background: r.activo ? "#eff6ff" : "#f8fafc",
                        color: r.activo ? "#2563eb" : "#94a3b8",
                      }}>
                        {r.activo
                          ? <><Eye size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />Visible</>
                          : <><EyeOff size={10} style={{ marginRight: 3, verticalAlign: "middle" }} />Oculta</>
                        }
                      </span>

                      <div style={{ flex: 1 }} />

                      <button
                        style={{ ...s.linkBtn, color: r.activo ? "#64748b" : "#2563eb" }}
                        onClick={() => handleToggle(r.id)}
                      >
                        {r.activo ? "Ocultar" : "Mostrar"}
                      </button>

                      {isPending ? (
                        <div style={s.confirmRow}>
                          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>¿Seguro?</span>
                          <button style={s.btnYes} onClick={() => handleEliminar(r.id)}>Sí, eliminar</button>
                          <button style={s.btnNo} onClick={() => setPendingId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <button
                          style={{ ...s.linkBtn, color: "#ef4444" }}
                          onClick={() => setPendingId(r.id)}
                        >
                          <Trash2 size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  page:       { padding: 28, fontFamily: "'Inter','Segoe UI',sans-serif" },

  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 },
  title:      { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" },
  subtitle:   { fontSize: 13, color: "#94a3b8", margin: 0 },

  tabsWrap:   { display: "flex", gap: 3, background: "#f1f5f9", borderRadius: 10, padding: 4 },
  tabBtn:     { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b", background: "transparent", transition: "all 0.15s" },
  tabActive:  { backgroundColor: "#2563eb", color: "white" },

  resumen:    { display: "flex", alignItems: "center", background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 28px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap", gap: 24 },
  promedioBox:{ display: "flex", alignItems: "center", gap: 14, paddingRight: 24, borderRight: "1px solid #f1f5f9" },
  promedioNum:{ fontSize: 48, fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.03em" },
  metricas:   { display: "flex", alignItems: "center", gap: 20, paddingLeft: 4 },
  metrica:    { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  metricaLabel:{ fontSize: 11, color: "#94a3b8", fontWeight: 500 },
  separador:  { width: 1, height: 32, background: "#f1f5f9" },

  filtros:    { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  chip:       { display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", border: "1.5px solid #e2e8f0", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "white", color: "#475569", transition: "all 0.15s" },
  chipActive: { background: "#2563eb", borderColor: "#2563eb", color: "white" },
  chipCount:  { fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999 },

  empty:      { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "60px 24px", color: "#94a3b8" },

  vistasToggle: { display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 2 },
  vistaBtn:     { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "none", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" },
  lista:        { display: "grid", gap: 12 },
  card:       { background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  cardUser:   { display: "flex", alignItems: "center", gap: 10 },
  avatar:     { width: 38, height: 38, borderRadius: "50%", color: "white", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  userName:      { display: "block", fontSize: 14, fontWeight: 600, color: "#0f172a" },
  productoBadge: { display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, padding: "2px 8px", borderRadius: 6, background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600 },
  cardMeta:   { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 },
  fecha:      { fontSize: 11, color: "#94a3b8" },
  comentario: { fontSize: 13.5, color: "#374151", lineHeight: 1.65, fontStyle: "italic", margin: 0, background: "#f8fafc", borderRadius: 10, padding: "10px 14px" },
  cardFooter: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  badge:      { display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 },
  linkBtn:    { background: "none", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "2px 4px", display: "inline-flex", alignItems: "center" },
  confirmRow: { display: "inline-flex", alignItems: "center", gap: 6 },
  btnYes:     { padding: "4px 10px", fontSize: 12, fontWeight: 700, background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer" },
  btnNo:      { padding: "4px 10px", fontSize: 12, fontWeight: 500, background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 6, cursor: "pointer" },
};
