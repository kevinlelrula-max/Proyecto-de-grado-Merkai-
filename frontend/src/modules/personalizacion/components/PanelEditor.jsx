import { useRef, useState } from "react";
import ModalPlantillas from "./ModalPlantillas";
import ModalDisenoIA from "./ModalDisenoIA";
import IconoChispas from "./IconoChispas";
import { imgUrl } from "../../../utils/imgUrl";

const TIPOS_INFO = {
  hero:        { label: "Portada",               icon: "▣", fija: true,  desc: "Banner y título principal" },
  catalogo:    { label: "Catálogo",              icon: "⊞", fija: true,  desc: "Productos disponibles" },
  nosotros:    { label: "Sobre nosotros",        icon: "◎", fija: false, desc: "Historia de tu negocio" },
  contacto:    { label: "Contacto & Redes",      icon: "◈", fija: true,  desc: "Info y redes sociales" },
  texto_libre: { label: "Bloque de texto",       icon: "❑", fija: false, desc: "Texto personalizable" },
  faq:         { label: "Preguntas frecuentes",  icon: "◉", fija: false, desc: "Responde dudas comunes" },
  galeria:     { label: "Galería",               icon: "▦", fija: false, desc: "Imágenes de tu negocio" },
  testimonios: { label: "Testimonios",           icon: "◈", fija: false, desc: "Reseñas de tus clientes" },
  promociones: { label: "Promociones",           icon: "◇", fija: false, desc: "Cupones activos" },
};

const FUENTES = [
  { value: "Inter",             label: "Inter (Moderna)" },
  { value: "Poppins",           label: "Poppins (Redondeada)" },
  { value: "Montserrat",        label: "Montserrat (Elegante)" },
  { value: "Playfair Display",  label: "Playfair (Clásica)" },
];

const TIPOS_AGREGABLES = [
  { tipo: "texto_libre", label: "Bloque de texto",       desc: "Título + texto libre, color de fondo personalizable" },
  { tipo: "nosotros",    label: "Sobre nosotros",        desc: "Presenta tu negocio a los clientes" },
  { tipo: "faq",         label: "Preguntas frecuentes",  desc: "Preguntas y respuestas de tus clientes" },
  { tipo: "galeria",     label: "Galería de imágenes",   desc: "Muestra fotos de tu negocio o productos" },
  { tipo: "promociones", label: "Promociones",           desc: "Cupones y descuentos activos" },
];

