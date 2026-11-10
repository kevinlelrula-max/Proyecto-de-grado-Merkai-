import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AnalisisIA() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const cargar = async (forzar = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = forzar
        ? `${BASE_URL}/api/insight/resenas?refresh=1`
        : `${BASE_URL}/api/insight/resenas`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <div style={s.centered}>
      <div style={s.spinner} />
      <p style={s.loadingText}>Analizando reseñas con IA...</p>
    </div>
  );

  if (error) return (
    <div style={s.errorBox}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <p style={{ margin: 0 }}>No se pudo generar el análisis. Intentá de nuevo.</p>
      <button style={s.btnRefresh} onClick={() => cargar(true)}>Reintentar</button>
    </div>
  );

  if (data?.sinDatos) return (
    <div style={s.centered}>
      <span style={{ fontSize: 40 }}>📭</span>
      <p style={{ color: "#94a3b8", margin: 0 }}>Aún no hay reseñas visibles para analizar.</p>
    </div>
  );

  const total = data.total || 1;
  const pPos  = Math.round((data.positivas / total) * 100);
  const pNeu  = Math.round((data.neutras   / total) * 100);
  const pNeg  = Math.round((data.negativas / total) * 100);

  const hora = data.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={s.wrap}>

      {/* Header row */}
      <div style={s.topRow}>
        <div>
          <h3 style={s.sectionTitle}>Análisis de sentimiento</h3>
          <p style={s.sub}>
            Basado en {data.total} reseña{data.total !== 1 ? "s" : ""} visibles
            {data.cached && hora ? ` · Actualizado a las ${hora}` : ""}
          </p>
        </div>
        <button style={s.btnRefresh} onClick={() => cargar(true)}>
          ↻ Actualizar
        </button>
      </div>

      {/* Sentiment bars */}
      <div style={s.sentimentGrid}>
        <SentimentBar label="Positivas" count={data.positivas} pct={pPos} color="#0F6E56" bg="#f0fdf4" />
        <SentimentBar label="Neutras"   count={data.neutras}   pct={pNeu} color="#d97706" bg="#fffbeb" />
        <SentimentBar label="Negativas" count={data.negativas} pct={pNeg} color="#dc2626" bg="#fef2f2" />
      </div>

      {/* AI Summary */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.sparkle}>✦</span>
          <span style={s.cardTitle}>Resumen generado por IA</span>
        </div>
        <p style={s.resumenText}>{data.resumen}</p>
      </div>

      {/* Themes */}
      <div style={s.temasRow}>
        {data.temas_positivos?.length > 0 && (
          <div style={{ flex: 1 }}>
            <p style={s.temaLabel}>👍 Puntos destacados</p>
            <div style={s.chips}>
              {data.temas_positivos.map((t, i) => (
                <span key={i} style={{ ...s.chip, background: "#f0fdf4", color: "#0F6E56", border: "1px solid #bbf7d0" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {data.temas_negativos?.length > 0 && (
          <div style={{ flex: 1 }}>
            <p style={s.temaLabel}>👎 Puntos de mejora</p>
            <div style={s.chips}>
              {data.temas_negativos.map((t, i) => (
                <span key={i} style={{ ...s.chip, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {data.recomendacion && (
        <div style={s.recomBox}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <p style={s.recomTitle}>Recomendación</p>
            <p style={s.recomText}>{data.recomendacion}</p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SentimentBar({ label, count, pct, color, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color }}>{count}</span>
      </div>
      <div style={{ height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width .6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#94a3b8" }}>{pct}% del total</span>
    </div>
  );
}

const s = {
  wrap:        { display: "flex", flexDirection: "column", gap: 16 },
  topRow:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 },
  sub:         { fontSize: 12, color: "#94a3b8", margin: "4px 0 0" },
  sentimentGrid:{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  card:        { background: "linear-gradient(135deg, #0B1628, #0f2240)", borderRadius: 14, padding: "18px 20px" },
  cardHeader:  { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  sparkle:     { color: "#00C9A7", fontSize: 16 },
  cardTitle:   { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" },
  resumenText: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, margin: 0 },
  temasRow:    { display: "flex", gap: 16, flexWrap: "wrap" },
  temaLabel:   { fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 8px" },
  chips:       { display: "flex", flexWrap: "wrap", gap: 6 },
  chip:        { padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  recomBox:    { display: "flex", gap: 12, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px" },
  recomTitle:  { fontSize: 12, fontWeight: 700, color: "#92400e", margin: "0 0 4px" },
  recomText:   { fontSize: 13, color: "#78350f", margin: 0, lineHeight: 1.6 },
  btnRefresh:  { padding: "7px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" },
  centered:    { textAlign: "center", padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  loadingText: { color: "#94a3b8", fontSize: 14, margin: 0 },
  spinner:     { width: 32, height: 32, border: "3px solid #e2e8f0", borderTop: "3px solid #0F6E56", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errorBox:    { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#dc2626", fontSize: 13 },
};
