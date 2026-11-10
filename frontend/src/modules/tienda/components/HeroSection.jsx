import { useNavigate } from "react-router-dom";
import { imgUrl } from "../../../utils/imgUrl";

export default function HeroSection({ variante = "oscuro", empresa, empresaNombre, empresaSlug, productosCount }) {
  const navigate        = useNavigate();
  const colorMarca      = empresa?.color_primario   || "#0F6E56";
  const colorSecundario = empresa?.color_secundario || "#0B1628";
  const heroTitulo      = empresa?.hero_titulo      || empresaNombre;
  const heroSubtitulo   = empresa?.hero_subtitulo   || empresa?.descripcion || "";
  const heroBtnTexto    = empresa?.hero_btn_texto   || "Ver catálogo →";
  const bannerUrl       = imgUrl(empresa?.banner_url);
  const logoUrl         = imgUrl(empresa?.logo_url);

  const props = { colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, productosCount, navigate, bannerUrl, logoUrl };

  if (variante === "lateral")    return <HeroLateral    {...props} />;
  if (variante === "minimalista") return <HeroMinimalista {...props} />;
  if (variante === "revista")    return <HeroRevista    {...props} />;
  if (variante === "negrita")    return <HeroNegrita    {...props} />;
  if (variante === "gradiente")  return <HeroGradiente  {...props} />;
  return <HeroOscuro {...props} />;
}

