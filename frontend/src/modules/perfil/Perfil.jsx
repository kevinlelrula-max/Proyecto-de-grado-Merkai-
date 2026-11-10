import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Shield, CheckCircle, AlertTriangle, Camera, ArrowLeft } from "lucide-react";
import usePerfil from "./hooks/usePerfil";
import { cambiarContrasena } from "./services/perfil.api";

export default function Perfil() {
  const navigate = useNavigate();
  const { perfil, guardarPerfil } = usePerfil();
  const fileInputRef = useRef(null);

  const [pestana, setPestana]         = useState("perfil");
  const [form, setForm]               = useState({});
  const [photoUrl, setPhotoUrl]       = useState(null);
  const [hoverAvatar, setHoverAvatar] = useState(false);
  const [passwords, setPasswords]     = useState({ actual: "", nueva: "" });
  const [showActual, setShowActual]   = useState(false);
  const [showNueva, setShowNueva]     = useState(false);
  const [savedMsg, setSavedMsg]       = useState("");
  const [passError, setPassError]     = useState("");

  useEffect(() => { setForm(perfil); }, [perfil]);

  const handleSubmit = (e) => {
    e.preventDefault();
    guardarPerfil(form);
    setSavedMsg("perfil");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const handlePassword = async () => {
    setPassError("");
    if (!passwords.actual || !passwords.nueva) { setPassError("Completa ambos campos."); return; }
    if (passwords.nueva.length < 6) { setPassError("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    const token = localStorage.getItem("token");
    try {
      await cambiarContrasena(passwords.actual, passwords.nueva, token);
      setPasswords({ actual: "", nueva: "" });
      setSavedMsg("password");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      setPassError(err.response?.data?.error || "Error al cambiar contraseña.");
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
  };

  const iniciales = `${form.nombre?.charAt(0) || ""}${form.apellido?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* Volver */}
        <button style={s.backBtn} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={13} /> Volver al panel
        </button>

        {/* ── TARJETA DE PERFIL ── */}
        <div style={s.profileCard}>
          {/* Avatar */}
          <div
            style={s.avatarWrap}
            onMouseEnter={() => setHoverAvatar(true)}
            onMouseLeave={() => setHoverAvatar(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoUrl
              ? <img src={photoUrl} alt="Foto" style={s.avatarImg} />
              : <div style={s.avatar}>{iniciales}</div>
            }
            {hoverAvatar && (
              <div style={s.avatarOverlay}>
                <Camera size={16} color="white" />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />

          {/* Info */}
          <div style={s.profileInfo}>
            <div>
              <h2 style={s.profileName}>{form.nombre} {form.apellido}</h2>
              <p style={s.profileEmail}>{form.usuario}</p>
            </div>
            <div style={s.profileMeta}>
              {form.rol_nombre && (
                <span style={s.rolBadge}>{form.rol_nombre}</span>
              )}
              {form.empresa_nombre && (
                <span style={s.metaChip}>{form.empresa_nombre}</span>
              )}
              {form.fecha_registro && (
                <span style={s.metaChip}>
                  Desde {new Date(form.fecha_registro).toLocaleDateString("es-CO", { year: "numeric", month: "long" })}
                </span>
              )}
            </div>
          </div>

          {/* Estado */}
          <div style={s.estadoChip}>
            <span style={s.estadoDot} />
            Cuenta activa
          </div>
        </div>

        {/* ── PESTAÑAS ── */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(pestana === "perfil" ? s.tabActive : {}) }}
            onClick={() => setPestana("perfil")}
          >
            <User size={13} /> Información personal
          </button>
          <button
            style={{ ...s.tab, ...(pestana === "seguridad" ? s.tabActive : {}) }}
            onClick={() => setPestana("seguridad")}
          >
            <Lock size={13} /> Seguridad
          </button>
        </div>

        {/* ── PESTAÑA PERFIL ── */}
        {pestana === "perfil" && (
          <div style={s.card}>
            {savedMsg === "perfil" && (
              <div style={s.successBox}>
                <CheckCircle size={14} style={{ flexShrink: 0 }} />
                Perfil actualizado correctamente
              </div>
            )}
            <div style={s.fieldsGrid}>
              {/* Fila 1: Nombre | Apellido | Teléfono */}
              <Field label="Nombre">
                <input style={s.input} value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Juan" />
              </Field>
              <Field label="Apellido">
                <input style={s.input} value={form.apellido || ""} onChange={(e) => setForm({ ...form, apellido: e.target.value })} placeholder="García" />
              </Field>
              <Field label="Teléfono">
                <input style={s.input} value={form.telefono || ""} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+57 300 000 0000" />
              </Field>
              {/* Fila 2: Correo (2 cols) | Número documento */}
              <Field label="Correo electrónico" span={2}>
                <input style={s.input} value={form.usuario || ""} onChange={(e) => setForm({ ...form, usuario: e.target.value })} placeholder="admin@empresa.com" type="email" />
              </Field>
              <Field label="Número de documento">
                <input style={s.input} value={form.numero_documento || ""} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} placeholder="—" />
              </Field>
              {/* Fila 3: Dirección (ancho completo) */}
              <Field label="Dirección" span={3}>
                <input style={s.input} value={form.direccion || ""} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Calle 123 #45-67" />
              </Field>
            </div>
            <div style={s.cardFooter}>
              <button style={s.btnPrimary} onClick={handleSubmit}>Guardar cambios</button>
            </div>
          </div>
        )}

        {/* ── PESTAÑA SEGURIDAD ── */}
        {pestana === "seguridad" && (
          <div style={s.card}>
            {savedMsg === "password" && (
              <div style={s.successBox}>
                <CheckCircle size={14} style={{ flexShrink: 0 }} />
                Contraseña actualizada correctamente
              </div>
            )}
            {passError && (
              <div style={s.errorBox}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {passError}
              </div>
            )}

            <div style={s.secLayout}>
              {/* Formulario contraseña */}
              <div style={s.secLeft}>
                <Field label="Contraseña actual">
                  <div style={s.passWrap}>
                    <input style={{ ...s.input, paddingRight: "40px" }} type={showActual ? "text" : "password"} placeholder="••••••••" value={passwords.actual} onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })} />
                    <button style={s.eyeBtn} onClick={() => setShowActual(!showActual)} type="button">
                      {showActual ? <EyeOff size={15} color="#334155" /> : <Eye size={15} color="#334155" />}
                    </button>
                  </div>
                </Field>
                <Field label="Nueva contraseña">
                  <div style={s.passWrap}>
                    <input style={{ ...s.input, paddingRight: "40px" }} type={showNueva ? "text" : "password"} placeholder="••••••••" value={passwords.nueva} onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })} />
                    <button style={s.eyeBtn} onClick={() => setShowNueva(!showNueva)} type="button">
                      {showNueva ? <EyeOff size={15} color="#334155" /> : <Eye size={15} color="#334155" />}
                    </button>
                  </div>
                </Field>
                {passwords.nueva.length > 0 && (
                  <div style={s.strengthWrap}>
                    <div style={s.strengthBar}>
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} style={{ ...s.strengthSegment, backgroundColor: getStrengthColor(passwords.nueva, n) }} />
                      ))}
                    </div>
                    <span style={{ fontSize: "11px", color: "#334155" }}>{getStrengthLabel(passwords.nueva)}</span>
                  </div>
                )}
                <button style={{ ...s.btnPrimary, marginTop: "4px" }} onClick={handlePassword}>
                  Actualizar contraseña
                </button>
              </div>

              {/* Requisitos + sesión */}
              <div style={s.secRight}>
                <p style={s.tipsTitle}>Una buena contraseña tiene:</p>
                <div style={s.tipsList}>
                  {[
                    { check: passwords.nueva.length >= 8,          text: "Al menos 8 caracteres" },
                    { check: /[A-Z]/.test(passwords.nueva),        text: "Una letra mayúscula" },
                    { check: /[0-9]/.test(passwords.nueva),        text: "Un número" },
                    { check: /[^A-Za-z0-9]/.test(passwords.nueva), text: "Un símbolo especial" },
                  ].map(({ check, text }) => (
                    <div key={text} style={s.tipRow}>
                      <div style={{ ...s.tipDot, backgroundColor: check ? "#15803d" : "#e2e8f0" }} />
                      <span style={{ fontSize: "13px", color: check ? "#15803d" : "#334155", transition: "color 0.2s" }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={s.sessionInfo}>
                  <Shield size={13} color="#334155" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "#334155" }}>Sesión protegida con token seguro</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Field({ label, children, full, span }) {
  return (
    <div style={{ gridColumn: full || span === 3 ? "1 / -1" : span ? `span ${span}` : "span 1" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function getStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function getStrengthColor(pwd, segment) {
  const score = getStrength(pwd);
  if (segment > score) return "#e2e8f0";
  if (score === 1) return "#ef4444";
  if (score === 2) return "#f59e0b";
  if (score === 3) return "#3b82f6";
  return "#15803d";
}

function getStrengthLabel(pwd) {
  return ["", "Débil", "Regular", "Buena", "Fuerte"][getStrength(pwd)] || "";
}

const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "32px 24px",
  },
  wrap: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex", flexDirection: "column", gap: "16px",
  },

  /* Volver */
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "7px 14px", background: "white",
    border: "1px solid #e2e8f0", borderRadius: "9px",
    cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#334155",
    alignSelf: "flex-start", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },

  /* Tarjeta de perfil horizontal */
  profileCard: {
    backgroundColor: "white", borderRadius: "16px",
    border: "1.5px solid #cbd5e1", padding: "24px 28px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", gap: "20px",
  },
  avatarWrap: {
    position: "relative", cursor: "pointer", flexShrink: 0,
    width: "72px", height: "72px",
  },
  avatar: {
    width: "72px", height: "72px", borderRadius: "18px",
    backgroundColor: "#1e293b", color: "white",
    fontSize: "24px", fontWeight: "800",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  avatarImg:  { width: "72px", height: "72px", borderRadius: "18px", objectFit: "cover" },
  avatarOverlay: {
    position: "absolute", inset: 0, borderRadius: "18px",
    backgroundColor: "rgba(15,23,42,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  profileInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  profileName: { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 },
  profileEmail: { fontSize: "13px", color: "#334155", margin: "2px 0 0" },
  profileMeta: { display: "flex", flexWrap: "wrap", gap: "6px" },
  rolBadge: {
    display: "inline-block", padding: "3px 12px", borderRadius: "999px",
    backgroundColor: "#1e293b", color: "white",
    fontSize: "11px", fontWeight: "600",
  },
  metaChip: {
    display: "inline-block", padding: "3px 12px", borderRadius: "999px",
    backgroundColor: "#f1f5f9", color: "#334155",
    fontSize: "11px", fontWeight: "500",
  },
  estadoChip: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "999px",
    backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
    fontSize: "12px", fontWeight: "600", color: "#15803d",
    flexShrink: 0,
  },
  estadoDot: { width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#15803d" },

  /* Pestañas */
  tabs: { display: "flex", borderBottom: "2px solid #cbd5e1" },
  tab: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "10px 20px", fontSize: "13px", fontWeight: "500",
    color: "#334155", background: "none", border: "none",
    borderBottom: "2px solid transparent", cursor: "pointer",
    marginBottom: "-2px", transition: "all 0.15s",
  },
  tabActive: { color: "#2563eb", borderBottomColor: "#2563eb", fontWeight: "600" },

  /* Card de contenido */
  card: {
    backgroundColor: "white", borderRadius: "16px",
    border: "1.5px solid #cbd5e1", padding: "40px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", gap: "28px",
  },
  cardFooter: { display: "flex", justifyContent: "flex-end", paddingTop: "20px", borderTop: "1.5px solid #e2e8f0" },

  /* Campos */
  fieldsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" },
  input: {
    width: "100%", padding: "14px 16px",
    borderRadius: "10px", border: "2px solid #cbd5e1",
    fontSize: "15px", color: "#0f172a", backgroundColor: "#f8fafc",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  },

  /* Seguridad */
  secLayout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" },
  secLeft:   { display: "flex", flexDirection: "column", gap: "16px" },
  secRight:  {
    backgroundColor: "#f8fafc", border: "1px solid #f1f5f9",
    borderRadius: "12px", padding: "20px",
    display: "flex", flexDirection: "column", gap: "14px",
  },
  tipsTitle: { fontSize: "13px", fontWeight: "600", color: "#0f172a", margin: 0 },
  tipsList:  { display: "flex", flexDirection: "column", gap: "9px" },
  tipRow:    { display: "flex", alignItems: "center", gap: "10px" },
  tipDot:    { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, transition: "background-color 0.2s" },
  sessionInfo: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 12px", borderRadius: "9px",
    backgroundColor: "white", border: "1px solid #f1f5f9",
    marginTop: "auto",
  },

  /* Password */
  passWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: "10px", top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    padding: 0, display: "flex", alignItems: "center",
  },
  strengthWrap: { display: "flex", alignItems: "center", gap: "8px" },
  strengthBar:  { display: "flex", gap: "4px", flex: 1 },
  strengthSegment: { flex: 1, height: "4px", borderRadius: "999px", transition: "background-color 0.2s" },

  /* Botón */
  btnPrimary: {
    padding: "11px 28px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "14px", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
  },

  successBox: {
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: "10px", padding: "10px 14px",
    fontSize: "13px", color: "#15803d", fontWeight: "500",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "10px 14px",
    fontSize: "13px", color: "#b91c1c", fontWeight: "500",
  },
};
