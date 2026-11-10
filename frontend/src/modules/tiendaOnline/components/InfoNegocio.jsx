export default function InfoNegocio({ empresa, onChange }) {
  return (
    <div style={s.wrap}>

      <div style={s.section}>
        <h4 style={s.sectionTitle}>Descripción de tu negocio</h4>
        <p style={s.sectionDesc}>
          Cuéntales a tus clientes quiénes son y qué ofrecen. Aparece en tu tienda online.
        </p>
        <textarea
          style={s.textarea}
          placeholder="Ej: Somos una pesquera con más de 10 años de experiencia, ofrecemos pescado fresco directo del río..."
          value={empresa?.descripcion || ""}
          onChange={e => onChange("descripcion", e.target.value)}
          rows={4}
          maxLength={500}
        />
        <p style={s.charCount}>
          {(empresa?.descripcion || "").length}/500 caracteres
        </p>
      </div>

      <div style={s.section}>
        <h4 style={s.sectionTitle}>Horario de atención</h4>
        <p style={s.sectionDesc}>
          Informa a tus clientes cuándo pueden visitarte o hacer pedidos.
        </p>
        <input
          style={s.input}
          placeholder="Ej: Lunes a Sábado 7am - 6pm · Domingos 8am - 2pm"
          value={empresa?.horario || ""}
          onChange={e => onChange("horario", e.target.value)}
        />
      </div>

    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: "28px" },
  section: { display: "flex", flexDirection: "column", gap: "10px" },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  sectionDesc: { fontSize: "12px", color: "#64748b" },
  textarea: {
    width: "100%", padding: "12px",
    border: "1.5px solid #e2e8f0", borderRadius: "10px",
    fontSize: "14px", color: "#0f172a",
    backgroundColor: "white", outline: "none",
    boxSizing: "border-box", resize: "vertical",
    fontFamily: "inherit", lineHeight: "1.6",
  },
  charCount: { fontSize: "11px", color: "#94a3b8", textAlign: "right" },
  input: {
    width: "100%", padding: "10px 12px",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    fontSize: "14px", color: "#0f172a",
    backgroundColor: "white", outline: "none",
    boxSizing: "border-box",
  },
};