import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.code}>404</div>
        <h1 style={s.title}>Página no encontrada</h1>
        <p style={s.subtitle}>La dirección que buscas no existe o fue movida.</p>
        <div style={s.actions}>
          <button style={s.btnPrimary} onClick={() => navigate(-1)}>
            ← Volver atrás
          </button>
          <button style={s.btnSecondary} onClick={() => navigate("/")}>
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    textAlign: "center",
    padding: "48px 40px",
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    maxWidth: 400,
    width: "90%",
  },
  code: {
    fontSize: 80,
    fontWeight: 800,
    color: "#3674B5",
    lineHeight: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 10px",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: "0 0 32px",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "11px 24px",
    background: "#3674B5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "11px 24px",
    background: "#f1f5f9",
    color: "#0f172a",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
