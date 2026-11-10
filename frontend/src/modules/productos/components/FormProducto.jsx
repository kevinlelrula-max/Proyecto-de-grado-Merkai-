import { useState, useEffect, useRef } from "react";
import { eliminarImagenProducto } from "../services/productos.api";
import { imgUrl } from "../../../utils/imgUrl";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const UNIDADES = [
  { value: "unidad",  label: "Unidad / Pieza" },
  { value: "kg",      label: "Kilogramo (kg)" },
  { value: "gramo",   label: "Gramo (g)" },
  { value: "litro",   label: "Litro (L)" },
  { value: "ml",      label: "Mililitro (ml)" },
  { value: "metro",   label: "Metro (m)" },
  { value: "caja",    label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "docena",  label: "Docena" },
];

export default function FormProducto({ producto, onClose, onSave, unidadPredeterminada = "unidad" }) {
  const [form, setForm] = useState({
    nombre:               "",
    descripcion:          "",
    precio_costo:         "",
    ganancia_porcentaje:  "",
    precio:               "",
    precio_mayoreo:       "",
    stock:                "",
    stock_minimo:         "",
    stock_maximo:         "",
    unidad:               unidadPredeterminada,
    codigo_barras:        "",
    categoria_id:         "",
  });

  const [imagenesExistentes, setImagenesExistentes] = useState([]); // [{id, url}]
  const [imagenesNuevas, setImagenesNuevas]         = useState([]); // [{file, preview}]
  const [tab, setTab]                               = useState("basico");
  const [loadingDesc, setLoadingDesc]               = useState(false);
  const fileInputRef = useRef(null);

  const handleGenerarDescripcion = async () => {
if (!form.nombre) return;
    setLoadingDesc(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/insight/generar-descripcion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: form.nombre, precio: form.precio, unidad: form.unidad }),
      });
      const data = await res.json();
      if (data.descripcion) {
        setForm((prev) => ({ ...prev, descripcion: data.descripcion }));
      } else {
        alert("No se pudo generar la descripción: " + (data.error || "Error desconocido"));
      }
    } catch (err) {
      alert("Error al conectar con el servidor de IA: " + err.message);
    }
    setLoadingDesc(false);
  };

  useEffect(() => {
    if (producto) {
      setForm({
        nombre:               producto.nombre              || "",
        descripcion:          producto.descripcion         || "",
        precio_costo:         producto.precio_costo        || "",
        ganancia_porcentaje:  producto.ganancia_porcentaje || "",
        precio:               producto.precio              || "",
        precio_mayoreo:       producto.precio_mayoreo      || "",
        stock:                producto.stock               || "",
        stock_minimo:         producto.stock_minimo        || "",
        stock_maximo:         producto.stock_maximo        || "",
        unidad:               producto.unidad              || "unidad",
        codigo_barras:        producto.codigo_barras       || "",
        categoria_id:         producto.categoria_id        || "",
      });
      if (producto.imagenes?.length > 0) {
        setImagenesExistentes(producto.imagenes);
      } else if (producto.imagen_url) {
        setImagenesExistentes([{ id: null, url: producto.imagen_url }]);
      }
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // ✅ Calcular precio venta automáticamente desde costo + ganancia
      if (name === "precio_costo" || name === "ganancia_porcentaje") {
        const costo    = parseFloat(name === "precio_costo" ? value : prev.precio_costo) || 0;
        const ganancia = parseFloat(name === "ganancia_porcentaje" ? value : prev.ganancia_porcentaje) || 0;
        if (costo > 0 && ganancia > 0) {
          next.precio = (costo * (1 + ganancia / 100)).toFixed(2);
        }
      }

      return next;
    });
  };

  const handleAgregarImagenes = (e) => {
    const files = Array.from(e.target.files);
    const total = imagenesExistentes.length + imagenesNuevas.length + files.length;
    const permitidas = files.slice(0, Math.max(0, 8 - imagenesExistentes.length - imagenesNuevas.length));
    const nuevas = permitidas.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setImagenesNuevas(prev => [...prev, ...nuevas]);
    e.target.value = "";
  };

  const handleQuitarNueva = (idx) => {
    setImagenesNuevas(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuitarExistente = async (img, idx) => {
    if (img.id) {
      try {
        const token = localStorage.getItem("token");
        await eliminarImagenProducto(producto.id, img.id, token);
      } catch {}
    }
    setImagenesExistentes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val !== "" && val !== null && val !== undefined) {
        formData.append(key, val);
      }
    });
    imagenesNuevas.forEach(({ file }) => formData.append("imagenes", file));
    onSave(formData, producto?.id);
  };

  // ── Calcular margen visual
  const precioVenta  = parseFloat(form.precio) || 0;
  const precioCosto  = parseFloat(form.precio_costo) || 0;
  const margen       = precioCosto > 0 && precioVenta > 0
    ? (((precioVenta - precioCosto) / precioCosto) * 100).toFixed(1)
    : null;

  const TABS = [
    { key: "basico",     label: "Básico" },
    { key: "precios",    label: "Precios" },
    { key: "inventario", label: "Inventario" },
  ];

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <h3 style={s.title}>
            {producto ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              style={{
                ...s.tab,
                backgroundColor: tab === t.key ? "#2563eb" : "transparent",
                color: tab === t.key ? "white" : "#64748b",
              }}
              onClick={() => setTab(t.key)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>

          {/* ── TAB BÁSICO ── */}
          {tab === "basico" && (
            <div style={s.fields}>

              {/* Imágenes */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: 8 }}>
                  Imágenes ({imagenesExistentes.length + imagenesNuevas.length}/8)
                </label>
                <div style={s.galeriaGrid}>
                  {/* Imágenes existentes */}
                  {imagenesExistentes.map((img, i) => (
                    <div key={`ex-${i}`} style={s.thumbWrap}>
                      <img src={imgUrl(img.url)} alt="" style={s.thumb} />
                      {i === 0 && (
                        <span style={s.portadaBadge}>Portada</span>
                      )}
                      <button type="button" style={s.thumbX} onClick={() => handleQuitarExistente(img, i)}>✕</button>
                    </div>
                  ))}
                  {/* Imágenes nuevas */}
                  {imagenesNuevas.map((img, i) => (
                    <div key={`new-${i}`} style={s.thumbWrap}>
                      <img src={img.preview} alt="" style={s.thumb} />
                      {imagenesExistentes.length === 0 && i === 0 && (
                        <span style={s.portadaBadge}>Portada</span>
                      )}
                      <button type="button" style={s.thumbX} onClick={() => handleQuitarNueva(i)}>✕</button>
                    </div>
                  ))}
                  {/* Botón agregar */}
                  {imagenesExistentes.length + imagenesNuevas.length < 8 && (
                    <button type="button" style={s.thumbAgregar} onClick={() => fileInputRef.current?.click()}>
                      <span style={{ fontSize: 22 }}>+</span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>Agregar</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleAgregarImagenes}
                  style={{ display: "none" }}
                />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  Máx. 8 imágenes · JPG, PNG o WEBP · 3 MB por imagen · La primera es la portada
                </p>
              </div>

              <Field label="Nombre del producto *">
                <input style={s.input} name="nombre" placeholder="Ej: Camiseta manga corta" value={form.nombre} onChange={handleChange} required />
              </Field>

              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Descripción</label>
                  <button
                    type="button"
                    onClick={handleGenerarDescripcion}
                    disabled={!form.nombre || loadingDesc}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 7,
                      border: "1px solid rgba(37,99,235,0.25)",
                      backgroundColor: !form.nombre || loadingDesc ? "#f8fafc" : "#eff6ff",
                      color: !form.nombre || loadingDesc ? "#94a3b8" : "#2563eb",
                      fontSize: 11, fontWeight: 600, cursor: !form.nombre || loadingDesc ? "default" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 13 }}>✦</span>
                    {loadingDesc ? "Generando..." : "Generar con IA"}
                  </button>
                </div>
                <textarea style={{ ...s.input, resize: "none", height: "70px" }} name="descripcion" placeholder="Descripción breve del producto..." value={form.descripcion} onChange={handleChange} rows={3} />
              </div>

              <div style={s.row}>
                <Field label="Unidad de venta">
                  <select style={s.input} name="unidad" value={form.unidad} onChange={handleChange}>
                    {UNIDADES.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Código de barras">
                  <input style={s.input} name="codigo_barras" placeholder="Ej: 7501234567890" value={form.codigo_barras} onChange={handleChange} />
                </Field>
              </div>

            </div>
          )}

          {/* ── TAB PRECIOS ── */}
          {tab === "precios" && (
            <div style={s.fields}>

              <div style={s.row}>
                <Field label="Precio costo">
                  <div style={s.inputWrap}>
                    <span style={s.prefix}>$</span>
                    <input style={{ ...s.input, paddingLeft: "24px" }} name="precio_costo" type="number" placeholder="0" value={form.precio_costo} onChange={handleChange} min="0" />
                  </div>
                </Field>
                <Field label="Ganancia %">
                  <div style={s.inputWrap}>
                    <input style={{ ...s.input, paddingRight: "28px" }} name="ganancia_porcentaje" type="number" placeholder="20" value={form.ganancia_porcentaje} onChange={handleChange} min="0" max="1000" />
                    <span style={s.suffix}>%</span>
                  </div>
                </Field>
              </div>

              {/* Preview precio calculado */}
              {precioCosto > 0 && form.ganancia_porcentaje && (
                <div style={s.calculoBox}>
                  <span style={s.calculoLabel}>Precio calculado automáticamente</span>
                  <span style={s.calculoValor}>${parseFloat(form.precio).toLocaleString("es-CO")}</span>
                  {margen && <span style={s.calculoMargen}>Margen: {margen}%</span>}
                </div>
              )}

              <Field label="Precio de venta *">
                <div style={s.inputWrap}>
                  <span style={s.prefix}>$</span>
                  <input style={{ ...s.input, paddingLeft: "24px", fontWeight: "700" }} name="precio" type="number" placeholder="0" value={form.precio} onChange={handleChange} required min="0" />
                </div>
                <p style={s.hint}>Se calcula automáticamente desde costo + ganancia, o puedes editarlo manualmente.</p>
              </Field>

              <Field label="Precio mayoreo">
                <div style={s.inputWrap}>
                  <span style={s.prefix}>$</span>
                  <input style={{ ...s.input, paddingLeft: "24px" }} name="precio_mayoreo" type="number" placeholder="0" value={form.precio_mayoreo} onChange={handleChange} min="0" />
                </div>
                <p style={s.hint}>Precio especial para compradores mayoristas. Se usará en el sistema de precio inteligente junto con los niveles de lealtad.</p>
              </Field>

              {/* Info precio inteligente */}
              <div style={s.infoBox}>
                <span style={s.infoIcon}>💡</span>
                <p style={s.infoText}>
                  El sistema mostrará automáticamente el <strong>precio más bajo</strong> entre el precio normal, el precio mayoreo y el descuento por lealtad del cliente.
                </p>
              </div>

            </div>
          )}

          {/* ── TAB INVENTARIO ── */}
          {tab === "inventario" && (
            <div style={s.fields}>

              <Field label="Stock actual *">
                <div style={s.inputWrap}>
                  <input style={{ ...s.input, paddingRight: "60px", fontWeight: "700" }} name="stock" type="number" placeholder="0" value={form.stock} onChange={handleChange} required min="0" step="0.01" />
                  <span style={s.suffix}>{form.unidad}</span>
                </div>
              </Field>

              <div style={s.row}>
                <Field label="Stock mínimo">
                  <div style={s.inputWrap}>
                    <input style={{ ...s.input, paddingRight: "60px" }} name="stock_minimo" type="number" placeholder="0" value={form.stock_minimo} onChange={handleChange} min="0" step="0.01" />
                    <span style={s.suffix}>{form.unidad}</span>
                  </div>
                  <p style={s.hint}>Alerta cuando baje de este nivel</p>
                </Field>
                <Field label="Stock máximo">
                  <div style={s.inputWrap}>
                    <input style={{ ...s.input, paddingRight: "60px" }} name="stock_maximo" type="number" placeholder="Sin límite" value={form.stock_maximo} onChange={handleChange} min="0" step="0.01" />
                    <span style={s.suffix}>{form.unidad}</span>
                  </div>
                  <p style={s.hint}>Capacidad máxima de almacenamiento</p>
                </Field>
              </div>

              {/* Indicador visual de stock */}
              {form.stock && form.stock_minimo && form.stock_maximo && (
                <div style={s.stockIndicador}>
                  <div style={s.stockBar}>
                    <div style={{
                      ...s.stockFill,
                      width: `${Math.min((parseFloat(form.stock) / parseFloat(form.stock_maximo)) * 100, 100)}%`,
                      backgroundColor: parseFloat(form.stock) <= parseFloat(form.stock_minimo)
                        ? "#ef4444" : parseFloat(form.stock) <= parseFloat(form.stock_minimo) * 2
                        ? "#f59e0b" : "#16a34a",
                    }} />
                  </div>
                  <div style={s.stockLabels}>
                    <span style={s.stockLabelMin}>Mín: {form.stock_minimo}</span>
                    <span style={s.stockLabelActual}>Actual: {form.stock}</span>
                    <span style={s.stockLabelMax}>Máx: {form.stock_maximo}</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Botones */}
          <div style={s.btnRow}>
            <button type="button" onClick={onClose} style={s.btnCancelar}>Cancelar</button>
            <button type="submit" style={s.btnGuardar}>
              {producto ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
      <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(15,23,42,0.6)",
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 50, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "white", borderRadius: "20px",
    width: "480px", maxHeight: "90vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px 0",
  },
  title: { fontSize: "17px", fontWeight: "700", color: "#0f172a" },
  closeBtn: {
    background: "none", border: "none",
    fontSize: "16px", cursor: "pointer", color: "#94a3b8",
  },
  tabs: {
    display: "flex", gap: "4px",
    padding: "12px 24px",
    borderBottom: "1px solid #f1f5f9",
  },
  tab: {
    padding: "6px 14px", borderRadius: "8px",
    border: "none", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
    transition: "all 0.15s",
  },
  form: {
    display: "flex", flexDirection: "column",
    flex: 1, overflow: "hidden",
  },
  fields: {
    flex: 1, overflowY: "auto",
    padding: "16px 24px",
    display: "flex", flexDirection: "column", gap: "14px",
  },
  row: { display: "flex", gap: "12px" },
  input: {
    width: "100%", padding: "9px 12px",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    fontSize: "14px", color: "#0f172a",
    backgroundColor: "white", outline: "none",
    boxSizing: "border-box",
  },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  prefix: { position: "absolute", left: "10px", fontSize: "13px", color: "#94a3b8", pointerEvents: "none" },
  suffix: { position: "absolute", right: "10px", fontSize: "12px", color: "#94a3b8", pointerEvents: "none" },
  hint: { fontSize: "11px", color: "#94a3b8", marginTop: "2px" },
  galeriaGrid: {
    display: "flex", flexWrap: "wrap", gap: 8,
  },
  thumbWrap: {
    position: "relative", width: 80, height: 80, borderRadius: 10,
    overflow: "hidden", border: "1.5px solid #e2e8f0", flexShrink: 0,
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover" },
  portadaBadge: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(37,99,235,0.85)", color: "white",
    fontSize: 9, fontWeight: 700, textAlign: "center", padding: "2px 0",
  },
  thumbX: {
    position: "absolute", top: 3, right: 3,
    width: 18, height: 18, borderRadius: "50%",
    backgroundColor: "rgba(15,23,42,0.7)", color: "white",
    border: "none", cursor: "pointer", fontSize: 9,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  thumbAgregar: {
    width: 80, height: 80, borderRadius: 10,
    border: "1.5px dashed #cbd5e1", backgroundColor: "#f8fafc",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 2,
    cursor: "pointer", color: "#94a3b8",
  },
  calculoBox: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 16px", backgroundColor: "#eff6ff",
    borderRadius: "10px", border: "1px solid #bfdbfe",
  },
  calculoLabel: { fontSize: "12px", color: "#64748b", flex: 1 },
  calculoValor: { fontSize: "20px", fontWeight: "800", color: "#2563eb" },
  calculoMargen: { fontSize: "12px", fontWeight: "600", color: "#2563eb", backgroundColor: "#dbeafe", padding: "3px 8px", borderRadius: "999px" },
  infoBox: {
    display: "flex", alignItems: "flex-start", gap: "10px",
    padding: "12px 14px", backgroundColor: "#fffbeb",
    borderRadius: "10px", border: "1px solid #fde68a",
  },
  infoIcon: { fontSize: "16px", flexShrink: 0 },
  infoText: { fontSize: "12px", color: "#92400e", lineHeight: "1.6" },
  stockIndicador: { display: "flex", flexDirection: "column", gap: "6px" },
  stockBar: { height: "8px", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" },
  stockFill: { height: "100%", borderRadius: "999px", transition: "width 0.3s ease" },
  stockLabels: { display: "flex", justifyContent: "space-between" },
  stockLabelMin: { fontSize: "11px", color: "#ef4444" },
  stockLabelActual: { fontSize: "11px", fontWeight: "600", color: "#0f172a" },
  stockLabelMax: { fontSize: "11px", color: "#64748b" },
  btnRow: {
    display: "flex", gap: "10px",
    padding: "16px 24px",
    borderTop: "1px solid #f1f5f9",
  },
  btnCancelar: {
    flex: 1, padding: "10px",
    background: "transparent", border: "1.5px solid #e2e8f0",
    borderRadius: "10px", fontSize: "14px",
    color: "#64748b", cursor: "pointer", fontWeight: "500",
  },
  btnGuardar: {
    flex: 2, padding: "10px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "14px", fontWeight: "700", cursor: "pointer",
  },
};