export default function PanelEditor({
  datos, bannerPreview, layout,
  seccionActiva, setSeccionActiva,
  onChange, onBannerChange,
  onLayoutChange, onToggleSeccion, onDeleteSeccion, onAddSeccion, onSeccionConfigChange,
  onAplicarPlantilla,
  guardando, exito, error, onGuardar,
  ocultarHeader,
}) {
  const bannerRef      = useRef(null);
  const [draggingIdx, setDraggingIdx]     = useState(null);
  const [dragOverIdx, setDragOverIdx]     = useState(null);
  const [showAgregar, setShowAgregar]     = useState(false);
  const [showPlantillas, setShowPlantillas] = useState(false);
  const [showDisenoIA, setShowDisenoIA]   = useState(false);

  const bannerSrc = bannerPreview?.startsWith("data:")
    ? bannerPreview
    : imgUrl(bannerPreview) || null;

  function onDragStart(e, idx) { setDraggingIdx(idx); e.dataTransfer.effectAllowed = "move"; }
  function onDragOver(e, idx)  { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIdx(idx); }
  function onDrop(e, idx) {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === idx) return;
    const copia = [...layout];
    const [moved] = copia.splice(draggingIdx, 1);
    copia.splice(idx, 0, moved);
    onLayoutChange(copia);
    setDraggingIdx(null); setDragOverIdx(null);
  }
  function onDragEnd() { setDraggingIdx(null); setDragOverIdx(null); }

  const seccionSeleccionada = layout.find(s => s.id === seccionActiva);

  return (
    <div style={s.panel}>

      {!ocultarHeader && (
        <div style={s.header}>
          <div>
            <div style={s.headerTitle}>Editor de tienda</div>
            <div style={s.headerSub}>Arrastra para reordenar secciones</div>
          </div>
          <button
            onClick={onGuardar}
            disabled={guardando}
            style={{
              ...s.btnGuardar,
              background: exito
                ? "#10b981"
                : guardando
                ? "#94a3b8"
                : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              cursor: guardando ? "not-allowed" : "pointer",
            }}
          >
            {guardando ? "Guardando..." : exito ? "✓ Publicado" : "Publicar"}
          </button>
        </div>
      )}

      {error && <div style={s.errorMsg}>{error}</div>}

      {/* IA + Plantillas */}
      <div style={{ padding: "10px 14px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button style={s.btnDisenoIA} onClick={() => setShowDisenoIA(true)}>
          <IconoChispas size={16} />
          Diseñar con IA
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={s.seccionesLabel2}>Secciones</span>
          <button style={s.plantillasBtn} onClick={() => setShowPlantillas(true)}>
            Plantillas
          </button>
        </div>
      </div>

      {showDisenoIA && (
        <ModalDisenoIA
          onCerrar={() => setShowDisenoIA(false)}
          onAplicar={(plantilla) => {
            onAplicarPlantilla(plantilla);
            setSeccionActiva(null);
          }}
        />
      )}

      {showPlantillas && (
        <ModalPlantillas
          onCerrar={() => setShowPlantillas(false)}
          onAplicar={(plantilla) => {
            onAplicarPlantilla(plantilla);
            setSeccionActiva(null);
          }}
        />
      )}

      <div style={s.lista}>
        {layout.map((sec, idx) => {
          const info      = TIPOS_INFO[sec.tipo] || TIPOS_INFO.texto_libre;
          const activo    = seccionActiva === sec.id;
          const isDragging = draggingIdx === idx;
          const isDragOver = dragOverIdx === idx;
          return (
            <div
              key={sec.id}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
              style={{
                ...s.seccionItem,
                opacity: isDragging ? 0.4 : 1,
                borderColor: isDragOver
                  ? "#2563eb"
                  : activo
                  ? "rgba(37,99,235,0.35)"
                  : "#e2e8f0",
                background: isDragOver
                  ? "rgba(37,99,235,0.06)"
                  : activo
                  ? "#eff6ff"
                  : "white",
              }}
            >
              <div style={s.dragHandle} title="Arrastra para mover">⠿</div>
              <button
                onClick={() => onToggleSeccion(sec.id)}
                style={{ ...s.eyeBtn, opacity: sec.visible ? 1 : 0.4 }}
                title={sec.visible ? "Ocultar sección" : "Mostrar sección"}
              >
                {sec.visible ? "◉" : "◌"}
              </button>
              <button
                onClick={() => setSeccionActiva(activo ? null : sec.id)}
                style={s.seccionNombreBtn}
              >
                <span style={{ ...s.seccionIconWrap, background: activo ? "rgba(37,99,235,0.1)" : "#f1f5f9", color: activo ? "#2563eb" : "#64748b" }}>
                  {info.icon}
                </span>
                <div>
                  <div style={{ ...s.seccionLabel, color: activo ? "#2563eb" : "#0f172a" }}>
                    {info.label}
                  </div>
                  {!sec.visible && <div style={s.ocultaTag}>Oculta</div>}
                </div>
              </button>
              <button
                onClick={() => setSeccionActiva(activo ? null : sec.id)}
                style={{ ...s.chevronBtn, color: activo ? "#2563eb" : "#94a3b8" }}
              >
                {activo ? "▲" : "▾"}
              </button>
              {!info.fija && (
                <button
                  onClick={() => { onDeleteSeccion(sec.id); if (activo) setSeccionActiva(null); }}
                  style={s.deleteBtn}
                  title="Eliminar sección"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Agregar bloque */}
      <div style={{ padding: "10px 14px", position: "relative" }}>
        <button onClick={() => setShowAgregar(v => !v)} style={s.btnAgregar}>
          + Agregar bloque
        </button>
        {showAgregar && (
          <div style={s.agregarMenu}>
            {TIPOS_AGREGABLES.map(op => {
              const info     = TIPOS_INFO[op.tipo];
              const yaExiste = op.tipo !== "texto_libre" && layout.some(s => s.tipo === op.tipo);
              return (
                <button
                  key={op.tipo}
                  disabled={yaExiste}
                  onClick={() => {
                    if (!yaExiste) {
                      onAddSeccion(op.tipo);
                      setShowAgregar(false);
                      setSeccionActiva(`${op.tipo}_${Date.now()}`);
                    }
                  }}
                  style={{ ...s.agregarItem, opacity: yaExiste ? 0.4 : 1, cursor: yaExiste ? "not-allowed" : "pointer" }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, color: "#64748b", fontFamily: "monospace" }}>{info?.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{op.label}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{op.desc}</div>
                    {yaExiste && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 2 }}>Ya existe en tu tienda</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={s.divider} />

      {/* Config de sección activa */}
      {seccionSeleccionada ? (
        <div style={s.configArea}>
          <div style={s.configTitulo}>
            <span style={{ color: "#2563eb", marginRight: 6 }}>{TIPOS_INFO[seccionSeleccionada.tipo]?.icon}</span>
            {TIPOS_INFO[seccionSeleccionada.tipo]?.label}
          </div>
          <ConfigSeccion
            seccion={seccionSeleccionada}
            datos={datos}
            bannerSrc={bannerSrc}
            bannerRef={bannerRef}
            onChange={onChange}
            onBannerChange={onBannerChange}
            onSeccionConfigChange={onSeccionConfigChange}
          />
          <input
            ref={bannerRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onBannerChange(f); }}
          />
        </div>
      ) : (
        <div style={s.emptyConfig}>
          <span style={{ fontSize: 22, opacity: 0.3 }}>↑</span>
          <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            Selecciona una sección para editarla
          </span>
        </div>
      )}
    </div>
  );
}

// ── Config por tipo de sección ───────────────────────────────────────────────
function ConfigSeccion({ seccion, datos, bannerSrc, bannerRef, onChange, onBannerChange, onSeccionConfigChange }) {
  const cfg = (campo, valor) => onSeccionConfigChange(seccion.id, campo, valor);

  if (seccion.tipo === "hero") return (
    <div style={f.wrap}>
      <Field label="Variante de diseño">
        <select value={seccion.config?.variante || "oscuro"} onChange={e => cfg("variante", e.target.value)} style={f.input}>
          <option value="oscuro">Oscuro</option>
          <option value="lateral">Imagen a un lado</option>
          <option value="minimalista">Minimalista</option>
          <option value="revista">Estilo revista</option>
          <option value="negrita">Tipografía en grande</option>
          <option value="gradiente">Con gradiente</option>
        </select>
      </Field>
      <Field label="Color principal">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={datos.color_primario || "#2563eb"}
            onChange={e => onChange("color_primario", e.target.value)} style={f.colorInput} />
          <input type="text" value={datos.color_primario || ""} placeholder="#2563eb"
            onChange={e => onChange("color_primario", e.target.value)} style={f.input} />
        </div>
      </Field>
      <Field label="Color secundario">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={datos.color_secundario || "#0B1628"}
            onChange={e => onChange("color_secundario", e.target.value)} style={f.colorInput} />
          <input type="text" value={datos.color_secundario || ""} placeholder="#0B1628"
            onChange={e => onChange("color_secundario", e.target.value)} style={f.input} />
        </div>
        <div style={f.hint}>Para el navbar y el footer de la tienda</div>
      </Field>
      <Field label="Banner de fondo">
        <div onClick={() => bannerRef.current?.click()} style={f.bannerUpload}>
          {bannerSrc
            ? <img src={bannerSrc} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8 }} />
            : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 24, lineHeight: 1, color: "#cbd5e1" }}>▣</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Clic para subir (1200 × 400 px)</span>
              </div>
            )
          }
        </div>
      </Field>
      <Field label="Descripción breve">
        <textarea value={datos.descripcion || ""} onChange={e => onChange("descripcion", e.target.value)}
          placeholder="Una línea que describe tu negocio..." rows={2} style={f.textarea} />
      </Field>
      <Field label="Título principal">
        <input type="text" value={datos.hero_titulo || ""} onChange={e => onChange("hero_titulo", e.target.value)}
          placeholder="Bienvenido a nuestra tienda" style={f.input} />
      </Field>
      <Field label="Subtítulo">
        <input type="text" value={datos.hero_subtitulo || ""} onChange={e => onChange("hero_subtitulo", e.target.value)}
          placeholder="Calidad garantizada" style={f.input} />
      </Field>
      <Field label="Texto del botón">
        <input type="text" value={datos.hero_btn_texto || ""} onChange={e => onChange("hero_btn_texto", e.target.value)}
          placeholder="Ver catálogo" style={f.input} />
      </Field>
      <Field label="Tipografía">
        <select value={datos.fuente || "Inter"} onChange={e => onChange("fuente", e.target.value)} style={f.input}>
          {FUENTES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
        </select>
        <div style={f.hint}>Se usa en todos los textos de tu tienda</div>
      </Field>
      <Field label="Horario de atención">
        <input type="text" value={datos.horario || ""} onChange={e => onChange("horario", e.target.value)}
          placeholder="Lun – Sáb: 7am – 6pm" style={f.input} />
      </Field>
    </div>
  );

  if (seccion.tipo === "catalogo") return (
    <div style={f.wrap}>
      <div style={f.infoBox}>
        Tus productos aparecen aquí automáticamente. Para editarlos ve a <strong style={{ color: "#2563eb" }}>Productos</strong>.
      </div>
      <Field label="Estilo de tarjetas">
        <select value={seccion.config?.estilo_tarjeta || "estandar"} onChange={e => cfg("estilo_tarjeta", e.target.value)} style={f.input}>
          <option value="estandar">Estándar</option>
          <option value="minimalista">Minimalista</option>
          <option value="oscuro">Fondo oscuro</option>
          <option value="boutique">Boutique</option>
          <option value="horizontal">Horizontal</option>
        </select>
        <div style={f.hint}>Aplica en inicio y catálogo</div>
      </Field>
      <Field label="Productos destacados en inicio">
        <select value={datos.productos_destacados_cantidad || 4} onChange={e => onChange("productos_destacados_cantidad", Number(e.target.value))} style={f.input}>
          <option value={4}>4 productos</option>
          <option value={6}>6 productos</option>
          <option value={8}>8 productos</option>
        </select>
        <div style={f.hint}>Aparecen en la portada de tu tienda</div>
      </Field>
    </div>
  );

  if (seccion.tipo === "nosotros") return (
    <div style={f.wrap}>
      <Field label="Título de la sección">
        <input type="text" value={datos.nosotros_titulo || ""} onChange={e => onChange("nosotros_titulo", e.target.value)}
          placeholder="¿Quiénes somos?" style={f.input} />
      </Field>
      <Field label="Contenido">
        <textarea value={datos.nosotros_contenido || ""} onChange={e => onChange("nosotros_contenido", e.target.value)}
          placeholder="Cuénta quiénes son, qué los hace especiales..." rows={5} style={f.textarea} />
      </Field>
    </div>
  );

  if (seccion.tipo === "texto_libre") return (
    <div style={f.wrap}>
      <Field label="Título">
        <input type="text" value={seccion.config?.titulo || ""} onChange={e => cfg("titulo", e.target.value)}
          placeholder="Ej: Oferta especial" style={f.input} />
      </Field>
      <Field label="Contenido">
        <textarea value={seccion.config?.contenido || ""} onChange={e => cfg("contenido", e.target.value)}
          placeholder="Escribe aquí el texto..." rows={4} style={f.textarea} />
      </Field>
      <Field label="Color de fondo">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={seccion.config?.color_fondo || "#ffffff"}
            onChange={e => cfg("color_fondo", e.target.value)} style={f.colorInput} />
          <input type="text" value={seccion.config?.color_fondo || "#ffffff"}
            onChange={e => cfg("color_fondo", e.target.value)} style={f.input} />
        </div>
      </Field>
      <Field label="Color de texto">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="color" value={seccion.config?.color_texto || "#0f172a"}
            onChange={e => cfg("color_texto", e.target.value)} style={f.colorInput} />
          <input type="text" value={seccion.config?.color_texto || "#0f172a"}
            onChange={e => cfg("color_texto", e.target.value)} style={f.input} />
        </div>
      </Field>
      <Field label="Alineación del texto">
        <div style={{ display: "flex", gap: 6 }}>
          {["left", "center", "right"].map(al => (
            <button key={al} onClick={() => cfg("alineacion", al)}
              style={{
                ...f.alineBtn,
                background: (seccion.config?.alineacion || "center") === al ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${(seccion.config?.alineacion || "center") === al ? "#2563eb" : "#e2e8f0"}`,
                color: (seccion.config?.alineacion || "center") === al ? "#2563eb" : "#64748b",
              }}>
              {{ left: "←", center: "↔", right: "→" }[al]}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );

  if (seccion.tipo === "faq") {
    const preguntas = seccion.config?.preguntas || [];
    const addPregunta = () => cfg("preguntas", [...preguntas, { pregunta: "", respuesta: "" }]);
    const updatePregunta = (idx, campo, valor) => {
      const copia = [...preguntas];
      copia[idx] = { ...copia[idx], [campo]: valor };
      cfg("preguntas", copia);
    };
    const removePregunta = (idx) => cfg("preguntas", preguntas.filter((_, i) => i !== idx));
    return (
      <div style={f.wrap}>
        {preguntas.map((p, i) => (
          <div key={i} style={f.itemCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={f.itemLabel}>Pregunta {i + 1}</span>
              <button onClick={() => removePregunta(i)} style={f.removeBtn}>✕</button>
            </div>
            <input style={{ ...f.input, marginBottom: 6 }} placeholder="¿Cuál es la pregunta?" value={p.pregunta} onChange={e => updatePregunta(i, "pregunta", e.target.value)} />
            <textarea style={f.textarea} placeholder="Escribe la respuesta..." value={p.respuesta} onChange={e => updatePregunta(i, "respuesta", e.target.value)} rows={2} />
          </div>
        ))}
        <button onClick={addPregunta} style={f.addRowBtn}>
          + Agregar pregunta
        </button>
      </div>
    );
  }

  if (seccion.tipo === "galeria") {
    const imagenes = seccion.config?.imagenes || [];
    const addImagen = () => cfg("imagenes", [...imagenes, { url: "", titulo: "" }]);
    const updateImagen = (idx, campo, valor) => {
      const copia = [...imagenes];
      copia[idx] = { ...copia[idx], [campo]: valor };
      cfg("imagenes", copia);
    };
    const removeImagen = (idx) => cfg("imagenes", imagenes.filter((_, i) => i !== idx));
    return (
      <div style={f.wrap}>
        <div style={f.infoBox}>
          Muestra fotos de tu local, equipo o productos. Pega la URL de cada imagen.
        </div>
        {imagenes.map((img, i) => (
          <div key={i} style={f.itemCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={f.itemLabel}>Imagen {i + 1}</span>
              <button onClick={() => removeImagen(i)} style={f.removeBtn}>✕</button>
            </div>
            <input style={{ ...f.input, marginBottom: 6 }} placeholder="URL de la imagen" value={img.url} onChange={e => updateImagen(i, "url", e.target.value)} />
            <input style={f.input} placeholder="Título (opcional)" value={img.titulo} onChange={e => updateImagen(i, "titulo", e.target.value)} />
          </div>
        ))}
        <button onClick={addImagen} style={f.addRowBtn}>
          + Agregar imagen
        </button>
      </div>
    );
  }

  if (seccion.tipo === "testimonios") return (
    <div style={f.wrap}>
      <div style={f.infoBox}>
        Las mejores reseñas de tus clientes aparecen aquí solas. Gestiónalas desde <strong style={{ color: "#2563eb" }}>Reseñas</strong>.
      </div>
    </div>
  );

  if (seccion.tipo === "promociones") return (
    <div style={f.wrap}>
      <div style={f.infoBox}>
        Tus cupones activos aparecen aquí solos. Créalos o edítalos desde <strong style={{ color: "#2563eb" }}>Cupones</strong>.
      </div>
    </div>
  );

  if (seccion.tipo === "contacto") return (
    <div style={f.wrap}>
      <Field label="Teléfono">
        <input type="text" value={datos.telefono || ""} onChange={e => onChange("telefono", e.target.value)}
          placeholder="+57 300 123 4567" style={f.input} />
      </Field>
      <Field label="Email">
        <input type="email" value={datos.email || ""} onChange={e => onChange("email", e.target.value)}
          placeholder="contacto@mitienda.com" style={f.input} />
      </Field>
      <Field label="Dirección">
        <input type="text" value={datos.direccion || ""} onChange={e => onChange("direccion", e.target.value)}
          placeholder="Cra. 5 #12-30, Bogotá" style={f.input} />
      </Field>
      <div style={f.sectionDivider}>Redes sociales</div>
      <Field label="WhatsApp">
        <input type="text" value={datos.whatsapp || ""} onChange={e => onChange("whatsapp", e.target.value)}
          placeholder="57 300 123 4567" style={f.input} />
      </Field>
      <Field label="Instagram">
        <input type="text" value={datos.instagram || ""} onChange={e => onChange("instagram", e.target.value)}
          placeholder="@tupesquera" style={f.input} />
      </Field>
      <Field label="Facebook">
        <input type="text" value={datos.facebook || ""} onChange={e => onChange("facebook", e.target.value)}
          placeholder="tupesquera" style={f.input} />
      </Field>
      <div style={f.sectionDivider}>Footer</div>
      <Field label="Texto personalizado del footer">
        <input type="text" value={datos.footer_texto || ""} onChange={e => onChange("footer_texto", e.target.value)}
          placeholder="Ej: Todos los derechos reservados" style={f.input} maxLength={200} />
        <div style={f.hint}>Aparece al final de tu tienda</div>
      </Field>
    </div>
  );

  return null;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const s = {
  panel: {
    width: "100%",
    background: "white",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    height: "100%",
  },
  header: {
    padding: "16px 14px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexShrink: 0,
  },
  headerTitle:  { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  headerSub:    { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  btnGuardar:   { padding: "8px 16px", border: "none", borderRadius: 9, color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all 0.2s" },
  errorMsg:     { margin: "0 14px 8px", padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#b91c1c" },
  seccionesLabel2: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" },
  plantillasBtn: { fontSize: 11, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, padding: "4px 10px", cursor: "pointer" },
  btnDisenoIA:  { width: "100%", padding: "10px 0", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, letterSpacing: "0.01em" },
  lista:        { padding: "0 10px", display: "flex", flexDirection: "column", gap: 3 },
  seccionItem:  { display: "flex", alignItems: "center", gap: 6, padding: "7px 8px", borderRadius: 10, border: "1px solid", cursor: "default", transition: "all 0.15s", userSelect: "none" },
  dragHandle:   { color: "#cbd5e1", fontSize: 16, cursor: "grab", flexShrink: 0, lineHeight: 1 },
  eyeBtn:       { background: "none", border: "none", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: 0, lineHeight: 1, color: "#94a3b8" },
  seccionNombreBtn: { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left", padding: 0, minWidth: 0 },
  seccionIconWrap:  { fontSize: 14, width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", fontFamily: "monospace" },
  seccionLabel: { fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
  ocultaTag:    { fontSize: 10, color: "#f59e0b", marginTop: 2 },
  chevronBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "0 4px", flexShrink: 0 },
  deleteBtn:    { background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#ef4444", padding: "2px 4px", flexShrink: 0, opacity: 0.6, lineHeight: 1 },
  btnAgregar:   { width: "100%", padding: "9px 0", background: "#f8fafc", border: "1px dashed #bfdbfe", borderRadius: 9, color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  agregarMenu:  { position: "absolute", top: "calc(100% - 4px)", left: 14, right: 14, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 50, overflow: "hidden" },
  agregarItem:  { display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", background: "none", border: "none", width: "100%", textAlign: "left", borderBottom: "1px solid #f1f5f9" },
  divider:      { height: 1, background: "#f1f5f9", margin: "6px 0", flexShrink: 0 },
  configArea:   { padding: "0 14px 24px", flex: 1, overflowY: "auto" },
  configTitulo: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 0 10px", borderBottom: "1px solid #f1f5f9", marginBottom: 16, display: "flex", alignItems: "center" },
  emptyConfig:  { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 30 },
};

const f = {
  wrap:       { display: "flex", flexDirection: "column" },
  input:      { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea:   { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f172a", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.5 },
  colorInput: { width: 36, height: 32, borderRadius: 7, border: "1px solid #e2e8f0", padding: 2, cursor: "pointer", background: "none", flexShrink: 0 },
  bannerUpload: { border: "2px dashed #e2e8f0", borderRadius: 9, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", background: "#fafafa", transition: "border-color 0.15s" },
  alineBtn:   { flex: 1, padding: "6px 0", borderRadius: 7, fontSize: 16, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" },
  infoBox:    { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 14 },
  hint:       { fontSize: 10, color: "#94a3b8", marginTop: 4 },
  sectionDivider: { fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "14px 0 10px", borderTop: "1px solid #f1f5f9", paddingTop: 12 },
  itemCard:   { padding: "12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", marginBottom: 8 },
  itemLabel:  { fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" },
  removeBtn:  { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, opacity: 0.7 },
  addRowBtn:  { width: "100%", padding: "9px 0", background: "white", border: "1px dashed #bfdbfe", borderRadius: 8, color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center" },
};
