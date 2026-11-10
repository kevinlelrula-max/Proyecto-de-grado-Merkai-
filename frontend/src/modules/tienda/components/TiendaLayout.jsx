import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useEsMovil } from "../hooks/useEsMovil";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const SLUGS_RESERVADOS = ["mis-pedidos", "perfil", "login", "registro"];

function resolverRedUrl(valor, dominio) {
  if (!valor) return "#";
  if (valor.startsWith("http")) return valor;
  return `https://${dominio}/${valor.replace("@", "").trim()}`;
}

export default function TiendaLayout({ empresa, carrito, onAbrirCarrito, children }) {
  const navigate        = useNavigate();
  const { empresaSlug: slugParam } = useParams();
  const location        = useLocation();
  const esMovil         = useEsMovil();
  const [menuAbierto, setMenuAbierto] = useState(false);
  useEffect(() => { setMenuAbierto(false); }, [location.pathname, esMovil]);

  // Si el slug es una ruta reservada o undefined, usa el último slug guardado
  const empresaSlug =
    !slugParam || SLUGS_RESERVADOS.includes(slugParam)
      ? localStorage.getItem("ultima_empresa_slug") || slugParam
      : slugParam;

  const colorMarca      = empresa?.color_primario    || "#0F6E56";
  const colorSecundario = empresa?.color_secundario  || "#0B1628";
  const empresaNombre   = empresa?.nombre || empresaSlug;
  const logoUrl         = empresa?.logo_url || null;
  const fuente          = empresa?.fuente   || "Inter";

  // Cuando se abre con código de referido: guardar y cerrar sesión activa (el link es para nuevos usuarios)
  useEffect(() => {
    const refCode = new URLSearchParams(location.search).get("ref");
    if (!refCode) return;
    localStorage.setItem("ultima_ref_codigo", refCode);
    if (localStorage.getItem("cliente_token")) {
      localStorage.removeItem("cliente_token");
      localStorage.removeItem("cliente_id");
      localStorage.removeItem("cliente_nombre");
      localStorage.removeItem("cliente_rol");
      localStorage.removeItem("cliente_empresa_id");
      window.location.reload();
    }
  }, [location.search]);

  useEffect(() => {
    if (!logoUrl) return;
    const fullUrl = logoUrl.startsWith("http") ? logoUrl : `${API_BASE}${logoUrl}`;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = fullUrl;
    return () => { link.href = "/favicon.ico"; };
  }, [logoUrl]);

  useEffect(() => {
    if (fuente === "Inter") return;
    const id = "tienda-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fuente.replace(/ /g, "+")}:wght@400;500;600;700;800&display=swap`;
      document.head.appendChild(link);
    }
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, [fuente]);

  const clienteToken  = localStorage.getItem("cliente_token");
  const clienteNombre = localStorage.getItem("cliente_nombre");
  const estaLogueado  = !!clienteToken;

  const rutaActual = location.pathname;
  const esActiva   = (ruta) => rutaActual === ruta;

  const rutas = [
    { label: "Inicio",   path: `/tienda/${empresaSlug}` },
    { label: "Catálogo", path: `/tienda/${empresaSlug}/catalogo` },
    { label: "Contacto", path: `/tienda/${empresaSlug}/contacto` },
  ];

  const handleCerrarSesion = () => {
    localStorage.removeItem("cliente_token");
    localStorage.removeItem("cliente_id");
    localStorage.removeItem("cliente_nombre");
    localStorage.removeItem("cliente_rol");
    localStorage.removeItem("cliente_empresa_id");
    window.location.reload();
  };

  return (
    <div style={{ ...s.wrap, fontFamily: `'${fuente}', 'Segoe UI', sans-serif` }}>

      {/* ── NAVBAR ── */}
      <nav style={{ ...s.nav, backgroundColor: `${colorSecundario}f7` }}>
        <div style={{ ...s.navInner, ...(esMovil ? { padding: "0 16px", height: "60px", gap: "12px" } : {}) }}>

          {/* Marca */}
          <div style={s.navBrand} onClick={() => navigate(`/tienda/${empresaSlug}`)}>
            {logoUrl ? (
              <img
                src={logoUrl.startsWith("http") ? logoUrl : `${API_BASE}${logoUrl}`}
                alt={empresaNombre}
                style={s.navLogo}
              />
            ) : (
              <div style={{ ...s.navBrandDot, backgroundColor: colorMarca }} />
            )}
            <span style={{ ...s.navBrandName, ...(esMovil ? { maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {}) }}>{empresaNombre}</span>
          </div>

          {/* Links */}
          {!esMovil && (<div style={s.navLinks}>
            {rutas.map((ruta) => (
              <button
                key={ruta.path}
                style={{
                  ...s.navLink,
                  color: esActiva(ruta.path) ? "white" : "rgba(255,255,255,0.55)",
                  borderBottom: esActiva(ruta.path)
                    ? `2px solid ${colorMarca}` : "2px solid transparent",
                }}
                onClick={() => navigate(ruta.path, { state: { empresa } })}
              >
                {ruta.label}
              </button>
            ))}
          </div>)}

          {/* Acciones */}
          {!esMovil && (<div style={s.navActions}>
            {estaLogueado ? (
              <>
                <button
                  style={s.navPedidosBtn}
                  onClick={() => navigate(`/tienda/${empresaSlug}/pedidos`, { state: { empresa } })}
                >
                  Mis pedidos
                </button>

                {/* User chip */}
                <button
                  style={s.navUserChip}
                  onClick={() => navigate("/tienda/perfil")}
                  title="Ver perfil"
                >
                  <div style={{ ...s.navUserAvatar, backgroundColor: colorMarca }}>
                    {(clienteNombre || "U")[0].toUpperCase()}
                  </div>
                  <span style={s.navUserNombre}>{(clienteNombre || "").split(" ")[0]}</span>
                </button>
              </>
            ) : (
              <>
                <button style={s.navLoginBtn}
                  onClick={() => navigate("/tienda/login", { state: { from: location.pathname } })}>
                  Iniciar sesión
                </button>
                <button
                  style={{ ...s.navBtnPrimary, backgroundColor: colorMarca }}
                  onClick={() => {
                    const refCode = new URLSearchParams(location.search).get("ref") || localStorage.getItem("ultima_ref_codigo");
                    navigate(`/tienda/registro${refCode ? `?ref=${refCode}` : ""}`, {
                      state: { empresa_id: empresa?.id, empresa_slug: empresaSlug }
                    });
                  }}
                >
                  Crear cuenta
                </button>
              </>
            )}

            {/* Carrito */}
            <button
              style={{ ...s.carritoBtn, backgroundColor: carrito?.length > 0 ? colorMarca : "rgba(255,255,255,0.08)" }}
              onClick={onAbrirCarrito}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {carrito?.length > 0 && (
                <span style={s.carritoBadge}>{carrito.length}</span>
              )}
            </button>

            {/* Cerrar sesión — extremo derecho, solo si está logueado */}
            {estaLogueado && (
              <button style={s.navCerrarSesionBtn} onClick={handleCerrarSesion}>
                Cerrar sesión
              </button>
            )}
          </div>)}

          {/* Celular: carrito + botón de menú */}
          {esMovil && (
            <div style={{ ...s.navActions, gap: "10px" }}>
              <button
                style={{ ...s.carritoBtn, backgroundColor: carrito?.length > 0 ? colorMarca : "rgba(255,255,255,0.08)" }}
                onClick={onAbrirCarrito}
                aria-label="Abrir carrito"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {carrito?.length > 0 && <span style={s.carritoBadge}>{carrito.length}</span>}
              </button>
              <button
                style={{ ...s.carritoBtn, backgroundColor: "rgba(255,255,255,0.08)" }}
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuAbierto}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {menuAbierto
                    ? (<><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>)
                    : (<><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>)}
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Menú desplegable (celular) */}
        {esMovil && menuAbierto && (
          <div style={{ ...s.menuMovil, backgroundColor: colorSecundario }}>
            {rutas.map((ruta) => (
              <button
                key={ruta.path}
                style={{ ...s.menuMovilItem, color: esActiva(ruta.path) ? "white" : "rgba(255,255,255,0.7)", borderLeft: `3px solid ${esActiva(ruta.path) ? colorMarca : "transparent"}` }}
                onClick={() => navigate(ruta.path, { state: { empresa } })}
              >
                {ruta.label}
              </button>
            ))}
            <div style={s.menuMovilSep} />
            {estaLogueado ? (
              <>
                <button style={s.menuMovilItem} onClick={() => navigate(`/tienda/${empresaSlug}/pedidos`, { state: { empresa } })}>Mis pedidos</button>
                <button style={s.menuMovilItem} onClick={() => navigate("/tienda/perfil")}>
                  Mi perfil{clienteNombre ? ` (${clienteNombre.split(" ")[0]})` : ""}
                </button>
                <button style={{ ...s.menuMovilItem, color: "#fca5a5" }} onClick={handleCerrarSesion}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <button style={s.menuMovilItem} onClick={() => navigate("/tienda/login", { state: { from: location.pathname } })}>Iniciar sesión</button>
                <button
                  style={{ ...s.menuMovilItem, color: colorMarca, fontWeight: 700 }}
                  onClick={() => {
                    const refCode = new URLSearchParams(location.search).get("ref") || localStorage.getItem("ultima_ref_codigo");
                    navigate(`/tienda/registro${refCode ? `?ref=${refCode}` : ""}`, { state: { empresa_id: empresa?.id, empresa_slug: empresaSlug } });
                  }}
                >
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── CONTENIDO ── */}
      {children}

      {/* ── FOOTER ── */}
      <footer style={{ ...s.footer, backgroundColor: colorSecundario }}>
        <div style={s.footerInner}>

          {/* Col 1: Marca + contacto */}
          <div style={s.footerCol}>
            <div style={s.footerBrand}>
              {logoUrl ? (
                <img src={logoUrl.startsWith("http") ? logoUrl : `${API_BASE}${logoUrl}`} alt={empresaNombre} style={s.footerLogo} />
              ) : (
                <div style={{ ...s.footerDot, backgroundColor: colorMarca }} />
              )}
              <span style={s.footerNombre}>{empresaNombre}</span>
            </div>
            <div style={s.footerContacto}>
              {empresa?.telefono && <span style={s.footerContactoItem}>{empresa.telefono}</span>}
              {empresa?.email    && <span style={s.footerContactoItem}>{empresa.email}</span>}
              {empresa?.direccion && <span style={s.footerContactoItem}>{empresa.direccion}</span>}
            </div>
          </div>

          {/* Col 2: Navegación */}
          <div style={s.footerCol}>
            <p style={s.footerColTitle}>Navega</p>
            <div style={s.footerLinks}>
              {rutas.map((ruta) => (
                <button key={ruta.path} style={s.footerLink} onClick={() => navigate(ruta.path, { state: { empresa } })}>
                  {ruta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Redes (solo si existen) */}
          {(empresa?.whatsapp || empresa?.instagram || empresa?.facebook) && (
            <div style={s.footerCol}>
              <p style={s.footerColTitle}>Síguenos</p>
              <div style={s.footerRedes}>
                {empresa?.whatsapp && (
                  <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={s.footerRedBtn} title="WhatsApp">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
                {empresa?.instagram && (
                  <a href={resolverRedUrl(empresa.instagram, "instagram.com")} target="_blank" rel="noreferrer" style={s.footerRedBtn} title="Instagram">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
                  </a>
                )}
                {empresa?.facebook && (
                  <a href={resolverRedUrl(empresa.facebook, "facebook.com")} target="_blank" rel="noreferrer" style={s.footerRedBtn} title="Facebook">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Línea inferior */}
        <div style={{ ...s.footerBottom, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={s.footerPowered}>Powered by Merkai</span>
          <span style={s.footerCopy}>© {new Date().getFullYear()} {empresaNombre}</span>
        </div>
      </footer>

    </div>
  );
}

const s = {
  wrap:          { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" },
  nav:           { position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  navInner:      { maxWidth: "1300px", margin: "0 auto", padding: "0 28px", height: "68px", display: "flex", alignItems: "center", gap: "20px" },
  navBrand:      { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, cursor: "pointer" },
  navBrandDot:   { width: "8px", height: "8px", borderRadius: "50%" },
  navLogo:       { height: "34px", width: "auto", objectFit: "contain", borderRadius: "6px" },
  navBrandName:  { fontSize: "15px", fontWeight: "700", color: "white", letterSpacing: "-0.02em" },
  navLinks:      { display: "flex", alignItems: "center", gap: "2px", marginLeft: "28px" },
  navLink:       { padding: "8px 14px", background: "none", border: "none", fontSize: "14px", cursor: "pointer", fontWeight: "500", transition: "all 0.15s" },
  navActions:      { marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  navPedidosBtn:   { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: "13px", cursor: "pointer", fontWeight: "500", padding: "7px 14px", borderRadius: "8px", transition: "all 0.15s" },
  navUserChip:       { display: "flex", alignItems: "center", gap: "7px", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "99px", padding: "5px 12px 5px 5px", cursor: "pointer", background: "rgba(255,255,255,0.08)" },
  navUserAvatar:     { width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "white", flexShrink: 0 },
  navUserNombre:     { fontSize: "13px", color: "white", fontWeight: "500", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  navCerrarSesionBtn:{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.45)", color: "#fca5a5", fontSize: "12px", fontWeight: "600", cursor: "pointer", padding: "7px 14px", borderRadius: "8px", transition: "all 0.15s" },
  navLoginBtn:     { background: "none", border: "none", color: "rgba(255,255,255,0.65)", fontSize: "13px", cursor: "pointer", fontWeight: "500", padding: "7px 12px" },
  navBtnPrimary:   { padding: "7px 16px", border: "none", borderRadius: "8px", color: "white", fontSize: "13px", cursor: "pointer", fontWeight: "600" },
  carritoBtn:      { position: "relative", width: "38px", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "background 0.15s" },
  carritoBadge:  { position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ef4444", color: "white", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  footer:            {},
  footerInner:       { maxWidth: "1300px", margin: "0 auto", padding: "40px 28px 32px", display: "flex", gap: "48px", flexWrap: "wrap" },
  footerCol:         { display: "flex", flexDirection: "column", gap: "14px", minWidth: "140px", flex: 1 },
  footerColTitle:    { fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 },
  footerBrand:       { display: "flex", alignItems: "center", gap: "8px" },
  footerDot:         { width: "7px", height: "7px", borderRadius: "50%" },
  footerLogo:        { height: "28px", width: "auto", objectFit: "contain", borderRadius: "4px" },
  footerNombre:      { fontSize: "14px", fontWeight: "700", color: "white" },
  footerContacto:    { display: "flex", flexDirection: "column", gap: "5px" },
  footerContactoItem:{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.4" },
  footerLinks:       { display: "flex", flexDirection: "column", gap: "2px" },
  footerLink:        { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer", padding: "3px 0", textAlign: "left", transition: "color 0.15s" },
  footerRedes:       { display: "flex", gap: "8px" },
  footerRedBtn:      { width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "all 0.15s" },
  footerBottom:      { maxWidth: "1300px", margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  footerPowered:     { fontSize: "11px", color: "rgba(255,255,255,0.2)" },
  footerCopy:        { fontSize: "11px", color: "rgba(255,255,255,0.2)" },
  content:       { flex: 1, width: "100%" },
  menuMovil:     { display: "flex", flexDirection: "column", padding: "8px 0 12px", borderTop: "1px solid rgba(255,255,255,0.08)" },
  menuMovilItem: { background: "none", border: "none", borderLeft: "3px solid transparent", textAlign: "left", padding: "13px 24px", fontSize: "15px", fontWeight: "500", color: "rgba(255,255,255,0.85)", cursor: "pointer" },
  menuMovilSep:  { height: "1px", margin: "6px 24px", backgroundColor: "rgba(255,255,255,0.1)" },
};