const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const COLORES_PRESET = [
  "#2563eb", "#0099FF", "#7c3aed", "#db2777",
  "#dc2626", "#d97706", "#0e7490", "#0B1628",
];

const COLORES_SECUNDARIOS = [
  "#0B1628", "#1e293b", "#334155", "#1e3a5f",
  "#312e81", "#3f3f46", "#18181b", "#0c4a6e",
];

export default function AparienciaForm({
  empresa, onChange,
  bannerPreview, onBannerChange, onQuitarBanner,
}) {
  return (
    <div style={s.wrap}>

      {/* Banner */}
      <div style={s.section}>
        <h4 style={s.sectionTitle}>Banner de la tienda</h4>
        <p style={s.sectionDesc}>Imagen que aparece en el encabezado de tu tienda. Recomendado: 1200x300px</p>

        <div style={s.bannerWrap}>
          {bannerPreview ? (
            <div style={s.bannerPreviewWrap}>
              <img src={bannerPreview} alt="Banner" style={s.bannerImg} />
              <button style={s.quitarBtn} onClick={onQuitarBanner} type="button">
                ✕ Quitar banner
              </button>
            </div>
          ) : (
            <label style={s.bannerUpload}>
              <span style={s.bannerUploadIcon}>🖼️</span>
              <span style={s.bannerUploadText}>Haz clic para subir tu banner</span>
              <span style={s.bannerUploadHint}>JPG, PNG o WEBP · Máx 5MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => e.target.files[0] && onBannerChange(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Color primario */}
      <div style={s.section}>
        <h4 style={s.sectionTitle}>Color principal</h4>
        <p style={s.sectionDesc}>Se aplica en botones, precios y elementos destacados de tu tienda</p>

        <div style={s.colorWrap}>
          <div style={s.colorPresets}>
            {COLORES_PRESET.map((color) => (
              <button
                key={color}
                type="button"
                style={{
                  ...s.colorDot,
                  backgroundColor: color,
                  border: empresa?.color_primario === color
                    ? "3px solid #0f172a" : "3px solid transparent",
                  transform: empresa?.color_primario === color ? "scale(1.2)" : "scale(1)",
                }}
                onClick={() => onChange("color_primario", color)}
              />
            ))}
          </div>

          <div style={s.colorCustom}>
            <input
              type="color"
              value={empresa?.color_primario || "#2563eb"}
              onChange={e => onChange("color_primario", e.target.value)}
              style={s.colorInput}
            />
            <span style={s.colorValue}>{empresa?.color_primario || "#2563eb"}</span>
          </div>
        </div>
      </div>

      {/* Color secundario */}
      <div style={s.section}>
        <h4 style={s.sectionTitle}>Color secundario</h4>
        <p style={s.sectionDesc}>Se usa en el navbar, footer y botones de acción secundarios</p>

        <div style={s.colorWrap}>
          <div style={s.colorPresets}>
            {COLORES_SECUNDARIOS.map((color) => (
              <button
                key={color}
                type="button"
                style={{
                  ...s.colorDot,
                  backgroundColor: color,
                  border: empresa?.color_secundario === color
                    ? "3px solid #0f172a" : "3px solid transparent",
                  transform: empresa?.color_secundario === color ? "scale(1.2)" : "scale(1)",
                }}
                onClick={() => onChange("color_secundario", color)}
              />
            ))}
          </div>

          <div style={s.colorCustom}>
            <input
              type="color"
              value={empresa?.color_secundario || "#0B1628"}
              onChange={e => onChange("color_secundario", e.target.value)}
              style={s.colorInput}
            />
            <span style={s.colorValue}>{empresa?.color_secundario || "#0B1628"}</span>
          </div>
        </div>
      </div>

      {/* Preview de ambos colores */}
      <div style={s.section}>
        <h4 style={s.sectionTitle}>Vista previa</h4>
        <div style={s.colorPreviewDual}>
          <button style={{
            ...s.previewBtn,
            backgroundColor: empresa?.color_primario || "#2563eb",
          }}>
            Agregar al carrito
          </button>
          <button style={{
            ...s.previewBtn,
            backgroundColor: empresa?.color_secundario || "#0B1628",
          }}>
            Ver más
          </button>
          <p style={s.previewHint}>Así se verán los botones en tu tienda</p>
        </div>
      </div>

    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: "28px" },
  section: { display: "flex", flexDirection: "column", gap: "12px" },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  sectionDesc: { fontSize: "12px", color: "#64748b" },
  bannerWrap: {},
  bannerPreviewWrap: { display: "flex", flexDirection: "column", gap: "8px" },
  bannerImg: {
    width: "100%", height: "140px",
    objectFit: "cover", borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  quitarBtn: {
    alignSelf: "flex-start",
    background: "none", border: "none",
    color: "#ef4444", fontSize: "12px",
    cursor: "pointer", fontWeight: "600",
  },
  bannerUpload: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "6px", padding: "32px",
    border: "1.5px dashed #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
  },
  bannerUploadIcon: { fontSize: "32px" },
  bannerUploadText: { fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  bannerUploadHint: { fontSize: "12px", color: "#94a3b8" },
  colorWrap: { display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  colorPresets: { display: "flex", gap: "8px", flexWrap: "wrap" },
  colorDot: {
    width: "28px", height: "28px",
    borderRadius: "50%", cursor: "pointer",
    transition: "all 0.15s",
  },
  colorCustom: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    backgroundColor: "white",
  },
  colorInput: { width: "32px", height: "32px", border: "none", cursor: "pointer", borderRadius: "6px" },
  colorValue: { fontSize: "13px", fontFamily: "monospace", color: "#0f172a" },
  colorPreviewDual: { display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", flexWrap: "wrap" },
  previewBtn: {
    padding: "10px 20px",
    color: "white", border: "none",
    borderRadius: "9px", fontSize: "13px",
    fontWeight: "600", cursor: "default",
  },
  previewHint: { fontSize: "12px", color: "#94a3b8" },
};