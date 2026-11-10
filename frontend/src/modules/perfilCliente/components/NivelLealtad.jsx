import { Trophy, Award } from "lucide-react";

export default function NivelLealtad({ nivelLealtad }) {
  if (!nivelLealtad) return null;

  const { nivel_actual, total_mes, descuento } = nivelLealtad;

  const tierId = nivel_actual?.nombre?.toLowerCase() ?? "";
  const tierColor = tierId.includes("oro") ? "#d97706"
    : tierId.includes("plata") ? "#64748b"
    : tierId.includes("bronce") ? "#b45309"
    : "#2563eb";
  const tierBg = tierId.includes("oro") ? "#fffbeb"
    : tierId.includes("plata") ? "#f1f5f9"
    : tierId.includes("bronce") ? "#fef3c7"
    : "#eff6ff";

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={{ ...s.iconWrap, backgroundColor: "#fef3c7" }}>
          <Trophy size={18} color="#d97706" />
        </div>
        <div>
          <h3 style={s.title}>Nivel de lealtad</h3>
          <p style={s.subtitle}>Descuentos automáticos por tus compras</p>
        </div>
      </div>

      {nivel_actual ? (
        <>
          <div style={{ ...s.nivelBadge, borderLeftColor: tierColor, backgroundColor: tierBg }}>
            <span style={{ ...s.nivelTag, color: tierColor }}>
              {nivel_actual.nombre}
            </span>
            <p style={s.nivelDesc}>
              Descuento de <strong style={{ color: tierColor }}>{descuento}%</strong> en todos los productos
            </p>
          </div>

          <div style={s.stats}>
            {[
              { label: "Compras este mes", value: `$${Number(total_mes).toLocaleString("es-CO")}`, color: "#15803d" },
              { label: "Tu descuento",     value: `${descuento}%`,                                  color: tierColor },
              { label: "Monto mínimo",     value: `$${Number(nivel_actual.monto_minimo).toLocaleString("es-CO")}`, color: "#0f172a" },
            ].map(st => (
              <div key={st.label} style={s.stat}>
                <p style={s.statLabel}>{st.label}</p>
                <p style={{ ...s.statValor, color: st.color }}>{st.value}</p>
              </div>
            ))}
          </div>

          <div style={s.infoBox}>
            <p style={s.infoText}>
              Nivel <strong>{nivel_actual.nombre}</strong> activo. Cada compra actualiza tus precios automáticamente.
            </p>
          </div>
        </>
      ) : (
        <div style={s.sinNivel}>
          <div style={s.sinNivelIconWrap}>
            <Award size={28} color="#94a3b8" />
          </div>
          <p style={s.sinNivelTitle}>Sin nivel de lealtad aún</p>
          <p style={s.sinNivelDesc}>
            Compra este mes para comenzar a obtener descuentos automáticos
          </p>
          <div style={s.totalMes}>
            <p style={s.totalMesLabel}>Tus compras este mes</p>
            <p style={s.totalMesValor}>${Number(total_mes || 0).toLocaleString("es-CO")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconWrap: {
    width: "38px", height: "38px",
    borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" },
  subtitle: { fontSize: "13px", color: "#64748b", margin: 0 },
  nivelBadge: {
    borderLeft: "4px solid",
    borderRadius: "0 10px 10px 0",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nivelTag: {
    display: "inline-block",
    fontSize: "12px", fontWeight: "800",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: "2px",
  },
  nivelDesc: { fontSize: "13px", color: "#475569", margin: 0, lineHeight: "1.5" },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
    gap: "10px",
  },
  stat: {
    padding: "14px 10px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "10px", fontWeight: "600", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: "6px",
  },
  statValor: {
    fontSize: "18px", fontWeight: "800",
    fontVariantNumeric: "tabular-nums",
    margin: 0,
  },
  infoBox: {
    padding: "12px 14px",
    backgroundColor: "#f0fdf4",
    borderRadius: "10px",
    border: "1px solid #bbf7d0",
  },
  infoText: { fontSize: "13px", color: "#15803d", lineHeight: "1.6", margin: 0 },
  sinNivel: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px",
    padding: "20px 0", textAlign: "center",
  },
  sinNivelIconWrap: {
    width: "60px", height: "60px",
    borderRadius: "16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  sinNivelTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 },
  sinNivelDesc: { fontSize: "13px", color: "#64748b", lineHeight: "1.6", margin: 0, maxWidth: "220px" },
  totalMes: {
    marginTop: "6px",
    padding: "14px 28px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  totalMesLabel: { fontSize: "12px", color: "#94a3b8", marginBottom: "4px" },
  totalMesValor: { fontSize: "24px", fontWeight: "800", color: "#0f172a", fontVariantNumeric: "tabular-nums" },
};
