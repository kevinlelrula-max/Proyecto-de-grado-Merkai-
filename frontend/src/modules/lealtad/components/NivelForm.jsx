import { X, AlertTriangle } from "lucide-react";

export default function NivelForm({ form, editandoId, guardando, error, onChange, onGuardar, onCancelar }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <h3 style={s.title}>
            {editandoId ? "Editar nivel" : "Nuevo nivel de lealtad"}
          </h3>
          <button style={s.closeBtn} onClick={onCancelar}>
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Campos */}
        <div style={s.fields}>

          {/* Nombre */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Nombre del nivel</label>
            <input
              style={s.input}
              placeholder="Ej: Plata, Oro, Platino"
              value={form.nombre}
              onChange={(e) => onChange("nombre", e.target.value)}
            />
            <p style={s.hint}>Sugerencias: Bronce, Plata, Oro, Diamante, Platino</p>
          </div>

          {/* Monto mínimo */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Compras mínimas del mes</label>
            <div style={s.inputWrap}>
              <span style={s.prefix}>$</span>
              <input
                style={{ ...s.input, paddingLeft: "28px" }}
                type="number"
                placeholder="200000"
                value={form.monto_minimo}
                onChange={(e) => onChange("monto_minimo", e.target.value)}
                min="0"
              />
            </div>
            <p style={s.hint}>
              El cliente debe superar este monto en compras durante el mes
            </p>
          </div>

          {/* Descuento */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Porcentaje de descuento</label>
            <div style={s.inputWrap}>
              <input
                style={{ ...s.input, paddingRight: "32px" }}
                type="number"
                placeholder="10"
                value={form.descuento_porcentaje}
                onChange={(e) => onChange("descuento_porcentaje", e.target.value)}
                min="1"
                max="100"
              />
              <span style={s.suffix}>%</span>
            </div>
            <p style={s.hint}>Entre 1% y 100%</p>
          </div>

          {/* Preview */}
          {form.monto_minimo && form.descuento_porcentaje && form.nombre && (
            <div style={s.preview}>
              <p style={s.previewTitle}>Vista previa</p>
              <p style={s.previewText}>
                Clientes que superen{" "}
                <strong>${Number(form.monto_minimo).toLocaleString("es-CO")}</strong>{" "}
                en compras este mes verán los precios con{" "}
                <strong>{form.descuento_porcentaje}% de descuento</strong>{" "}
                como nivel <strong>{form.nombre}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div style={s.btnRow}>
          <button style={s.btnCancelar} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            style={{ ...s.btnGuardar, opacity: guardando ? 0.7 : 1 }}
            onClick={onGuardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear nivel"}
          </button>
        </div>

      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15,23,42,0.6)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "28px",
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#b91c1c",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  prefix: {
    position: "absolute",
    left: "12px",
    fontSize: "14px",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  suffix: {
    position: "absolute",
    right: "12px",
    fontSize: "14px",
    color: "#94a3b8",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    fontSize: "14px",
    color: "#0f172a",
    backgroundColor: "white",
    outline: "none",
    boxSizing: "border-box",
  },
  hint: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  preview: {
    padding: "14px",
    backgroundColor: "#f0fdf4",
    borderRadius: "10px",
    border: "1px solid #bbf7d0",
  },
  previewTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
  },
  previewText: {
    fontSize: "13px",
    color: "#374151",
    lineHeight: "1.6",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
  },
  btnCancelar: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: "500",
  },
  btnGuardar: {
    flex: 2,
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};
