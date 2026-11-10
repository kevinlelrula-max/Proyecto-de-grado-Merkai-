import ProductoCardEstilo from "./ProductoCardEstilos";

const GRID_CONFIG = {
  estandar:    { cols: "repeat(auto-fill, minmax(210px, 1fr))", gap: 20 },
  minimalista: { cols: "repeat(auto-fill, minmax(160px, 1fr))", gap: 24 },
  oscuro:      { cols: "repeat(auto-fill, minmax(210px, 1fr))", gap: 20 },
  boutique:    { cols: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 },
  horizontal:  { cols: "1fr",                                    gap: 12 },
};

export default function CatalogoGrid({ productos, loading, busqueda, onAgregar, statsReseñas = {}, onVerReseñas, colorMarca, estiloTarjeta = "estandar" }) {
  const gridCfg = GRID_CONFIG[estiloTarjeta] || GRID_CONFIG.estandar;

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: gridCfg.cols, gap: gridCfg.gap }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: estiloTarjeta === "boutique" ? 280 : 300, borderRadius: 16, backgroundColor: "#e2e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#e2e8f0" }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: "#64748b", maxWidth: 320, lineHeight: 1.5 }}>
          {busqueda ? `No encontramos productos para "${busqueda}"` : "Esta empresa no tiene productos disponibles aún"}
        </p>
        {busqueda && <p style={{ fontSize: 13, color: "#94a3b8" }}>Intenta con otro nombre</p>}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: gridCfg.cols, gap: gridCfg.gap }}>
      {productos.map((producto) => (
        <ProductoCardEstilo
          key={producto.id}
          estilo={estiloTarjeta}
          producto={producto}
          onAgregar={onAgregar}
          statsReseña={statsReseñas[producto.id]}
          onVerReseñas={onVerReseñas ? () => onVerReseñas(producto) : undefined}
          colorMarca={colorMarca}
        />
      ))}
    </div>
  );
}
