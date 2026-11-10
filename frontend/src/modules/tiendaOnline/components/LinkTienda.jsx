const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function LinkTienda({ linkTienda, copiado, onCopiar, onAbrir, empresa }) {
  return (
    <div style={s.wrap}>

      {/* Preview mockup de la tienda */}
      <div style={s.mockupWrap}>
        <div style={s.mockupBrowser}>
          {/* Barra del navegador */}
          <div style={s.browserBar}>
            <div style={s.browserDots}>
              <div style={{ ...s.dot, backgroundColor: "#ff5f57" }} />
              <div style={{ ...s.dot, backgroundColor: "#febc2e" }} />
              <div style={{ ...s.dot, backgroundColor: "#28c840" }} />
            </div>
            <div style={s.browserUrl}>
              <span style={s.browserUrlText}>{linkTienda || "tu-tienda.warefish.com"}</span>
            </div>
          </div>

          {/* Preview de la tienda */}
          <div style={{
            ...s.browserContent,
            background: empresa?.banner_url
              ? `url(${API_BASE}${empresa.banner_url}) center/cover`
              : `linear-gradient(135deg, ${empresa?.color_primario || "#2563eb"} 0%, #0B1628 100%)`,
          }}>
            {/* Navbar simulado */}
            <div style={s.previewNav}>
              <div style={s.previewNavBrand}>
                <div style={s.previewNavLogo} />
                <span style={s.previewNavNombre}>{empresa?.nombre || "Tu Tienda"}</span>
              </div>
              <div style={s.previewNavActions}>
                <div style={s.previewNavBtn} />
                <div style={s.previewNavBtn} />
              </div>
            </div>

            {/* Hero simulado */}
            <div style={s.previewHero}>
              <div style={s.previewHeroTitle} />
              <div style={s.previewHeroSubtitle} />
              <div style={{
                ...s.previewHeroBtn,
                backgroundColor: empresa?.color_primario || "#2563eb",
              }} />
            </div>

            {/* Productos simulados */}
            <div style={s.previewProducts}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={s.previewProductCard}>
                  <div style={s.previewProductImg} />
                  <div style={s.previewProductInfo}>
                    <div style={s.previewProductName} />
                    <div style={s.previewProductPrice} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Badge Online */}
        <div style={s.onlineBadge}>
          <div style={s.onlineDot} />
          Tu tienda está activa
        </div>
      </div>

      {/* Link y acciones */}
      <div style={s.linkSection}>
        <div style={s.linkHeader}>
          <h3 style={s.linkTitle}>Link de tu tienda</h3>
          <p style={s.linkSubtitle}>Comparte este link con tus clientes</p>
        </div>

        <div style={s.linkCard}>
          <span style={s.linkIcon}>🔗</span>
          <span style={s.linkText}>{linkTienda || "Configura tu tienda para obtener el link"}</span>
        </div>

        <div style={s.btnRow}>
          <button
            style={{
              ...s.btnCopiar,
              backgroundColor: copiado ? "#2563eb" : "#0B1628",
            }}
            onClick={onCopiar}
            disabled={!linkTienda}
          >
            {copiado ? "✓ Copiado" : "📋 Copiar link"}
          </button>
          <button style={s.btnAbrir} onClick={onAbrir} disabled={!linkTienda}>
            Ver tienda →
          </button>
        </div>
      </div>

      {/* Cómo compartir */}
      <div style={s.compartirWrap}>
        <h4 style={s.compartirTitle}>¿Cómo compartir tu tienda?</h4>
        <div style={s.compartirGrid}>
          {[
            { icon: "📱", titulo: "WhatsApp", desc: "Envía el link por mensaje" },
            { icon: "📸", titulo: "Instagram", desc: "Ponlo en tu bio" },
            { icon: "📧", titulo: "Email", desc: "Envíalo a tus contactos" },
            { icon: "🖨️", titulo: "Impreso", desc: "Genera un QR (próximamente)" },
          ].map((item, i) => (
            <div key={i} style={s.compartirItem}>
              <span style={s.compartirIcon}>{item.icon}</span>
              <div>
                <p style={s.compartirItemTitulo}>{item.titulo}</p>
                <p style={s.compartirItemDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: "24px" },

  // Mockup
  mockupWrap: { position: "relative" },
  mockupBrowser: {
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  },
  browserBar: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "10px 16px",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
  },
  browserDots: { display: "flex", gap: "6px", flexShrink: 0 },
  dot: { width: "10px", height: "10px", borderRadius: "50%" },
  browserUrl: {
    flex: 1, padding: "4px 12px",
    backgroundColor: "white",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  browserUrlText: { fontSize: "11px", color: "#64748b", fontFamily: "monospace" },
  browserContent: {
    height: "220px",
    overflow: "hidden",
    position: "relative",
  },

  // Preview interno
  previewNav: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    backgroundColor: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)",
  },
  previewNavBrand: { display: "flex", alignItems: "center", gap: "8px" },
  previewNavLogo: { width: "20px", height: "20px", borderRadius: "5px", backgroundColor: "rgba(255,255,255,0.5)" },
  previewNavNombre: { fontSize: "11px", fontWeight: "600", color: "white" },
  previewNavActions: { display: "flex", gap: "8px" },
  previewNavBtn: { width: "40px", height: "14px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.2)" },
  previewHero: {
    padding: "20px 16px",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  previewHeroTitle: { width: "60%", height: "14px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.8)" },
  previewHeroSubtitle: { width: "40%", height: "10px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.5)" },
  previewHeroBtn: { width: "80px", height: "22px", borderRadius: "6px", marginTop: "4px" },
  previewProducts: {
    display: "flex", gap: "8px",
    padding: "0 16px",
  },
  previewProductCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: "6px", overflow: "hidden",
  },
  previewProductImg: { height: "40px", backgroundColor: "#e2e8f0" },
  previewProductInfo: { padding: "6px" },
  previewProductName: { height: "8px", borderRadius: "3px", backgroundColor: "#cbd5e1", marginBottom: "4px" },
  previewProductPrice: { height: "8px", width: "60%", borderRadius: "3px", backgroundColor: "#94a3b8" },

  // Badge
  onlineBadge: {
    position: "absolute", top: "50px", right: "12px",
    display: "flex", alignItems: "center", gap: "6px",
    padding: "6px 12px",
    backgroundColor: "white",
    borderRadius: "999px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    fontSize: "12px", fontWeight: "600", color: "#2563eb",
  },
  onlineDot: {
    width: "8px", height: "8px",
    borderRadius: "50%", backgroundColor: "#2563eb",
    boxShadow: "0 0 0 2px rgba(15,110,86,0.2)",
  },

  // Link section
  linkSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  linkHeader: {},
  linkTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" },
  linkSubtitle: { fontSize: "13px", color: "#64748b" },
  linkCard: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
  },
  linkIcon: { fontSize: "18px", flexShrink: 0 },
  linkText: {
    flex: 1, fontSize: "14px",
    color: "#0f172a", fontFamily: "monospace",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  btnRow: { display: "flex", gap: "10px" },
  btnCopiar: {
    flex: 1, padding: "12px",
    color: "white", border: "none",
    borderRadius: "10px", fontSize: "14px",
    fontWeight: "600", cursor: "pointer",
    transition: "background 0.2s",
  },
  btnAbrir: {
    flex: 1, padding: "12px",
    backgroundColor: "white",
    color: "#2563eb",
    border: "1.5px solid #2563eb",
    borderRadius: "10px", fontSize: "14px",
    fontWeight: "600", cursor: "pointer",
  },

  // Cómo compartir
  compartirWrap: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
  },
  compartirTitle: {
    fontSize: "14px", fontWeight: "700",
    color: "#0f172a", marginBottom: "16px",
  },
  compartirGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  compartirItem: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  compartirIcon: { fontSize: "22px", flexShrink: 0 },
  compartirItemTitulo: { fontSize: "13px", fontWeight: "600", color: "#0f172a" },
  compartirItemDesc: { fontSize: "11px", color: "#94a3b8", marginTop: "2px" },
};