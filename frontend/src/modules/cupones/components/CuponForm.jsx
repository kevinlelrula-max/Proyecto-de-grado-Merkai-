import { X, AlertTriangle } from "lucide-react";

export default function CuponForm({ form, editandoId, guardando, error, onChange, onGuardar, onCancelar }) {
  return (
    <>
      <div style={s.overlay} onClick={onCancelar} />
      <div style={s.modal}>

        <div style={s.header}>
          <h3 style={s.title}>{editandoId ? "Editar cupón" : "Nuevo cupón"}</h3>
          <button style={s.closeBtn} onClick={onCancelar}>
            <X size={16} />
          </button>
        </div>

        <div style={s.body}>

          {/* Código */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Código <span style={s.req}>*</span></label>
              <input
                style={s.input}
                name="codigo"
                value={form.codigo}
                onChange={onChange}
                placeholder="VERANO20"
                maxLength={50}
              />
              <p style={s.hint}>Los clientes ingresarán este código en el carrito</p>
            </div>
            <div style={s.field}>
              <label style={s.label}>Tipo de descuento <span style={s.req}>*</span></label>
              <select style={s.select} name="tipo" value={form.tipo} onChange={onChange}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="valor_fijo">Valor fijo ($)</option>
                <option value="envio_gratis">Envío gratis</option>
              </select>
            </div>
          </div>

          {/* Valor */}
          {form.tipo !== "envio_gratis" && (
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>
                  Valor <span style={s.req}>*</span>
                  <span style={s.labelHint}>{form.tipo === "porcentaje" ? "(entre 1 y 100)" : "(en pesos COP)"}</span>
                </label>
                <input
                  style={s.input}
                  name="valor"
                  type="number"
                  value={form.valor}
                  onChange={onChange}
                  placeholder={form.tipo === "porcentaje" ? "10" : "15000"}
                  min="1"
                  max={form.tipo === "porcentaje" ? 100 : undefined}
                />
              </div>
              {form.tipo === "porcentaje" && (
                <div style={s.field}>
                  <label style={s.label}>
                    Descuento máximo
                    <span style={s.labelHint}>(opcional, en pesos)</span>
                  </label>
                  <input
                    style={s.input}
                    name="maximo_descuento"
                    type="number"
                    value={form.maximo_descuento}
                    onChange={onChange}
                    placeholder="50000"
                    min="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Descripción */}
          <div style={s.field}>
            <label style={s.label}>Descripción <span style={s.labelHint}>(opcional)</span></label>
            <input
              style={s.input}
              name="descripcion"
              value={form.descripcion}
              onChange={onChange}
              placeholder="10% de descuento en toda la tienda"
              maxLength={200}
            />
          </div>

          {/* Mínimo de compra */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Mínimo de compra <span style={s.labelHint}>(0 = sin mínimo)</span></label>
              <input
                style={s.input}
                name="minimo_compra"
                type="number"
                value={form.minimo_compra}
                onChange={onChange}
                placeholder="0"
                min="0"
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Usos por cliente</label>
              <input
                style={s.input}
                name="usos_por_cliente"
                type="number"
                value={form.usos_por_cliente}
                onChange={onChange}
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Límite total de usos */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Límite total de usos <span style={s.labelHint}>(vacío = ilimitado)</span></label>
              <input
                style={s.input}
                name="usos_totales"
                type="number"
                value={form.usos_totales}
                onChange={onChange}
                placeholder="100"
                min="1"
              />
            </div>
          </div>

          {/* Fechas */}
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Fecha de inicio <span style={s.labelHint}>(opcional)</span></label>
              <input
                style={s.input}
                name="fecha_inicio"
                type="date"
                value={form.fecha_inicio}
                onChange={onChange}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Fecha de vencimiento <span style={s.labelHint}>(opcional)</span></label>
              <input
                style={s.input}
                name="fecha_fin"
                type="date"
                value={form.fecha_fin}
                onChange={onChange}
              />
            </div>
          </div>

          {error && (
            <div style={s.errorBox}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        <div style={s.footer}>
          <button style={s.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button
            style={{ ...s.btnGuardar, opacity: guardando ? 0.75 : 1 }}
            onClick={onGuardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear cupón"}
          </button>
        </div>
      </div>
    </>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(15,23,42,0.6)",
    zIndex: 400, backdropFilter: "blur(3px)",
  },
  modal: {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%", maxWidth: "580px",
    backgroundColor: "white", borderRadius: "20px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
    zIndex: 401, fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxHeight: "90vh", display: "flex", flexDirection: "column",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexShrink: 0,
  },
  title:    { fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
    padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  body:     { padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" },
  row:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  field:    { display: "flex", flexDirection: "column", gap: "5px" },
  label:    { fontSize: "12px", fontWeight: "600", color: "#374151" },
  labelHint:{ fontSize: "11px", fontWeight: "400", color: "#94a3b8", marginLeft: "4px" },
  req:      { color: "#ef4444" },
  hint:     { fontSize: "11px", color: "#94a3b8", margin: 0 },
  input: {
    padding: "9px 12px", borderRadius: "9px",
    border: "1.5px solid #e2e8f0", fontSize: "13px",
    color: "#0f172a", outline: "none", boxSizing: "border-box", width: "100%",
  },
  select: {
    padding: "9px 12px", borderRadius: "9px",
    border: "1.5px solid #e2e8f0", fontSize: "13px",
    color: "#0f172a", outline: "none", backgroundColor: "white", width: "100%",
  },
  errorBox: {
    backgroundColor: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c",
    display: "flex", alignItems: "center", gap: "8px",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex", justifyContent: "flex-end", gap: "12px",
    flexShrink: 0,
  },
  btnCancelar: {
    padding: "9px 20px", backgroundColor: "white", color: "#374151",
    border: "1.5px solid #e2e8f0", borderRadius: "10px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },
  btnGuardar: {
    padding: "9px 24px", backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "13px", fontWeight: "700", cursor: "pointer",
  },
};
