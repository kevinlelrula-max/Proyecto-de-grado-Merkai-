import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function InsightWidget() {
  const [insight, setInsight]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [generatedAt, setAt]    = useState(null);

  const fetchInsight = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    const url = force ? `${BASE_URL}/api/insight?force=1` : `${BASE_URL}/api/insight`;
    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInsight(d.insight);
        setAt(d.generatedAt);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  const hora = generatedAt
    ? new Date(generatedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.iconWrap}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={s.title}>Análisis del día</div>
          <div style={s.sub}>Generado con IA · {hora ? `Actualizado a las ${hora}` : "Hoy"}</div>
        </div>
        <button
          onClick={() => fetchInsight(true)}
          disabled={loading}
          title="Regenerar análisis"
          style={s.refreshBtn}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      <div style={s.body}>
        {loading && (
          <div style={s.loading}>
            <div style={s.dots}>
              <span style={{ ...s.dot, animationDelay: "0s" }} />
              <span style={{ ...s.dot, animationDelay: ".2s" }} />
              <span style={{ ...s.dot, animationDelay: ".4s" }} />
            </div>
            <span style={s.loadingText}>Analizando tu negocio...</span>
          </div>
        )}

        {error && (
          <div style={s.error}>
            No se pudo generar el análisis. Verificá que la clave de API esté configurada.
          </div>
        )}

        {insight && !loading && (
          <p style={s.text}>{insight}</p>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: .2; transform: scale(.8); }
          50%       { opacity: 1;  transform: scale(1);  }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const s = {
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #e2e8f0",
    borderLeft: "3px solid #2563eb",
  },
  header: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 8,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, color: "#2563eb", flexShrink: 0,
  },
  title: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
  sub:   { fontSize: 12, color: "#334155", marginTop: 1 },
  body:  { minHeight: 40 },
  text: {
    fontSize: 15, color: "#0f172a",
    lineHeight: 1.75, margin: 0,
  },
  loading: {
    display: "flex", alignItems: "center", gap: 10,
  },
  dots: { display: "flex", gap: 5 },
  dot: {
    display: "inline-block", width: 6, height: 6,
    borderRadius: "50%", background: "#2563eb",
    animation: "blink 1.2s ease-in-out infinite",
  },
  loadingText: { fontSize: 13, color: "#334155" },
  refreshBtn: {
    width: 28, height: 28, borderRadius: 7,
    background: "transparent", border: "1px solid #e2e8f0",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "#334155", flexShrink: 0,
    transition: "all 0.15s",
  },
  error: {
    fontSize: 13, color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8, padding: "10px 14px",
  },
};
