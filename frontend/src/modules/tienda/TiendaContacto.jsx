import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import TiendaLayout from "./components/TiendaLayout";
import { useEsMovil } from "./hooks/useEsMovil";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TiendaContacto() {
  const { empresaSlug } = useParams();
  const location        = useLocation();
  const esMovil         = useEsMovil();

  useEffect(() => {
    if (empresaSlug) localStorage.setItem("ultima_empresa_slug", empresaSlug);
  }, [empresaSlug]);

  const navigate        = useNavigate();
  // Esta página no maneja el carrito: se lee el guardado para que el contador se mantenga
  const carritoGuardado = (() => {
    try { const g = JSON.parse(localStorage.getItem(`fishware_carrito_${empresaSlug}`) || "[]"); return Array.isArray(g) ? g : []; }
    catch { return []; }
  })();
  const empresa         = location.state?.empresa
    || JSON.parse(localStorage.getItem("ultima_empresa") || "null");
  const colorMarca      = empresa?.color_primario   || "#0F6E56";
  const colorSecundario = empresa?.color_secundario || "#0B1628";

  const [form, setForm]         = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [error, setError]       = useState("");

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setError("");
  };

  const handleEnviar = async () => {
    if (!form.nombre.trim() || !form.mensaje.trim()) {
      setError("Por favor completa tu nombre y mensaje.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/contacto/${empresa?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
      setForm({ nombre: "", email: "", telefono: "", mensaje: "" });
    } catch {
      setError("No se pudo enviar el mensaje. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TiendaLayout empresa={empresa} carrito={carritoGuardado} onAbrirCarrito={() => navigate(`/tienda/${empresaSlug}/catalogo`)}>
      <div style={{ ...s.page, ...(esMovil ? { padding: "32px 20px 56px" } : {}) }}>

        {/* Título */}
        <div style={s.header}>
          <h1 style={{ ...s.titulo, color: colorSecundario }}>Contacto</h1>
        </div>

        <div style={{ ...s.grid, ...(esMovil ? { gridTemplateColumns: "1fr", gap: "36px" } : {}) }}>

          {/* ── Columna izquierda: info ── */}
          <div style={s.colInfo}>
            {empresa?.whatsapp && (
              <InfoRow
                icon={<IconWA />}
                valor={empresa.whatsapp}
                href={`https://wa.me/${empresa.whatsapp}`}
              />
            )}
            {empresa?.telefono && (
              <InfoRow
                icon={<IconTel />}
                valor={empresa.telefono}
              />
            )}
            {empresa?.email && (
              <InfoRow
                icon={<IconMail />}
                valor={empresa.email}
                href={`mailto:${empresa.email}`}
              />
            )}
            {empresa?.direccion && (
              <InfoRow
                icon={<IconPin />}
                valor={empresa.direccion}
              />
            )}
            {empresa?.horario && (
              <InfoRow
                icon={<IconClock />}
                valor={empresa.horario}
              />
            )}
            {!empresa?.whatsapp && !empresa?.telefono && !empresa?.email && !empresa?.direccion && (
              <p style={{ fontSize: "14px", color: "#94a3b8" }}>
                Esta empresa no ha configurado su información de contacto.
              </p>
            )}

            {/* Redes sociales */}
            {(empresa?.instagram || empresa?.facebook) && (
              <div style={s.redesWrap}>
                {empresa?.instagram && (
                  <a href={resolverRedUrl(empresa.instagram, "instagram.com")} target="_blank" rel="noreferrer" style={s.redLink}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/></svg>
                  </a>
                )}
                {empresa?.facebook && (
                  <a href={resolverRedUrl(empresa.facebook, "facebook.com")} target="_blank" rel="noreferrer" style={s.redLink}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Columna derecha: formulario ── */}
          <div style={s.colForm}>
            {enviado ? (
              <div style={s.exitoBox}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
                </svg>
                <p style={s.exitoTitle}>¡Mensaje enviado!</p>
                <p style={s.exitoDesc}>Nos pondremos en contacto contigo pronto.</p>
                <button style={{ ...s.btnEnviar, backgroundColor: colorMarca }} onClick={() => setEnviado(false)}>
                  Enviar otro
                </button>
              </div>
            ) : (
              <div style={s.formFields}>
                {error && <div style={s.errorBox}>{error}</div>}

                <Field label="Nombre">
                  <input style={s.input} placeholder="ej.: María Pérez" value={form.nombre} onChange={e => handleChange("nombre", e.target.value)} />
                </Field>

                <Field label="Correo electrónico">
                  <input style={s.input} type="email" placeholder="ej.: tuemail@email.com" value={form.email} onChange={e => handleChange("email", e.target.value)} />
                </Field>

                <Field label="Teléfono">
                  <input style={s.input} placeholder="ej.: 300 000 0000" value={form.telefono} onChange={e => handleChange("telefono", e.target.value)} />
                </Field>

                <Field label="Mensaje">
                  <textarea style={s.textarea} placeholder="ej.: Tu mensaje" value={form.mensaje} onChange={e => handleChange("mensaje", e.target.value)} rows={5} />
                </Field>

                <button
                  style={{ ...s.btnEnviar, backgroundColor: colorSecundario, opacity: enviando ? 0.7 : 1 }}
                  onClick={handleEnviar}
                  disabled={enviando}
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </TiendaLayout>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ icon, valor, href }) {
  const content = (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <span style={{ color: "#64748b", flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ fontSize: "15px", color: "#374151", lineHeight: "1.5" }}>{valor}</span>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{content}</a>;
  return content;
}

function resolverRedUrl(valor, dominio) {
  if (!valor) return "#";
  if (valor.startsWith("http")) return valor;
  const usuario = valor.replace("@", "").trim();
  return `https://${dominio}/${usuario}`;
}

function IconWA()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>; }
function IconTel()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.19 2 2 0 012.11 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l.46-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>; }
function IconMail()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function IconPin()   { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconClock() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }

const s = {
  page:       { maxWidth: "1100px", margin: "0 auto", padding: "64px 28px 96px", flex: 1, width: "100%", boxSizing: "border-box" },
  header:     { marginBottom: "52px" },
  titulo:     { fontSize: "48px", fontWeight: "800", letterSpacing: "-0.03em", margin: 0 },
  grid:       { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "72px", alignItems: "start" },
  colInfo:    { display: "flex", flexDirection: "column", gap: "28px" },
  redesWrap:  { display: "flex", gap: "10px", marginTop: "4px" },
  redLink:    { width: "40px", height: "40px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", textDecoration: "none" },
  colForm:    {},
  formFields: { display: "flex", flexDirection: "column", gap: "24px" },
  errorBox:   { padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "14px", color: "#b91c1c" },
  input:      { width: "100%", padding: "13px 16px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px", color: "#111827", backgroundColor: "white", outline: "none", boxSizing: "border-box" },
  textarea:   { width: "100%", padding: "13px 16px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px", color: "#111827", backgroundColor: "white", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" },
  btnEnviar:  { width: "100%", padding: "15px", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
  exitoBox:   { display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "56px 24px", textAlign: "center" },
  exitoTitle: { fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: 0 },
  exitoDesc:  { fontSize: "15px", color: "#64748b", margin: 0 },
};
