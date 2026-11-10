export default function StatCard({ label, valor, descripcion, alerta, color }) {
  return (
    <div style={s.card}>
      <div style={s.top}>
        <span style={s.label}>{label}</span>
        {alerta && <span style={s.dot} />}
      </div>
      <p style={{ ...s.valor, color: alerta ? "#ef4444" : "#0f172a" }}>{valor}</p>
      {descripcion && <p style={s.descripcion}>{descripcion}</p>}
    </div>
  );
}

const s = {
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 20px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    flexShrink: 0,
  },
  valor: {
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  descripcion: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
};