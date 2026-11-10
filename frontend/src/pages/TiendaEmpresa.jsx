import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTiendaEmpresa } from "../modules/tienda/hooks/useTiendaEmpresa";
import CatalogoGrid from "../modules/tienda/components/CatalogoGrid";
import Carrito from "../modules/tienda/components/Carrito";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function calcularPrecioInteligente(producto, descuentoLealtad) {
  const precios = [parseFloat(producto.precio)];
  if (producto.precio_mayoreo && parseFloat(producto.precio_mayoreo) > 0) {
    precios.push(parseFloat(producto.precio_mayoreo));
  }
  if (descuentoLealtad > 0) {
    precios.push(parseFloat(producto.precio) * (1 - descuentoLealtad / 100));
  }
  return Math.min(...precios);
}

const DEFAULT_LAYOUT = [
  { id: "hero",     tipo: "hero",     visible: true, config: {} },
  { id: "catalogo", tipo: "catalogo", visible: true, config: {} },
  { id: "nosotros", tipo: "nosotros", visible: true, config: {} },
  { id: "contacto", tipo: "contacto", visible: true, config: {} },
];

export default function TiendaEmpresa() {
  const navigate        = useNavigate();
  const { empresaSlug } = useParams();
  const location        = useLocation();

  const empresaInicial = location.state?.empresa
    || JSON.parse(localStorage.getItem("ultima_empresa") || "null");
  const empresaId      = empresaInicial?.id;

  const [empresaFull, setEmpresaFull] = useState(empresaInicial);

  useEffect(() => {
    if (!empresaSlug) return;
    fetch(`${API_BASE}/api/empresas/slug/${empresaSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setEmpresaFull(data); })
      .catch(() => {});
  }, [empresaSlug]);

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

  const empresa       = empresaFull || empresaInicial;
  const empresaNombre = empresa?.nombre || empresaSlug;
  const colorMarca    = empresa?.color_primario || "#0F6E56";
  const activeLayout  = empresa?.layout || DEFAULT_LAYOUT;

  // ── Refs para scroll
  const seccionInicio   = useRef(null);
  const seccionCatalogo = useRef(null);
  const seccionContacto = useRef(null);
  const [seccionActiva, setSeccionActiva] = useState("inicio");

  const scrollTo = (ref, nombre) => {
    setSeccionActiva(nombre);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY + 80;
      if (seccionContacto.current && scrollY >= seccionContacto.current.offsetTop) {
        setSeccionActiva("contacto");
      } else if (seccionCatalogo.current && scrollY >= seccionCatalogo.current.offsetTop) {
        setSeccionActiva("catalogo");
      } else {
        setSeccionActiva("inicio");
      }
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ── Nivel de lealtad
  const [nivelLealtad, setNivelLealtad] = useState(null);
  const [descuento, setDescuento]       = useState(0);

  const clienteId    = localStorage.getItem("cliente_id");
  const clienteToken = localStorage.getItem("cliente_token");
  const estaLogueado = !!clienteToken;

  useEffect(() => {
    if (!estaLogueado || !clienteId || !empresaId) return;
    fetch(`${API_BASE}/api/productos/lealtad/cliente/${clienteId}/empresa/${empresaId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) { setNivelLealtad(data.nivel_actual); setDescuento(data.descuento || 0); } })
      .catch(() => {});
  }, [estaLogueado, clienteId, empresaId]);

  const {
    productos, loadingProds, busqueda, setBusqueda,
    carrito, carritoAbierto, setCarritoAbierto,
    agregarAlCarrito, cambiarCantidad, quitarDelCarrito,
    vaciarCarrito, totalItems, totalPrecio,
    metodosPago, metodoPagoId, setMetodoPagoId,
    direccion, setDireccion, notas, setNotas,
    loadingPedido, errorPedido, setErrorPedido,
    pedidoExitoso, confirmarPedido, cerrarExito,
    clienteNombre,
  } = useTiendaEmpresa(empresaId, empresaSlug);

  const productosConPrecio = productos.map((p) => ({
    ...p,
    precio_final:    calcularPrecioInteligente(p, descuento),
    precio_original: parseFloat(p.precio),
    tiene_descuento: calcularPrecioInteligente(p, descuento) < parseFloat(p.precio),
  }));

  const handleCerrarSesion = () => {
    localStorage.removeItem("cliente_token");
    localStorage.removeItem("cliente_id");
    localStorage.removeItem("cliente_nombre");
    localStorage.removeItem("cliente_rol");
    localStorage.removeItem("cliente_empresa_id");
    window.location.reload();
  };

  // ✅ Handler cuando el pago con pasarela es exitoso
  const handlePagoExitoso = () => {
    vaciarCarrito();
    setCarritoAbierto(false);
    navigate("/tienda/mis-pedidos");
  };

  return (
    <div style={s.page}>

      {/* ── NAVBAR ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navBrand} onClick={() => scrollTo(seccionInicio, "inicio")}>
            <div style={{ ...s.navBrandDot, backgroundColor: colorMarca }} />
            <span style={s.navBrandName}>{empresaNombre}</span>
          </div>
          <div style={s.navLinks}>
            {[
              { key: "inicio",   label: "Inicio",   ref: seccionInicio },
              { key: "catalogo", label: "Catálogo",  ref: seccionCatalogo },
              { key: "contacto", label: "Contacto",  ref: seccionContacto },
            ].map((item) => (
              <button
                key={item.key}
                style={{
                  ...s.navLink,
                  color: seccionActiva === item.key ? "white" : "rgba(255,255,255,0.55)",
                  borderBottom: seccionActiva === item.key
                    ? `2px solid ${colorMarca}` : "2px solid transparent",
                }}
                onClick={() => scrollTo(item.ref, item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={s.navActions}>
            {estaLogueado ? (
              <>
                {nivelLealtad && (
                  <div style={s.nivelBadge}>🏆 {nivelLealtad.nombre}</div>
                )}
                <button style={s.navBtnGhost} onClick={() => navigate("/tienda/mis-pedidos")}>
                  📦 Pedidos
                </button>
                <button style={s.navBtnGhost} onClick={() => navigate("/tienda/perfil")}>
                  👤 {clienteNombre}
                </button>
                <button style={s.navBtnSalir} onClick={handleCerrarSesion}>Salir</button>
              </>
            ) : (
              <>
                <button style={s.navBtnGhost}
                  onClick={() => navigate("/tienda/login", { state: { from: location.pathname } })}>
                  Iniciar sesión
                </button>
                <button style={{ ...s.navBtnPrimary, backgroundColor: colorMarca }}
                  onClick={() => {
                    const refCode = new URLSearchParams(location.search).get("ref") || localStorage.getItem("ultima_ref_codigo");
                    navigate(`/tienda/registro${refCode ? `?ref=${refCode}` : ""}`, {
                      state: { empresa_id: empresa?.id, empresa_slug: empresaSlug }
                    });
                  }}>
                  Registrarse
                </button>
              </>
            )}
            <button
              style={{ ...s.carritoBtn, backgroundColor: carrito.length > 0 ? colorMarca : "rgba(255,255,255,0.1)" }}
              onClick={() => setCarritoAbierto(true)}
            >
              🛒
              {carrito.length > 0 && <span style={s.carritoBadge}>{carrito.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Banner lealtad ── */}
      {estaLogueado && nivelLealtad && (
        <div style={{ ...s.lealtadBanner, backgroundColor: `${colorMarca}15`, borderBottom: `1px solid ${colorMarca}30` }}>
          <span>🏆</span>
          <p style={s.lealtadText}>
            Nivel <strong>{nivelLealtad.nombre}</strong> — precios con <strong>{nivelLealtad.descuento_porcentaje}% de descuento</strong>
          </p>
        </div>
      )}

      {/* ── SECCIONES DINÁMICAS ── */}
      {activeLayout.filter(sec => sec.visible).map(sec => {
        if (sec.tipo === "hero") return (
          <section key={sec.id} ref={seccionInicio} style={s.sectionInicio}>
            <div style={{
              ...s.hero,
              background: empresa?.banner_url
                ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(${API_BASE}${empresa.banner_url}) center/cover no-repeat`
                : `linear-gradient(145deg, #0f172a 0%, #0d2b45 60%, #0f1f2e 100%)`,
            }}>
              <div style={s.heroContent}>
                <div style={{ ...s.heroAvatar, backgroundColor: colorMarca }}>
                  {empresaNombre?.slice(0, 2).toUpperCase()}
                </div>
                <h1 style={s.heroTitle}>{empresa?.hero_titulo || empresaNombre}</h1>
                {(empresa?.hero_subtitulo || empresa?.descripcion) && (
                  <p style={s.heroDesc}>{empresa.hero_subtitulo || empresa.descripcion}</p>
                )}
                {empresa?.horario && (
                  <p style={s.heroHorario}>🕐 {empresa.horario}</p>
                )}
                <div style={s.heroBtns}>
                  <button
                    style={{ ...s.heroBtnPrimary, backgroundColor: colorMarca }}
                    onClick={() => scrollTo(seccionCatalogo, "catalogo")}
                  >
                    {empresa?.hero_btn_texto || "Ver catálogo →"}
                  </button>
                  <button style={s.heroBtnSecondary} onClick={() => scrollTo(seccionContacto, "contacto")}>
                    Contacto
                  </button>
                </div>
              </div>
              <div style={s.heroGlow} />
            </div>
            <div style={s.statsBar}>
              <div style={s.statItem}>
                <span style={{ ...s.statNum, color: colorMarca }}>{productos.length}</span>
                <span style={s.statLabel}>Productos</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.statItem}>
                <span style={{ ...s.statNum, color: colorMarca }}>✓</span>
                <span style={s.statLabel}>Entrega a domicilio</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.statItem}>
                <span style={{ ...s.statNum, color: colorMarca }}>🔒</span>
                <span style={s.statLabel}>Compra segura</span>
              </div>
              {empresa?.whatsapp && (
                <>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <span style={{ ...s.statNum, color: "#25D366" }}>📱</span>
                    <span style={s.statLabel}>Atención por WhatsApp</span>
                  </div>
                </>
              )}
            </div>
          </section>
        );

        if (sec.tipo === "catalogo") return (
          <section key={sec.id} ref={seccionCatalogo} style={s.sectionCatalogo}>
            <div style={s.sectionInner}>
              <div style={s.sectionHeader}>
                <div>
                  <h2 style={s.sectionTitle}>Catálogo</h2>
                  <p style={s.sectionSubtitle}>
                    {loadingProds ? "Cargando..." : `${productosConPrecio.length} productos disponibles`}
                  </p>
                </div>
                <div style={s.buscador}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/>
                  </svg>
                  <input
                    style={s.buscadorInput}
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button style={s.clearBtn} onClick={() => setBusqueda("")}>✕</button>
                  )}
                </div>
              </div>
              <CatalogoGrid
                productos={productosConPrecio}
                loading={loadingProds}
                busqueda={busqueda}
                onAgregar={agregarAlCarrito}
              />
            </div>
          </section>
        );

        if (sec.tipo === "nosotros") return (
          (empresa?.nosotros_titulo || empresa?.nosotros_contenido) ? (
            <section key={sec.id} style={s.sectionNosotros}>
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
                {empresa.nosotros_titulo && (
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 16 }}>
                    {empresa.nosotros_titulo}
                  </h2>
                )}
                {empresa.nosotros_contenido && (
                  <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.8 }}>
                    {empresa.nosotros_contenido}
                  </p>
                )}
              </div>
            </section>
          ) : null
        );

        if (sec.tipo === "texto_libre") {
          const cfg = sec.config || {};
          return (
            <section key={sec.id} style={{ backgroundColor: cfg.color_fondo || "#ffffff", padding: "60px 24px", borderTop: "1px solid #e2e8f0" }}>
              <div style={{ maxWidth: 700, margin: "0 auto", textAlign: cfg.alineacion || "center" }}>
                {cfg.titulo && (
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: cfg.color_texto || "#0f172a", letterSpacing: "-0.02em", marginBottom: 16 }}>
                    {cfg.titulo}
                  </h2>
                )}
                {cfg.contenido && (
                  <p style={{ fontSize: 16, color: cfg.color_texto || "#64748b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {cfg.contenido}
                  </p>
                )}
              </div>
            </section>
          );
        }

        if (sec.tipo === "contacto") return (
          <section key={sec.id} ref={seccionContacto} style={s.sectionContacto}>
            <div style={s.sectionInner}>
              <div style={s.sectionHeader}>
                <div>
                  <h2 style={s.sectionTitle}>Contacto</h2>
                  <p style={s.sectionSubtitle}>Estamos aquí para ayudarte</p>
                </div>
              </div>
              <div style={s.contactoGrid}>
                <div style={s.contactoCard}>
                  <h3 style={s.contactoCardTitle}>📍 Información</h3>
                  <div style={s.contactoItems}>
                    {empresa?.telefono && (
                      <div style={s.contactoItem}>
                        <span style={s.contactoItemIcon}>📞</span>
                        <div>
                          <p style={s.contactoItemLabel}>Teléfono</p>
                          <p style={s.contactoItemValor}>{empresa.telefono}</p>
                        </div>
                      </div>
                    )}
                    {empresa?.email && (
                      <div style={s.contactoItem}>
                        <span style={s.contactoItemIcon}>✉️</span>
                        <div>
                          <p style={s.contactoItemLabel}>Email</p>
                          <p style={s.contactoItemValor}>{empresa.email}</p>
                        </div>
                      </div>
                    )}
                    {empresa?.direccion && (
                      <div style={s.contactoItem}>
                        <span style={s.contactoItemIcon}>📍</span>
                        <div>
                          <p style={s.contactoItemLabel}>Dirección</p>
                          <p style={s.contactoItemValor}>{empresa.direccion}</p>
                        </div>
                      </div>
                    )}
                    {empresa?.horario && (
                      <div style={s.contactoItem}>
                        <span style={s.contactoItemIcon}>🕐</span>
                        <div>
                          <p style={s.contactoItemLabel}>Horario</p>
                          <p style={s.contactoItemValor}>{empresa.horario}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={s.contactoCard}>
                  <h3 style={s.contactoCardTitle}>📱 Redes sociales</h3>
                  <div style={s.redesGrid}>
                    {empresa?.whatsapp && (
                      <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer"
                        style={{ ...s.redCard, borderColor: "#25D366" }}>
                        <span style={s.redCardIcon}>📱</span>
                        <div>
                          <p style={s.redCardNombre}>WhatsApp</p>
                          <p style={s.redCardDesc}>Escríbenos directo</p>
                        </div>
                        <span style={{ ...s.redCardBtn, backgroundColor: "#25D366" }}>→</span>
                      </a>
                    )}
                    {empresa?.instagram && (
                      <a href={`https://instagram.com/${empresa.instagram.replace("@", "")}`} target="_blank" rel="noreferrer"
                        style={{ ...s.redCard, borderColor: "#E1306C" }}>
                        <span style={s.redCardIcon}>📸</span>
                        <div>
                          <p style={s.redCardNombre}>Instagram</p>
                          <p style={s.redCardDesc}>@{empresa.instagram.replace("@", "")}</p>
                        </div>
                        <span style={{ ...s.redCardBtn, backgroundColor: "#E1306C" }}>→</span>
                      </a>
                    )}
                    {empresa?.facebook && (
                      <a href={`https://facebook.com/${empresa.facebook}`} target="_blank" rel="noreferrer"
                        style={{ ...s.redCard, borderColor: "#1877F2" }}>
                        <span style={s.redCardIcon}>👍</span>
                        <div>
                          <p style={s.redCardNombre}>Facebook</p>
                          <p style={s.redCardDesc}>{empresa.facebook}</p>
                        </div>
                        <span style={{ ...s.redCardBtn, backgroundColor: "#1877F2" }}>→</span>
                      </a>
                    )}
                    {!empresa?.whatsapp && !empresa?.instagram && !empresa?.facebook && (
                      <p style={s.sinRedes}>Esta empresa aún no ha configurado sus redes sociales.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

        return null;
      })}

      {/* ── FOOTER ── */}
      <footer style={{ ...s.footer, borderTop: `3px solid ${colorMarca}` }}>
        <div style={s.footerInner}>
          <div style={s.footerBrand}>
            <div style={{ ...s.footerDot, backgroundColor: colorMarca }} />
            <span style={s.footerNombre}>{empresaNombre}</span>
          </div>
          <span style={s.footerText}>Powered by Merkai</span>
        </div>
      </footer>

      {/* ── CARRITO ── ✅ Nuevos props: empresaId, empresaNombre, onPagoExitoso */}
      <Carrito
        carrito={carrito}
        carritoAbierto={carritoAbierto}
        setCarritoAbierto={setCarritoAbierto}
        cambiarCantidad={cambiarCantidad}
        quitarDelCarrito={quitarDelCarrito}
        vaciarCarrito={vaciarCarrito}
        totalItems={totalItems}
        totalPrecio={totalPrecio}
        metodosPago={metodosPago}
        metodoPagoId={metodoPagoId}
        setMetodoPagoId={setMetodoPagoId}
        direccion={direccion}
        setDireccion={setDireccion}
        notas={notas}
        setNotas={setNotas}
        loadingPedido={loadingPedido}
        errorPedido={errorPedido}
        setErrorPedido={setErrorPedido}
        confirmarPedido={confirmarPedido}
        estaLogueado={estaLogueado}
        empresaId={empresaId}
        empresaNombre={empresaNombre}
        onPagoExitoso={handlePagoExitoso}
      />

      {/* ── MODAL PEDIDO EXITOSO (flujo sin pasarela) ── */}
      {pedidoExitoso && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>🎉</div>
            <h2 style={s.modalTitle}>¡Pedido enviado!</h2>
            <p style={s.modalDesc}>
              Tu pedido <strong>#{pedidoExitoso.id}</strong> fue recibido por {empresaNombre}.
              Te contactarán pronto para coordinar la entrega.
            </p>
            <p style={s.modalTotal}>
              Total: <strong>${pedidoExitoso.total.toLocaleString("es-CO")}</strong>
            </p>
            <button style={{ ...s.modalBtn, backgroundColor: colorMarca }} onClick={cerrarExito}>
              Ver mis pedidos
            </button>
            <button style={s.modalBtnSecondary} onClick={() => { cerrarExito(); navigate(`/tienda/${empresaSlug}`); }}>
              Seguir comprando
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" },
  nav: { position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(15,23,42,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  navInner: { maxWidth: "1300px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", gap: "16px" },
  navBrand: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, cursor: "pointer" },
  navBrandDot: { width: "8px", height: "8px", borderRadius: "50%" },
  navBrandName: { fontSize: "15px", fontWeight: "700", color: "white", letterSpacing: "-0.02em" },
  navLinks: { display: "flex", alignItems: "center", gap: "4px", marginLeft: "24px" },
  navLink: { padding: "8px 16px", background: "none", border: "none", fontSize: "14px", cursor: "pointer", fontWeight: "500", transition: "all 0.15s", borderRadius: "0" },
  navActions: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  nivelBadge: { padding: "4px 10px", backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "999px", fontSize: "11px", fontWeight: "600", color: "#fbbf24" },
  navBtnGhost: { padding: "6px 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", color: "rgba(255,255,255,0.8)", fontSize: "12px", cursor: "pointer", fontWeight: "500" },
  navBtnPrimary: { padding: "6px 14px", border: "none", borderRadius: "8px", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: "600" },
  navBtnSalir: { background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer" },
  carritoBtn: { position: "relative", width: "38px", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  carritoBadge: { position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#ef4444", color: "white", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  lealtadBanner: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 24px" },
  lealtadText: { fontSize: "13px", color: "#92400e" },
  sectionInicio: {},
  hero: { minHeight: "480px", padding: "60px 24px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" },
  heroContent: { maxWidth: "600px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  heroAvatar: { width: "72px", height: "72px", borderRadius: "20px", color: "white", fontSize: "24px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: "42px", fontWeight: "800", color: "white", letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0 },
  heroDesc: { fontSize: "16px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6", maxWidth: "480px" },
  heroHorario: { fontSize: "13px", color: "rgba(255,255,255,0.55)" },
  heroBtns: { display: "flex", gap: "12px", marginTop: "8px" },
  heroBtnPrimary: { padding: "13px 28px", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer" },
  heroBtnSecondary: { padding: "13px 28px", backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  heroGlow: { position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(15,110,86,0.15) 0%, transparent 70%)", pointerEvents: "none" },
  statsBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", padding: "20px 24px", backgroundColor: "white", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" },
  statItem: { display: "flex", alignItems: "center", gap: "8px" },
  statNum: { fontSize: "20px", fontWeight: "800" },
  statLabel: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  statDivider: { width: "1px", height: "24px", backgroundColor: "#e2e8f0" },
  sectionCatalogo: { backgroundColor: "#f8fafc", paddingBottom: "60px" },
  sectionNosotros: { backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" },
  sectionContacto: { backgroundColor: "white", paddingBottom: "60px" },
  sectionInner: { maxWidth: "1300px", margin: "0 auto", padding: "48px 24px 0" },
  sectionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "28px", flexWrap: "wrap" },
  sectionTitle: { fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "4px" },
  sectionSubtitle: { fontSize: "14px", color: "#64748b" },
  buscador: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "white", border: "1.5px solid #e2e8f0", borderRadius: "12px", minWidth: "240px" },
  buscadorInput: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "14px", color: "#0f172a" },
  clearBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" },
  contactoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  contactoCard: { backgroundColor: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px" },
  contactoCardTitle: { fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" },
  contactoItems: { display: "flex", flexDirection: "column", gap: "14px" },
  contactoItem: { display: "flex", alignItems: "flex-start", gap: "12px" },
  contactoItemIcon: { fontSize: "20px", flexShrink: 0, marginTop: "2px" },
  contactoItemLabel: { fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" },
  contactoItemValor: { fontSize: "14px", color: "#0f172a", marginTop: "2px" },
  redesGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  redCard: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", backgroundColor: "white", borderRadius: "12px", border: "1.5px solid", textDecoration: "none", transition: "transform 0.15s" },
  redCardIcon: { fontSize: "24px", flexShrink: 0 },
  redCardNombre: { fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  redCardDesc: { fontSize: "12px", color: "#64748b" },
  redCardBtn: { marginLeft: "auto", width: "28px", height: "28px", borderRadius: "8px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", flexShrink: 0 },
  sinRedes: { fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px 0" },
  footer: { backgroundColor: "#0B1628", padding: "20px 24px" },
  footerInner: { maxWidth: "1300px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  footerBrand: { display: "flex", alignItems: "center", gap: "8px" },
  footerDot: { width: "8px", height: "8px", borderRadius: "50%" },
  footerNombre: { fontSize: "14px", fontWeight: "600", color: "white" },
  footerText: { fontSize: "12px", color: "rgba(255,255,255,0.4)" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
  modal: { backgroundColor: "white", borderRadius: "20px", padding: "40px 36px", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" },
  modalIcon: { fontSize: "52px", marginBottom: "16px" },
  modalTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" },
  modalDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "12px" },
  modalTotal: { fontSize: "18px", color: "#0F6E56", marginBottom: "24px" },
  modalBtn: { width: "100%", padding: "13px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" },
  modalBtnSecondary: { width: "100%", padding: "11px", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", cursor: "pointer" },
};