// ── Oscuro ────────────────────────────────────────────────────────────────────
function HeroOscuro({ colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, productosCount, navigate, bannerUrl }) {
  return (
    <div style={{
      minHeight: "520px", padding: "0 24px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center",
      background: bannerUrl
        ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.75)), url(${bannerUrl}) center/cover no-repeat`
        : `linear-gradient(135deg, ${colorSecundario} 0%, ${colorSecundario}dd 70%, ${colorSecundario}bb 100%)`,
    }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px", padding: "80px 0", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px", position: "relative", zIndex: 1, maxWidth: "620px" }}>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 58px)", fontWeight: "800", color: "white", letterSpacing: "-0.03em", lineHeight: 1.05, margin: 0 }}>{heroTitulo}</h1>
          {heroSubtitulo && <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.65)", lineHeight: "1.75", maxWidth: "500px", margin: 0 }}>{heroSubtitulo}</p>}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button style={{ padding: "14px 28px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", backgroundColor: colorMarca }}
              onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}>
              {heroBtnTexto}
            </button>
            {empresa?.whatsapp
              ? <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "14px 28px", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", textDecoration: "none" }}>WhatsApp</a>
              : <button style={{ padding: "14px 28px", backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }} onClick={() => navigate(`/tienda/${empresaSlug}/contacto`, { state: { empresa } })}>Contacto</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lateral ───────────────────────────────────────────────────────────────────
function HeroLateral({ colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, productosCount, navigate, logoUrl }) {
  return (
    <div style={{ display: "flex", minHeight: "480px", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", backgroundColor: "#f8fafc", minWidth: 0 }}>
        <h1 style={{ fontSize: "44px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0 }}>{heroTitulo}</h1>
        {heroSubtitulo && <p style={{ fontSize: "16px", color: "#64748b", lineHeight: "1.75", maxWidth: "480px", margin: 0 }}>{heroSubtitulo}</p>}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button style={{ padding: "13px 26px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", backgroundColor: colorMarca }}
            onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}>
            {heroBtnTexto}
          </button>
          {empresa?.whatsapp
            ? <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "13px 26px", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", textDecoration: "none" }}>WhatsApp</a>
            : <button style={{ padding: "13px 26px", background: "transparent", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }} onClick={() => navigate(`/tienda/${empresaSlug}/contacto`, { state: { empresa } })}>Contacto</button>
          }
        </div>
      </div>
      <div style={{ width: "340px", flexShrink: 0, backgroundColor: colorSecundario, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "48px 32px" }}>
        {logoUrl
          ? <img src={logoUrl} alt={empresaNombre} style={{ width: 90, height: 90, borderRadius: 22, objectFit: "cover" }} />
          : <div style={{ width: "90px", height: "90px", borderRadius: "22px", backgroundColor: colorMarca, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "800", color: "white" }}>{empresaNombre?.slice(0, 2).toUpperCase()}</div>
        }
        <p style={{ color: "white", fontSize: "18px", fontWeight: "700", margin: 0, textAlign: "center" }}>{empresaNombre}</p>
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          {productosCount > 0 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{productosCount} productos</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Minimalista ───────────────────────────────────────────────────────────────
function HeroMinimalista({ colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, productosCount, navigate, logoUrl }) {
  return (
    <div style={{ backgroundColor: "white", padding: "80px 24px", borderBottom: `3px solid ${colorMarca}` }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        {logoUrl && <img src={logoUrl} alt={empresaNombre} style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover" }} />}
        <h1 style={{ fontSize: "46px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0 }}>{heroTitulo}</h1>
        {heroSubtitulo && <p style={{ fontSize: "17px", color: "#64748b", lineHeight: "1.75", margin: 0 }}>{heroSubtitulo}</p>}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{ padding: "13px 28px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", backgroundColor: colorMarca }}
            onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}>
            {heroBtnTexto}
          </button>
          {empresa?.whatsapp
            ? <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "13px 28px", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", textDecoration: "none" }}>WhatsApp</a>
            : <button style={{ padding: "13px 28px", background: "transparent", color: colorMarca, border: `1.5px solid ${colorMarca}`, borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }} onClick={() => navigate(`/tienda/${empresaSlug}/contacto`, { state: { empresa } })}>Contacto</button>
          }
        </div>
        {productosCount > 0 && (
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>{productosCount} productos disponibles</p>
        )}
      </div>
    </div>
  );
}

// ── Revista ───────────────────────────────────────────────────────────────────
function HeroRevista({ colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, navigate, bannerUrl, logoUrl }) {
  return (
    <div style={{
      minHeight: "600px", position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end",
      background: bannerUrl
        ? `url(${bannerUrl}) center/cover no-repeat`
        : `linear-gradient(135deg, ${colorSecundario}, #000)`,
    }}>
      {/* Overlay gradiente de abajo hacia arriba */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.1) 100%)" }} />

      {/* Badge empresa arriba-izquierda */}
      <div style={{ position: "absolute", top: 28, left: 28, display: "flex", alignItems: "center", gap: 10, zIndex: 2 }}>
        {logoUrl
          ? <img src={logoUrl} alt={empresaNombre} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
          : <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colorMarca, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>{empresaNombre?.slice(0, 2).toUpperCase()}</div>
        }
        <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{empresaNombre}</span>
      </div>

      {/* Contenido principal - abajo izquierda */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 48px 56px", maxWidth: "720px" }}>
        <div style={{ display: "inline-block", padding: "4px 12px", backgroundColor: colorMarca, borderRadius: 4, marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tienda Online</span>
        </div>
        <h1 style={{ fontSize: "64px", fontWeight: "900", color: "white", lineHeight: 1.0, margin: "0 0 16px", letterSpacing: "-0.03em" }}>{heroTitulo}</h1>
        {heroSubtitulo && <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: 520 }}>{heroSubtitulo}</p>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button style={{ padding: "14px 32px", backgroundColor: colorMarca, color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}>
            {heroBtnTexto}
          </button>
          {empresa?.whatsapp
            ? <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "14px 24px", backgroundColor: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>WhatsApp</a>
            : null
          }
        </div>
      </div>
    </div>
  );
}

// ── Negrita ───────────────────────────────────────────────────────────────────
function HeroNegrita({ colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, productosCount, navigate, logoUrl }) {
  const palabras = heroTitulo.split(" ");
  const mitad    = Math.ceil(palabras.length / 2);
  const linea1   = palabras.slice(0, mitad).join(" ");
  const linea2   = palabras.slice(mitad).join(" ");
  return (
    <div style={{ backgroundColor: "#fafafa", borderBottom: `1px solid #e2e8f0`, overflow: "hidden" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 32px", display: "flex", gap: 48, alignItems: "center" }}>
        {/* Izquierda: tipografía grande */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            {logoUrl
              ? <img src={logoUrl} alt={empresaNombre} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
              : <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colorMarca, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white" }}>{empresaNombre?.slice(0, 2).toUpperCase()}</div>
            }
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>{empresaNombre}</span>
          </div>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#0f172a", lineHeight: 1.0, margin: "0 0 20px", letterSpacing: "-0.04em" }}>
            <span style={{ display: "block" }}>{linea1}</span>
            <span style={{ display: "block", color: colorMarca }}>{linea2}</span>
          </h1>
          {heroSubtitulo && <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 480 }}>{heroSubtitulo}</p>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={{ padding: "14px 32px", backgroundColor: colorMarca, color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}>
              {heroBtnTexto}
            </button>
            {empresa?.whatsapp
              ? <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "14px 24px", backgroundColor: "#25D366", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>WhatsApp</a>
              : null
            }
          </div>
        </div>
        {/* Derecha: bloque de color */}
        <div style={{ width: 220, flexShrink: 0, backgroundColor: colorSecundario, borderRadius: 24, padding: "40px 28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {logoUrl
            ? <img src={logoUrl} alt={empresaNombre} style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover" }} />
            : <div style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: colorMarca, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "white" }}>{empresaNombre?.slice(0, 2).toUpperCase()}</div>
          }
          <p style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0, textAlign: "center" }}>{empresaNombre}</p>
          {productosCount > 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>{productosCount} productos</p>}
        </div>
      </div>
    </div>
  );
}

// ── Gradiente ─────────────────────────────────────────────────────────────────
function HeroGradiente({ colorMarca, colorSecundario, heroTitulo, heroSubtitulo, heroBtnTexto, empresa, empresaNombre, empresaSlug, productosCount, navigate, logoUrl }) {
  return (
    <div style={{
      minHeight: "520px", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${colorSecundario} 0%, ${colorMarca}cc 100%)`,
      padding: "80px 24px", position: "relative", overflow: "hidden",
    }}>
      {/* Círculos decorativos de fondo */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${colorMarca}30, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 350, height: 350, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 700, textAlign: "center", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Logo o iniciales */}
        <div style={{ width: 80, height: 80, borderRadius: 22, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {logoUrl
            ? <img src={logoUrl} alt={empresaNombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{empresaNombre?.slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{empresaNombre}</span>
        <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, color: "white", lineHeight: 1.05, margin: 0, letterSpacing: "-0.03em" }}>{heroTitulo}</h1>
        {heroSubtitulo && <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: 0, maxWidth: 540 }}>{heroSubtitulo}</p>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{ padding: "15px 36px", backgroundColor: "white", color: colorSecundario, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}
            onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}>
            {heroBtnTexto}
          </button>
          {empresa?.whatsapp
            ? <a href={`https://wa.me/${empresa.whatsapp}`} target="_blank" rel="noreferrer" style={{ padding: "15px 28px", backgroundColor: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(8px)" }}>WhatsApp</a>
            : null
          }
        </div>
        {productosCount > 0 && (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>{productosCount} productos disponibles</p>
        )}
      </div>
    </div>
  );
}
