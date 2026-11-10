import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEmpresasPublicas } from "../services/api";

// Colores de avatar por inicial
const AVATAR_COLORS = [
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#eff6ff", color: "#1e40af" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#fffbeb", color: "#b45309" },
  { bg: "#ecfeff", color: "#0e7490" },
  { bg: "#fdf2f8", color: "#be185d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#f0fdf4", color: "#166534" },
];

function getAvatarColor(nombre) {
  const idx = nombre.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getIniciales(nombre) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function Tienda() {
  const navigate  = useNavigate();
  const [empresas, setEmpresas]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  const clienteNombre = localStorage.getItem("cliente_nombre");
  const clienteToken  = localStorage.getItem("cliente_token");

  useEffect(() => {
    getEmpresasPublicas()
      .then(setEmpresas)
      .finally(() => setLoading(false));
  }, []);

  const empresasFiltradas = empresas.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.nit?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleVerCatalogo = (empresa) => {
  localStorage.setItem("ultima_empresa", JSON.stringify(empresa)); // ✅ añadir
  navigate(`/tienda/${slugify(empresa.nombre)}`, { state: { empresa } });
};

  const handleCerrarSesion = () => {
    localStorage.removeItem("cliente_token");
    localStorage.removeItem("cliente_id");
    localStorage.removeItem("cliente_nombre");
    navigate("/tienda");
  };

  return (
    <div style={s.page}>

      {/* ── NAVBAR ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>

          {/* Logo */}
          <div style={s.navBrand} onClick={() => navigate("/")}>
            <img src="/logo-merkai-icon.png" alt="Merkai" width="26" height="26" style={{ objectFit: "contain" }} />
            <div>
              <span style={s.navBrandName}>Merkai</span>
              <span style={s.navBrandSub}>Tienda</span>
            </div>
          </div>

          {/* Buscador central */}
          <div style={s.navSearch}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/>
            </svg>
            <input
              style={s.navSearchInput}
              placeholder="Buscar empresa o NIT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button style={s.clearBtn} onClick={() => setBusqueda("")}>✕</button>
            )}
          </div>

          {/* Acciones */}
          <div style={s.navActions}>
            {clienteToken ? (
              <>
                <button style={s.navBtnGhost} onClick={() => navigate("/tienda/mis-pedidos")}>
                  📦 Mis pedidos
                </button>
                <div style={s.navUser}>
                  <div style={s.navAvatar}>
                    {clienteNombre?.[0]?.toUpperCase() ?? "C"}
                  </div>
                  <span style={s.navUserName}>{clienteNombre}</span>
                  <button style={s.navBtnSalir} onClick={handleCerrarSesion}>Salir</button>
                </div>
              </>
            ) : (
              <>
                <button style={s.navBtnGhost} onClick={() => navigate("/tienda/login")}>
                  Iniciar sesión
                </button>
                <button style={s.navBtnPrimary} onClick={() => navigate("/tienda/registro")}>
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroBadge}>🛒 Marketplace</div>
          <h1 style={s.heroTitle}>Encuentra tu tienda favorita</h1>
          <p style={s.heroSubtitle}>
            Explora el catálogo de las empresas disponibles y haz tu pedido
            directamente. Sin intermediarios, con entrega a domicilio.
          </p>
        </div>
        {/* Decoración */}
        <div style={s.heroGlow1} />
        <div style={s.heroGlow2} />
      </div>

      {/* ── CONTENIDO ── */}
      <div style={s.content}>

        {/* Header de resultados */}
        <div style={s.resultsHeader}>
          {loading ? (
            <span style={s.resultsCount}>Cargando empresas...</span>
          ) : (
            <span style={s.resultsCount}>
              {empresasFiltradas.length === 0
                ? "No se encontraron empresas"
                : `${empresasFiltradas.length} empresa${empresasFiltradas.length !== 1 ? "s" : ""} disponible${empresasFiltradas.length !== 1 ? "s" : ""}`}
            </span>
          )}
          {busqueda && (
            <span style={s.resultsBusqueda}>
              Resultados para <strong>"{busqueda}"</strong>
            </span>
          )}
        </div>

        {/* Grid de empresas */}
        {loading ? (
          <div style={s.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={s.skeleton} />
            ))}
          </div>
        ) : empresasFiltradas.length === 0 ? (
          <div style={s.empty}>
            <span style={s.emptyIcon}>🔍</span>
            <p style={s.emptyTitle}>No encontramos empresas</p>
            <p style={s.emptyDesc}>Intenta con otro nombre o NIT</p>
            <button style={s.emptyBtn} onClick={() => setBusqueda("")}>
              Ver todas las empresas
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {empresasFiltradas.map((empresa) => {
              const { bg, color } = getAvatarColor(empresa.nombre);
              const iniciales     = getIniciales(empresa.nombre);
              const isHovered     = hoveredId === empresa.id;

              return (
                <div
                  key={empresa.id}
                  style={{
                    ...s.card,
                    boxShadow: isHovered
                      ? "0 12px 40px rgba(15,110,86,0.15)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                  }}
                  onMouseEnter={() => setHoveredId(empresa.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Barra superior de color */}
                  <div style={{ ...s.cardBar, backgroundColor: color }} />

                  <div style={s.cardBody}>
                    {/* Avatar */}
                    <div style={{ ...s.avatar, backgroundColor: bg, color }}>
                      {iniciales}
                    </div>

                    {/* Info */}
                    <div style={s.cardInfo}>
                      <h3 style={s.cardNombre}>{empresa.nombre}</h3>
                      {empresa.telefono && (
                        <p style={s.cardTel}>📞 {empresa.telefono}</p>
                      )}
                      <p style={s.cardNit}>NIT {empresa.nit}</p>
                    </div>

                    {/* Footer */}
                    <div style={s.cardFooter}>
                      <div style={s.onlineBadge}>
                        <span style={s.onlineDot} />
                        Online
                      </div>
                      <button
                        style={{
                          ...s.cardBtn,
                          backgroundColor: isHovered ? color : "transparent",
                          color: isHovered ? "white" : color,
                          borderColor: color,
                        }}
                        onClick={() => handleVerCatalogo(empresa)}
                      >
                        Ver catálogo →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerText}>© 2026 Merkai · Marketplace</span>
          <button style={s.footerEmpresa} onClick={() => navigate("/empresa/login")}>
            ¿Eres una empresa? Ingresa aquí →
          </button>
        </div>
      </footer>

    </div>
  );
}

/* ─── ESTILOS ─── */
const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },

  // Navbar
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "rgba(15,23,42,0.97)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  navInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    flexShrink: 0,
  },
  navBrandName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "white",
    display: "block",
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
  },
  navBrandSub: {
    fontSize: "10px",
    color: "#34d399",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    display: "block",
  },
  navSearch: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "0 14px",
    height: "38px",
    maxWidth: "400px",
  },
  navSearchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "white",
    "::placeholder": { color: "#64748b" },
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0",
    lineHeight: 1,
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
    marginLeft: "auto",
  },
  navBtnGhost: {
    padding: "7px 14px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.8)",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
  },
  navBtnPrimary: {
    padding: "7px 16px",
    backgroundColor: "#0F6E56",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "600",
  },
  navUser: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#0F6E56",
    color: "white",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navUserName: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  navBtnSalir: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "12px",
    cursor: "pointer",
    padding: "0",
  },

  // Hero
  hero: {
    background: "linear-gradient(145deg, #0f172a 0%, #0d2b45 60%, #0f1f2e 100%)",
    padding: "48px 24px",
    position: "relative",
    overflow: "hidden",
  },
  heroInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(52,211,153,0.3)",
    color: "#34d399",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "rgba(52,211,153,0.08)",
    marginBottom: "14px",
    letterSpacing: "0.02em",
  },
  heroTitle: {
    fontSize: "36px",
    fontWeight: "800",
    color: "white",
    letterSpacing: "-0.03em",
    marginBottom: "10px",
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.6)",
    lineHeight: "1.6",
    maxWidth: "480px",
  },
  heroGlow1: {
    position: "absolute", top: "-100px", right: "-100px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(15,110,86,0.2) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  heroGlow2: {
    position: "absolute", bottom: "-80px", left: "30%",
    width: "300px", height: "300px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },

  // Contenido
  content: {
    flex: 1,
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px",
    width: "100%",
    boxSizing: "border-box",
  },
  resultsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  resultsCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  resultsBusqueda: {
    fontSize: "13px",
    color: "#64748b",
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    transition: "all 0.22s ease",
    cursor: "default",
  },
  cardBar: {
    height: "4px",
    width: "100%",
  },
  cardBody: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
  },
  cardInfo: {},
  cardNombre: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "4px",
    lineHeight: "1.3",
  },
  cardTel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
  },
  cardNit: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  onlineBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#0F6E56",
  },
  onlineDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#0F6E56",
    boxShadow: "0 0 0 2px rgba(15,110,86,0.2)",
  },
  cardBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1.5px solid",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },

  // Skeleton
  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },
  skeleton: {
    height: "200px",
    borderRadius: "16px",
    backgroundColor: "#e2e8f0",
    animation: "pulse 1.5s ease-in-out infinite",
  },

  // Empty state
  empty: {
    textAlign: "center",
    padding: "80px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: { fontSize: "48px" },
  emptyTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a" },
  emptyDesc: { fontSize: "14px", color: "#64748b" },
  emptyBtn: {
    marginTop: "8px",
    padding: "10px 20px",
    backgroundColor: "#0F6E56",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // Footer
  footer: {
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "white",
    padding: "16px 24px",
  },
  footerInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  footerEmpresa: {
    background: "none",
    border: "none",
    color: "#0F6E56",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};