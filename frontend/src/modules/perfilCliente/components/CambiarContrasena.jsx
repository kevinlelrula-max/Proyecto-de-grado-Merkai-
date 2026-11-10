import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";

export default function CambiarContrasena({ formPass, guardando, exito, error, onChange, onGuardar }) {
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva]   = useState(false);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.iconWrap}>
          <Lock size={17} color="#2563eb" />
        </div>
        <div>
          <h3 style={s.title}>Cambiar contraseña</h3>
          <p style={s.subtitle}>Mínimo 6 caracteres</p>
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
          Contraseña actualizada correctamente
        </div>
      )}

      <div style={s.fields}>
        <Field label="Contraseña actual">
          <div style={s.inputWrap}>
            <input
              style={s.input}
              type={showActual ? "text" : "password"}
              placeholder="••••••••"
              value={formPass.contrasena_actual}
              onChange={e => onChange("contrasena_actual", e.target.value)}
            />
            <button style={s.eyeBtn} type="button" onClick={() => setShowActual(!showActual)}>
              {showActual ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
            </button>
          </div>
        </Field>

        <Field label="Nueva contraseña">
          <div style={s.inputWrap}>
            <input
              style={s.input}
              type={showNueva ? "text" : "password"}
              placeholder="••••••••"
              value={formPass.contrasena_nueva}
              onChange={e => onChange("contrasena_nueva", e.target.value)}
            />
            <button style={s.eyeBtn} type="button" onClick={() => setShowNueva(!showNueva)}>
              {showNueva ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar nueva contraseña">
          <input
            style={{
              ...s.input,
              borderColor: formPass.confirmar && formPass.confirmar !== formPass.contrasena_nueva
                ? "#fecaca" : "#e2e8f0",
            }}
            type="password"
            placeholder="••••••••"
            value={formPass.confirmar}
            onChange={e => onChange("confirmar", e.target.value)}
          />
          {formPass.confirmar && formPass.confirmar !== formPass.contrasena_nueva && (
            <p style={s.errorHint}>Las contraseñas no coinciden</p>
          )}
        </Field>
      </div>

      <button
        style={{ ...s.btnGuardar, opacity: guardando ? 0.7 : 1 }}
        onClick={onGuardar}
        disabled={guardando}
      >
        {guardando ? "Actualizando..." : "Cambiar contraseña"}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
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
  fields: { display: "flex", flexDirection: "column", gap: "14px" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  input: {
    width: "100%", padding: "10px 40px 10px 12px",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    fontSize: "14px", color: "#0f172a",
    backgroundColor: "white", outline: "none",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute", right: "12px",
    background: "none", border: "none",
    cursor: "pointer",
    display: "flex", alignItems: "center",
    padding: "2px",
  },
  errorHint: { fontSize: "11px", color: "#ef4444", marginTop: "4px" },
  btnGuardar: {
    alignSelf: "flex-start",
    padding: "10px 24px",
    backgroundColor: "#2563eb",
    color: "white", border: "none",
    borderRadius: "10px", fontSize: "14px",
    fontWeight: "600", cursor: "pointer",
  },
};
