import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { registroEmpresa } from "../services/api";
import { getDepartamentos, getMunicipios } from "../modules/ubicacion/services/ubicacion.api";

function decodeGoogleJwt(credential) {
  try {
    const payload = credential.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function RegistroEmpresa() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ✅ Si viene con ?ref=ABC123 en la URL, prellenar el código
  const refFromUrl = new URLSearchParams(location.search).get("ref") || "";

  const [step, setStep]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [googlePrefilled, setGooglePrefilled] = useState(false);

  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios]       = useState([]);

  const [form, setForm] = useState({
    nombre: "", nit: "", email: "", telefono: "",
    codigo_referido_usado: refFromUrl,          // ✅ prellenado si viene por URL
    admin_nombre: "", admin_apellido: "", admin_usuario: "",
    admin_contrasena: "", admin_telefono: "", admin_direccion: "",
    admin_tipo_documento: "Cédula de ciudadanía",
    admin_numero_documento: "", admin_rol_id: 1, admin_id_municipio: "",
    _departamento: "",
  });

  useEffect(() => {
    getDepartamentos(null).then(setDepartamentos).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form._departamento) { setMunicipios([]); return; }
    getMunicipios(form._departamento, null).then(setMunicipios).catch(console.error);
  }, [form._departamento]);

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;
    if (name === "_departamento") {
      setForm((prev) => ({ ...prev, _departamento: value, admin_id_municipio: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegistro = async () => {
    setLoading(true);
    try {
      const { _departamento, ...payload } = form;
      payload.admin_id_municipio = payload.admin_id_municipio
        ? Number(payload.admin_id_municipio)
        : null;

      const res = await registroEmpresa(payload);

      if (res.token) {
        localStorage.setItem("token",           res.token);
        localStorage.setItem("empresa_id",      res.empresa_id);
        localStorage.setItem("rol_id",          res.rol_id);
        localStorage.setItem("codigo_referido", res.codigo_referido || ""); // ✅ guardar código propio
        navigate("/dashboard");
      } else {
        setError(res.error || "Error al registrar. Verifica los datos.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const camposEmpresaLlenos = form.nombre && form.nit && form.email && form.telefono;

  const handleGooglePrefill = (credentialResponse) => {
    const payload = decodeGoogleJwt(credentialResponse.credential);
    if (!payload) return;
    const randomPass = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    setForm((prev) => ({
      ...prev,
      admin_nombre:    payload.given_name  || prev.admin_nombre,
      admin_apellido:  payload.family_name || prev.admin_apellido,
      admin_usuario:   payload.email       || prev.admin_usuario,
      admin_contrasena: randomPass,
    }));
    setGooglePrefilled(true);
    setError("");
  };

  return (
    <div style={s.page}>

      {/* Panel izquierdo */}
      <div style={s.left}>
        <div style={s.leftContent}>
          <div style={s.logo}>
            <img src="/logo-merkai-icon.png" alt="Merkai" width="28" height="28" style={{ objectFit: "contain" }} />
            <span style={s.logoText}>Merkai</span>
          </div>

          <div>
            <h2 style={s.leftTitle}>Empieza en minutos</h2>
            <p style={s.leftSubtitle}>
              Registra tu empresa y comienza a gestionar productos, ventas y usuarios desde un solo lugar.
            </p>
          </div>

          <div style={s.stepsIndicator}>
            {[
              { n: 1, label: "Datos de la empresa" },
              { n: 2, label: "Administrador" },
            ].map((st) => (
              <div key={st.n} style={s.stepRow}>
                <div style={{
                  ...s.stepCircle,
                  backgroundColor: step >= st.n ? "white" : "rgba(255,255,255,0.15)",
                  color: step >= st.n ? "#1e3a8a" : "rgba(255,255,255,0.5)",
                }}>
                  {step > st.n ? "✓" : st.n}
                </div>
                <span style={{
                  ...s.stepLabel,
                  color: step >= st.n ? "white" : "rgba(255,255,255,0.45)",
                }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          <div style={s.leftFooter}>
            <p style={s.leftFooterText}>¿Ya tienes cuenta?</p>
            <button style={s.leftBtn} onClick={() => navigate("/empresa/login")}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={s.right}>
        <div style={s.formWrap}>

          <div style={s.formHeader}>
            <div style={s.stepTag}>Paso {step} de 2</div>
            <h2 style={s.formTitle}>
              {step === 1 ? "Datos de la empresa" : "Datos del administrador"}
            </h2>
            <p style={s.formSubtitle}>
              {step === 1
                ? "Información básica de tu organización"
                : "Quien gestionará la plataforma"}
            </p>
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          {/* PASO 1 */}
          {step === 1 && (
            <div style={s.fieldsGrid}>
              <Field label="Nombre de la empresa">
                <input style={s.input} name="nombre" placeholder="Ej: Comercializadora XYZ" value={form.nombre} onChange={handleChange}/>
              </Field>
              <Field label="NIT">
                <input style={s.input} name="nit" placeholder="900.123.456-7" value={form.nit} onChange={handleChange}/>
              </Field>
              <Field label="Correo electrónico" full>
                <input style={s.input} name="email" type="email" placeholder="contacto@empresa.com" value={form.email} onChange={handleChange}/>
              </Field>
              <Field label="Teléfono">
                <input style={s.input} name="telefono" placeholder="+57 300 000 0000" value={form.telefono} onChange={handleChange}/>
              </Field>

              <Field label="Código de referido (opcional)" full>
                <div style={s.refWrap}>
                  <input
                    style={{
                      ...s.input,
                      borderColor: form.codigo_referido_usado ? "#0F6E56" : "#e2e8f0",
                      backgroundColor: form.codigo_referido_usado ? "#f0fdf4" : "white",
                    }}
                    name="codigo_referido_usado"
                    placeholder="Ej: REF-ABC123"
                    value={form.codigo_referido_usado}
                    onChange={handleChange}
                  />
                  {form.codigo_referido_usado && (
                    <span style={s.refCheck}>✓ Código aplicado</span>
                  )}
                </div>
                <p style={s.refHint}>
                  Si otra empresa te invitó, ingresa su código para vincularte.
                </p>
              </Field>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div>
              {/* Google prefill */}
              {!googlePrefilled ? (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                    <span style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>Prellenar con Google</span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                    <GoogleLogin
                      onSuccess={handleGooglePrefill}
                      onError={() => setError("No se pudo acceder a Google.")}
                      width="350"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                      text="continue_with"
                      locale="es"
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                    <span style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>o completa manualmente</span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#166534" }}>
                  <span>✓</span>
                  <span>Datos prellenados desde Google — revisa y ajusta si es necesario.</span>
                  <button type="button" onClick={() => setGooglePrefilled(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#166534", textDecoration: "underline" }}>
                    Cambiar
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={s.fieldsGrid}>
              <Field label="Nombre">
                <input style={s.input} name="admin_nombre" placeholder="Juan" value={form.admin_nombre} onChange={handleChange}/>
              </Field>
              <Field label="Apellido">
                <input style={s.input} name="admin_apellido" placeholder="García" value={form.admin_apellido} onChange={handleChange}/>
              </Field>
              <Field label="Usuario (email)" full>
                <input style={s.input} name="admin_usuario" type="email" placeholder="admin@empresa.com" value={form.admin_usuario} onChange={handleChange}/>
              </Field>
              <Field label={googlePrefilled ? "Contraseña (generada automáticamente)" : "Contraseña"} full>
                <input style={s.input} name="admin_contrasena" type="password"
                  placeholder={googlePrefilled ? "Generada — cámbiala después" : "••••••••"}
                  value={form.admin_contrasena} onChange={handleChange}/>
              </Field>
              <Field label="Teléfono">
                <input style={s.input} name="admin_telefono" placeholder="+57 300 000 0000" value={form.admin_telefono} onChange={handleChange}/>
              </Field>
              <Field label="Dirección">
                <input style={s.input} name="admin_direccion" placeholder="Calle 123 #45-67" value={form.admin_direccion} onChange={handleChange}/>
              </Field>
              <Field label="Tipo de documento" full>
                <select style={s.input} name="admin_tipo_documento" value={form.admin_tipo_documento} onChange={handleChange}>
                  <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                  <option value="Tarjeta de identidad">Tarjeta de identidad</option>
                  <option value="Cédula de extranjería">Cédula de extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </Field>
              <Field label="Número de documento">
                <input style={s.input} name="admin_numero_documento" placeholder="1234567890" value={form.admin_numero_documento} onChange={handleChange}/>
              </Field>

              <Field label="Departamento">
                <select style={s.input} name="_departamento" value={form._departamento} onChange={handleChange}>
                  <option value="">-- Selecciona --</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </Field>

              <Field label="Municipio">
                <select
                  style={{ ...s.input, color: form._departamento ? "#0f172a" : "#94a3b8" }}
                  name="admin_id_municipio"
                  value={form.admin_id_municipio}
                  onChange={handleChange}
                  disabled={!form._departamento}
                >
                  <option value="">
                    {form._departamento ? "-- Selecciona --" : "Primero elige departamento"}
                  </option>
                  {municipios.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* Botones */}
          <div style={s.btnRow}>
            {step === 2 && (
              <button style={s.btnBack} onClick={() => setStep(1)}>Atrás</button>
            )}
            {step === 1 ? (
              <button
                style={{ ...s.btnNext, opacity: camposEmpresaLlenos ? 1 : 0.5 }}
                disabled={!camposEmpresaLlenos}
                onClick={() => setStep(2)}
              >
                Continuar
              </button>
            ) : (
              <button
                style={{ ...s.btnNext, opacity: loading ? 0.75 : 1 }}
                disabled={loading}
                onClick={handleRegistro}
              >
                {loading ? "Registrando..." : "Crear empresa"}
              </button>
            )}
          </div>

          <p style={s.loginLink}>
            ¿Ya tienes cuenta?{" "}
            <span style={s.loginLinkSpan} onClick={() => navigate("/empresa/login")}>
              Iniciar sesión
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "span 1" }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "grid", gridTemplateColumns: "38fr 62fr", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#fff" },
  left: {
    background: "linear-gradient(145deg, #0f172a 0%, #0d2b45 55%, #0f1f2e 100%)",
    clipPath: "polygon(0 0, 100% 0, calc(100% - 90px) 100%, 0 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "48px 40px 48px 40px",
  },
  leftContent: { display: "flex", flexDirection: "column", gap: "40px", width: "100%" },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoText: { fontSize: "20px", fontWeight: "700", color: "white" },
  leftTitle: { fontSize: "28px", fontWeight: "800", color: "white", letterSpacing: "-0.02em", marginBottom: "12px" },
  leftSubtitle: { fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7" },
  stepsIndicator: { display: "flex", flexDirection: "column", gap: "16px" },
  stepRow: { display: "flex", alignItems: "center", gap: "12px" },
  stepCircle: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0, transition: "all 0.2s" },
  stepLabel: { fontSize: "14px", fontWeight: "500", transition: "color 0.2s" },
  leftFooter: {},
  leftFooterText: { fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "8px" },
  leftBtn: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.5)", color: "white", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", cursor: "pointer", fontWeight: "600" },
  right: { backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", overflowY: "auto" },
  formWrap: { width: "100%", maxWidth: "520px" },
  formHeader: { marginBottom: "28px" },
  stepTag: { display: "inline-block", fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "3px 10px", borderRadius: "999px", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" },
  formTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "6px" },
  formSubtitle: { fontSize: "14px", color: "#64748b" },
  errorBox: { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c", marginBottom: "16px" },
  fieldsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "7px" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "14px", color: "#0f172a", backgroundColor: "#f8fafc", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, background-color 0.15s" },
  btnRow: { display: "flex", gap: "10px", marginBottom: "0" },
  loginLink: { textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "18px" },
  loginLinkSpan: { color: "#2563eb", fontWeight: "600", cursor: "pointer" },
  btnBack: { padding: "12px 20px", background: "transparent", border: "1.5px solid #0f172a", borderRadius: "10px", fontSize: "14px", color: "#0f172a", cursor: "pointer", fontWeight: "600" },
  btnNext: { flex: 1, padding: "13px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "opacity 0.2s" },
  // ✅ Estilos nuevos para el campo de referido
  refWrap: { position: "relative" },
  refCheck: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", fontWeight: "600", color: "#0F6E56" },
  refHint: { fontSize: "11px", color: "#94a3b8", marginTop: "4px" },
};