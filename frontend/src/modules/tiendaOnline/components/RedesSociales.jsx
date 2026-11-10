export default function RedesSociales({ empresa, onChange }) {
  const redes = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: "📱",
      placeholder: "573001234567 (sin + ni espacios)",
      hint: "Solo el número, ej: 573001234567",
      prefix: "wa.me/",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "📸",
      placeholder: "@tunegocio",
      hint: "Tu usuario de Instagram",
      prefix: "instagram.com/",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: "👍",
      placeholder: "tunegocio",
      hint: "El nombre de tu página de Facebook",
      prefix: "facebook.com/",
    },
  ];

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h4 style={s.title}>Redes sociales</h4>
        <p style={s.subtitle}>
          Aparecerán como botones en tu tienda para que los clientes te contacten fácilmente
        </p>
      </div>

      <div style={s.fields}>
        {redes.map((red) => (
          <div key={red.key} style={s.field}>
            <label style={s.label}>
              <span style={s.labelIcon}>{red.icon}</span>
              {red.label}
            </label>
            <div style={s.inputWrap}>
              <span style={s.prefix}>{red.prefix}</span>
              <input
                style={s.input}
                placeholder={red.placeholder}
                value={empresa?.[red.key] || ""}
                onChange={e => onChange(red.key, e.target.value)}
              />
            </div>
            <p style={s.hint}>{red.hint}</p>
          </div>
        ))}
      </div>

      {/* Preview de botones */}
      {(empresa?.whatsapp || empresa?.instagram || empresa?.facebook) && (
        <div style={s.preview}>
          <p style={s.previewTitle}>Vista previa en tu tienda:</p>
          <div style={s.previewBtns}>
            {empresa?.whatsapp && (
              <div style={{ ...s.previewBtn, backgroundColor: "#25D366" }}>
                📱 WhatsApp
              </div>
            )}
            {empresa?.instagram && (
              <div style={{ ...s.previewBtn, backgroundColor: "#E1306C" }}>
                📸 Instagram
              </div>
            )}
            {empresa?.facebook && (
              <div style={{ ...s.previewBtn, backgroundColor: "#1877F2" }}>
                👍 Facebook
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: "20px" },
  header: {},
  title: { fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" },
  subtitle: { fontSize: "12px", color: "#64748b" },
  fields: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "13px", fontWeight: "600", color: "#374151",
  },
  labelIcon: { fontSize: "16px" },
  inputWrap: {
    display: "flex", alignItems: "center",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    overflow: "hidden", backgroundColor: "white",
  },
  prefix: {
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
    fontSize: "12px", color: "#94a3b8",
    whiteSpace: "nowrap", flexShrink: 0,
  },
  input: {
    flex: 1, padding: "10px 12px",
    border: "none", outline: "none",
    fontSize: "14px", color: "#0f172a",
    backgroundColor: "transparent",
  },
  hint: { fontSize: "11px", color: "#94a3b8" },
  preview: {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  previewTitle: { fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "10px" },
  previewBtns: { display: "flex", gap: "8px", flexWrap: "wrap" },
  previewBtn: {
    padding: "8px 16px",
    color: "white", borderRadius: "8px",
    fontSize: "13px", fontWeight: "600",
  },
};