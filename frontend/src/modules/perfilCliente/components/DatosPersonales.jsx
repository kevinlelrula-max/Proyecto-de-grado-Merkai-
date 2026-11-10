import { AlertTriangle, CheckCircle, User } from "lucide-react";
import { useEsMovil } from "../../tienda/hooks/useEsMovil";

export default function DatosPersonales({ perfil, form, guardando, exito, error, onChange, onGuardar }) {
  const esMovil = useEsMovil(480);
  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.iconWrap}>
          <User size={18} color="#2563eb" />
        </div>
        <div>
          <h3 style={s.title}>Datos personales</h3>
          <p style={s.subtitle}>Actualiza tu información de contacto</p>
        </div>
      </div>

      {error && (
        <div style={s.errorBox}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}
      {exito && (
        <div style={s.exitoBox}>
          <CheckCircle size={14} style={{ flexShrink: 0 }} />
          Datos actualizados correctamente
        </div>
      )}

      <div style={{ ...s.grid, ...(esMovil ? { gridTemplateColumns: "minmax(0, 1fr)" } : {}) }}>
        <Field label="Nombre">
          <input style={s.input} value={form.nombre} onChange={e => onChange("nombre", e.target.value)} placeholder="Tu nombre" />
        </Field>
        <Field label="Apellido">
          <input style={s.input} value={form.apellido} onChange={e => onChange("apellido", e.target.value)} placeholder="Tu apellido" />
        </Field>
        <Field label="Teléfono">
          <input style={s.input} value={form.telefono} onChange={e => onChange("telefono", e.target.value)} placeholder="+57 300 000 0000" />
        </Field>
        <Field label="Correo electrónico">
          <input style={{ ...s.input, backgroundColor: "#f8fafc", color: "#94a3b8" }} value={perfil?.usuario || ""} disabled />
          <p style={s.hint}>El correo no se puede cambiar</p>
        </Field>
        <Field label="Dirección de entrega" full>
          <input style={s.input} value={form.direccion} onChange={e => onChange("direccion", e.target.value)} placeholder="Calle 123 #45-67, Apto 201" />
        </Field>
      </div>

      <button
        style={{ ...s.btnGuardar, opacity: guardando ? 0.7 : 1 }}
        onClick={onGuardar}
        disabled={guardando}
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "span 1" }}>
      <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
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
    gap: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconWrap: {
    width: "38px", height: "38px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" },
  subtitle: { fontSize: "13px", color: "#64748b", margin: 0 },
  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 14px", backgroundColor: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: "10px",
    fontSize: "13px", color: "#b91c1c",
  },
  exitoBox: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 14px", backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0", borderRadius: "10px",
    fontSize: "13px", fontWeight: "600", color: "#15803d",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  input: {
    width: "100%", padding: "10px 12px",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    fontSize: "14px", color: "#0f172a",
    backgroundColor: "white", outline: "none",
    boxSizing: "border-box",
  },
  hint: { fontSize: "11px", color: "#94a3b8", marginTop: "4px" },
  btnGuardar: {
    alignSelf: "flex-start",
    padding: "10px 24px",
    backgroundColor: "#2563eb",
    color: "white", border: "none",
    borderRadius: "10px", fontSize: "14px",
    fontWeight: "600", cursor: "pointer",
  },
};
