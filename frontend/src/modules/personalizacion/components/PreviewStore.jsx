export default function PreviewStore({ vista, slug, iframeKey }) {
  const linkTienda = slug ? `${window.location.origin}/tienda/${slug}` : null;

  return (
    <div style={s.container}>
      <div style={{
        ...s.iframeWrap,
        background: vista === "mobile" ? "#e2e8f0" : "white",
        padding: vista === "mobile" ? "24px" : "0",
        justifyContent: vista === "mobile" ? "center" : "stretch",
        alignItems: vista === "mobile" ? "flex-start" : "stretch",
      }}>
        {linkTienda ? (
          <iframe
            key={iframeKey}
            src={linkTienda}
            title="Vista previa de la tienda"
            style={{
              ...s.iframe,
              width: vista === "mobile" ? "390px" : "100%",
              borderRadius: vista === "mobile" ? "20px" : "0",
              border: vista === "mobile" ? "8px solid #1e293b" : "none",
              boxShadow: vista === "mobile" ? "0 20px 60px rgba(0,0,0,0.3)" : "none",
            }}
          />
        ) : (
          <div style={s.empty}>
            <span style={{ fontSize: 44, opacity: 0.3 }}>◻</span>
            <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
              Guarda tu configuración para ver la tienda aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "white",
  },
  iframeWrap: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    transition: "all 0.3s",
  },
  iframe: {
    height: "100%",
    border: "none",
    transition: "all 0.3s",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
};
