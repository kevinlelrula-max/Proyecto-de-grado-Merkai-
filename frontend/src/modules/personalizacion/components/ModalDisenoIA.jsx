import { useEffect, useRef, useState } from "react";
import IconoChispas from "./IconoChispas";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "token";

const EJEMPLOS = [
  { tag: "Pescadería", texto: "Pescadería familiar con productos frescos del mar, delivery a domicilio" },
  { tag: "Ropa deportiva", texto: "Tienda de ropa deportiva para jóvenes, colores vibrantes y energéticos" },
  { tag: "Panadería", texto: "Panadería artesanal con panes y tortas, ambiente cálido y familiar" },
  { tag: "Tecnología", texto: "Tienda de tecnología y accesorios, diseño moderno y minimalista" },
  { tag: "Floristería", texto: "Floristería con arreglos personalizados, colores suaves y elegantes" },
  { tag: "Comida rápida", texto: "Restaurante de comida rápida, menú variado y precios accesibles" },
];

const MENSAJES_CARGA = [
  "Analizando tu negocio",
  "Eligiendo colores y tipografía",
  "Redactando los textos de tu tienda",
  "Armando las secciones",
];

const VARIANTE_LABELS = {
  oscuro: "Oscuro", lateral: "Panel lateral", minimalista: "Minimalista",
  revista: "Revista", negrita: "Negrita", gradiente: "Gradiente",
};
const TARJETA_LABELS = {
  estandar: "Estándar", minimalista: "Minimalista",
  oscuro: "Oscura", boutique: "Boutique", horizontal: "Horizontal",
};
const SECCION_LABELS = {
  nosotros: "Sobre nosotros", faq: "Preguntas frecuentes",
  galeria: "Galería", testimonios: "Testimonios",
};

const PASOS = [
  { id: "input", etiqueta: "Describe" },
  { id: "loading", etiqueta: "Generando" },
  { id: "preview", etiqueta: "Revisa" },
];

function convertirAPlantilla(diseno) {
  const seccionesBase = [
    { tipo: "hero",     config: { variante: diseno.hero_variante || "oscuro" } },
    { tipo: "catalogo", config: { estilo_tarjeta: diseno.estilo_tarjeta || "estandar" } },
  ];
  const seccionesExtra = (diseno.secciones_extra || [])
    .filter(t => ["nosotros", "faq", "galeria", "testimonios"].includes(t))
    .map(tipo => ({ tipo, config: {} }));
  return {
    color_primario:     diseno.color_primario,
    color_secundario:   diseno.color_secundario,
    fuente:             diseno.fuente,
    hero_titulo:        diseno.hero_titulo,
    hero_subtitulo:     diseno.hero_subtitulo,
    hero_btn_texto:     diseno.hero_btn_texto,
    nosotros_titulo:    diseno.nosotros_titulo,
    nosotros_contenido: diseno.nosotros_contenido,
    horario:            diseno.horario || "",
    footer_texto:       "",
    secciones: [...seccionesBase, ...seccionesExtra, { tipo: "contacto", config: {} }],
  };
}

// Texto blanco u oscuro según el brillo del color de fondo
function textoSobre(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const luz = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luz > 0.62 ? "#0f172a" : "#ffffff";
}

function IconoCheck({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function ModalDisenoIA({ onCerrar, onAplicar }) {
  const [paso, setPaso]               = useState("input"); // input | loading | preview
  const [descripcion, setDescripcion] = useState("");
  const [diseno, setDiseno]           = useState(null);
  const [error, setError]             = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [mensajeIdx, setMensajeIdx]   = useState(0);
  const areaRef = useRef(null);

  const puedeGenerar = descripcion.trim().length > 0;

  useEffect(() => {
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  useEffect(() => {
    if (paso !== "loading") return;
    setMensajeIdx(0);
    const t = setInterval(() => setMensajeIdx(i => Math.min(i + 1, MENSAJES_CARGA.length - 1)), 2200);
    return () => clearInterval(t);
  }, [paso]);

  useEffect(() => { if (paso === "input") areaRef.current?.focus(); }, [paso]);

  const handleGenerar = async () => {
    if (!puedeGenerar) return;
    setPaso("loading");
    setError(null);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/insight/generar-diseno`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ descripcion }),
      });
      if (!res.ok) throw new Error("No se pudo generar el diseño");
      const data = await res.json();
      setDiseno(data);
      setPaso("preview");
    } catch (err) {
      setError(err.message);
      setPaso("input");
    }
  };

  const handleAplicar = () => {
    if (!confirmando) { setConfirmando(true); return; }
    onAplicar(convertirAPlantilla(diseno));
    onCerrar();
  };

  const volver = () => { setPaso("input"); setConfirmando(false); };
  const pasoIdx = PASOS.findIndex(p => p.id === paso);

  const heroTxt = diseno ? textoSobre(diseno.color_secundario) : "#fff";
  const btnTxt  = diseno ? textoSobre(diseno.color_primario) : "#fff";
  const fuente  = diseno?.fuente ? `'${diseno.fuente}', 'Segoe UI', sans-serif` : "inherit";

  return (
    <div className="mia-overlay" onClick={onCerrar}>
      <div className="mia-modal" role="dialog" aria-modal="true" aria-labelledby="mia-titulo" onClick={e => e.stopPropagation()}>

        {/* Encabezado */}
        <div className="mia-header">
          <div className="mia-icono"><IconoChispas size={20} /></div>
          <div className="mia-header-texto">
            <div id="mia-titulo" className="mia-titulo">Diseñar tienda con IA</div>
            <div className="mia-subtitulo">Describe tu negocio y la IA crea un diseño a tu medida</div>
          </div>
          <button type="button" className="mia-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>

        {/* Pasos */}
        <ol className="mia-pasos" aria-label="Progreso">
          {PASOS.map((p, i) => {
            const estado = i < pasoIdx ? "hecho" : i === pasoIdx ? "activo" : "pendiente";
            return (
              <li key={p.id} className={`mia-paso mia-paso-${estado}`} aria-current={estado === "activo" ? "step" : undefined}>
                <span className="mia-paso-punto">{estado === "hecho" ? <IconoCheck size={12} /> : i + 1}</span>
                <span className="mia-paso-nombre">{p.etiqueta}</span>
              </li>
            );
          })}
        </ol>

        {/* ── Paso 1: descripción ── */}
        {paso === "input" && (
          <>
            <div className="mia-cuerpo">
              <label htmlFor="mia-descripcion" className="mia-label">Cuéntanos sobre tu negocio</label>
              <textarea
                id="mia-descripcion"
                ref={areaRef}
                className="mia-textarea"
                placeholder="Ej: Tengo una pescadería familiar, vendemos productos del mar frescos y hacemos entregas a domicilio. Me gustan los colores azul y verde…"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleGenerar(); }}
                rows={5}
              />
              <div className="mia-ayuda">
                <span>Incluye qué vendes, tu estilo y los colores que prefieres.</span>
                <span>{descripcion.trim().length} caracteres</span>
              </div>

              {error && <div className="mia-error" role="alert">{error}. Intenta de nuevo.</div>}

              <div className="mia-label mia-label-sec">O parte de una idea</div>
              <div className="mia-ejemplos">
                {EJEMPLOS.map(ej => (
                  <button type="button" key={ej.tag} className="mia-ejemplo" onClick={() => { setDescripcion(ej.texto); areaRef.current?.focus(); }}>
                    <span className="mia-ejemplo-tag">{ej.tag}</span>
                    <span className="mia-ejemplo-texto">{ej.texto}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mia-pie">
              <span className="mia-atajo">Ctrl + Enter para generar</span>
              <button type="button" className="mia-btn mia-btn-primario" onClick={handleGenerar} disabled={!puedeGenerar}>
                <IconoChispas size={16} /> Generar diseño
              </button>
            </div>
          </>
        )}

        {/* ── Paso 2: generando ── */}
        {paso === "loading" && (
          <div className="mia-cuerpo mia-carga" aria-live="polite">
            <div className="mia-orbe"><span /><IconoChispas size={26} /></div>
            <p className="mia-carga-titulo">Creando tu diseño…</p>
            <p className="mia-carga-desc">Esto toma unos segundos. La IA está pensando en la identidad de tu tienda.</p>
            <ul className="mia-carga-lista">
              {MENSAJES_CARGA.map((m, i) => (
                <li key={m} className={i < mensajeIdx ? "hecho" : i === mensajeIdx ? "activo" : ""}>
                  <span className="mia-carga-marca">{i < mensajeIdx ? <IconoCheck size={11} /> : null}</span>{m}
                </li>
              ))}
            </ul>
            <div className="mia-barra"><span /></div>
          </div>
        )}

        {/* ── Paso 3: revisión ── */}
        {paso === "preview" && diseno && (
          <>
            <div className="mia-cuerpo">
              <div className="mia-revision">
                {/* Vista previa de la tienda */}
                <div className="mia-ventana" aria-label="Vista previa de la tienda">
                  <div className="mia-ventana-barra">
                    <i /><i /><i /><span>tu-tienda.merkai.com</span>
                  </div>
                  <div className="mia-sitio" style={{ fontFamily: fuente }}>
                    <div className="mia-sitio-nav">
                      <b style={{ background: diseno.color_primario }} />
                      <em />
                      <u style={{ background: diseno.color_primario }} />
                    </div>
                    <div className="mia-sitio-hero" style={{ background: diseno.color_secundario, color: heroTxt }}>
                      <div className="mia-sitio-titulo">{diseno.hero_titulo}</div>
                      <div className="mia-sitio-sub" style={{ opacity: 0.72 }}>{diseno.hero_subtitulo}</div>
                      <span className="mia-sitio-btn" style={{ background: diseno.color_primario, color: btnTxt }}>{diseno.hero_btn_texto}</span>
                    </div>
                    <div className="mia-sitio-fila">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="mia-sitio-tarjeta" style={{ borderTopColor: diseno.color_primario }}>
                          <span /><span />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detalles */}
                <div className="mia-detalles">
                  <div className="mia-ficha">
                    <div className="mia-ficha-label">Paleta</div>
                    <div className="mia-paleta">
                      <div><i style={{ background: diseno.color_primario }} /><span>Principal<br /><b>{diseno.color_primario}</b></span></div>
                      <div><i style={{ background: diseno.color_secundario }} /><span>Secundario<br /><b>{diseno.color_secundario}</b></span></div>
                    </div>
                  </div>
                  <div className="mia-ficha">
                    <div className="mia-ficha-label">Tipografía</div>
                    <div className="mia-fuente"><span style={{ fontFamily: fuente }}>Aa</span><b>{diseno.fuente}</b></div>
                  </div>
                  <div className="mia-ficha">
                    <div className="mia-ficha-label">Estilo de portada</div>
                    <div className="mia-ficha-valor">{VARIANTE_LABELS[diseno.hero_variante] || diseno.hero_variante}</div>
                  </div>
                  <div className="mia-ficha">
                    <div className="mia-ficha-label">Estilo de tarjetas</div>
                    <div className="mia-ficha-valor">{TARJETA_LABELS[diseno.estilo_tarjeta] || diseno.estilo_tarjeta}</div>
                  </div>
                </div>
              </div>

              <div className="mia-ficha-label" style={{ marginTop: 18 }}>Secciones incluidas</div>
              <div className="mia-chips">
                {["Portada", "Catálogo", ...(diseno.secciones_extra || []).map(t => SECCION_LABELS[t] || t), "Contacto"].map(sec => (
                  <span key={sec} className="mia-chip"><IconoCheck size={11} />{sec}</span>
                ))}
              </div>

              {diseno.nosotros_contenido && (
                <blockquote className="mia-cita">
                  <div className="mia-ficha-label">Texto «Sobre nosotros» generado</div>
                  {diseno.nosotros_contenido}
                </blockquote>
              )}

              {confirmando && (
                <div className="mia-aviso" role="alert">
                  Esto reemplazará los colores, la tipografía y las secciones actuales de tu tienda.
                </div>
              )}
            </div>
            <div className="mia-pie">
              <button type="button" className="mia-btn mia-btn-sec" onClick={volver}>← Regenerar</button>
              <button type="button" className={`mia-btn ${confirmando ? "mia-btn-aviso" : "mia-btn-primario"}`} onClick={handleAplicar}>
                {confirmando ? "Sí, reemplazar mi diseño" : <><IconoChispas size={16} /> Aplicar diseño</>}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{ESTILOS}</style>
    </div>
  );
}

const ESTILOS = `
.mia-overlay{position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);animation:mia-fade .18s ease}
.mia-modal{background:#fff;border-radius:20px;width:100%;max-width:700px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 28px 70px rgba(15,23,42,.35);animation:mia-sube .22s ease;font-family:inherit;color:#0f172a}
.mia-header{display:flex;align-items:center;gap:14px;padding:20px 22px 16px;background:linear-gradient(135deg,#eff6ff 0%,#fff 70%);border-bottom:1px solid #e2e8f0;flex-shrink:0}
.mia-icono{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(37,99,235,.35);flex-shrink:0}
.mia-header-texto{flex:1;min-width:0}
.mia-titulo{font-size:17px;font-weight:700;color:#0f172a;letter-spacing:-.01em}
.mia-subtitulo{font-size:12.5px;color:#334155;margin-top:2px}
.mia-cerrar{width:32px;height:32px;border-radius:50%;border:none;background:#f1f5f9;color:#334155;font-size:14px;cursor:pointer;flex-shrink:0;transition:background .15s}
.mia-cerrar:hover{background:#e2e8f0;color:#0f172a}

.mia-pasos{list-style:none;margin:0;padding:14px 22px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;flex-shrink:0}
.mia-paso{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#475569}
.mia-paso+.mia-paso::before{content:"";width:28px;height:2px;border-radius:2px;background:#e2e8f0;margin-right:2px}
.mia-paso-punto{width:22px;height:22px;border-radius:50%;background:#f1f5f9;color:#475569;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.mia-paso-activo{color:#1d4ed8}
.mia-paso-activo .mia-paso-punto{background:#2563eb;color:#fff;box-shadow:0 0 0 4px #dbeafe}
.mia-paso-hecho{color:#0f172a}
.mia-paso-hecho .mia-paso-punto{background:#2563eb;color:#fff}
.mia-paso-hecho+.mia-paso::before,.mia-paso-activo+.mia-paso::before{background:#e2e8f0}
.mia-paso-hecho+.mia-paso-activo::before{background:#2563eb}

.mia-cuerpo{padding:20px 22px;overflow-y:auto;flex:1;min-height:0}
.mia-label{display:block;font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px}
.mia-label-sec{margin-top:22px;font-size:11px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.07em}
.mia-textarea{width:100%;box-sizing:border-box;border:1.5px solid #e2e8f0;border-radius:14px;padding:13px 15px;font-size:14px;line-height:1.6;color:#0f172a;background:#f8fafc;resize:none;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s,background .15s}
.mia-textarea::placeholder{color:#64748b}
.mia-textarea:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 4px rgba(37,99,235,.12)}
.mia-ayuda{display:flex;justify-content:space-between;gap:10px;font-size:11.5px;color:#475569;margin-top:6px}
.mia-error{margin-top:12px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:12.5px;color:#b91c1c}
.mia-ejemplos{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mia-ejemplo{text-align:left;padding:11px 13px;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;cursor:pointer;display:flex;flex-direction:column;gap:3px;transition:border-color .15s,background .15s,transform .15s;font-family:inherit}
.mia-ejemplo:hover{border-color:#93c5fd;background:#f8fbff;transform:translateY(-1px)}
.mia-ejemplo-tag{font-size:12px;font-weight:700;color:#1d4ed8}
.mia-ejemplo-texto{font-size:11.5px;color:#334155;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.mia-pie{display:flex;align-items:center;gap:10px;padding:14px 22px;border-top:1px solid #e2e8f0;background:#fff;flex-shrink:0}
.mia-atajo{font-size:11.5px;color:#475569;margin-right:auto}
.mia-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 20px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:1.5px solid transparent;font-family:inherit;transition:background .15s,box-shadow .15s,transform .1s}
.mia-btn:active{transform:scale(.98)}
.mia-btn-primario{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 6px 16px rgba(37,99,235,.3)}
.mia-btn-primario:hover:not(:disabled){box-shadow:0 8px 20px rgba(37,99,235,.42)}
.mia-btn-primario:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.mia-btn-sec{background:#fff;border-color:#cbd5e1;color:#0f172a}
.mia-btn-sec:hover{background:#f8fafc}
.mia-btn-aviso{background:#f59e0b;color:#fff;box-shadow:0 6px 16px rgba(245,158,11,.35)}
.mia-pie .mia-btn-primario,.mia-pie .mia-btn-aviso{flex:1}

.mia-carga{display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 24px 32px}
.mia-orbe{position:relative;width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 34px rgba(37,99,235,.4)}
.mia-orbe span{position:absolute;inset:-9px;border-radius:50%;border:2px solid #bfdbfe;border-top-color:#2563eb;animation:mia-gira 1.1s linear infinite}
.mia-carga-titulo{font-size:18px;font-weight:700;color:#0f172a;margin:22px 0 4px}
.mia-carga-desc{font-size:13px;color:#334155;max-width:340px;line-height:1.55;margin:0}
.mia-carga-lista{list-style:none;padding:0;margin:20px 0 0;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.mia-carga-lista li{display:flex;align-items:center;gap:10px;font-size:13px;color:#475569;transition:color .3s}
.mia-carga-lista li.activo{color:#1d4ed8;font-weight:600}
.mia-carga-lista li.hecho{color:#0f172a}
.mia-carga-marca{width:18px;height:18px;border-radius:50%;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#fff}
.mia-carga-lista li.activo .mia-carga-marca{border-color:#2563eb;animation:mia-pulso 1.2s ease-in-out infinite}
.mia-carga-lista li.hecho .mia-carga-marca{background:#2563eb;border-color:#2563eb}
.mia-barra{width:220px;height:5px;border-radius:5px;background:#e2e8f0;overflow:hidden;margin-top:24px}
.mia-barra span{display:block;height:100%;width:40%;border-radius:5px;background:linear-gradient(90deg,#3b82f6,#1d4ed8);animation:mia-barra 1.4s ease-in-out infinite}

.mia-revision{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;align-items:start}
.mia-ventana{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.08);background:#fff}
.mia-ventana-barra{display:flex;align-items:center;gap:5px;padding:8px 12px;background:#f1f5f9;border-bottom:1px solid #e2e8f0}
.mia-ventana-barra i{width:8px;height:8px;border-radius:50%;background:#cbd5e1}
.mia-ventana-barra span{margin-left:8px;flex:1;background:#fff;border-radius:6px;padding:2px 9px;font-size:10px;color:#475569}
.mia-sitio-nav{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#fff}
.mia-sitio-nav b{width:20px;height:20px;border-radius:6px;flex-shrink:0}
.mia-sitio-nav em{flex:1;height:5px;border-radius:3px;background:#e2e8f0}
.mia-sitio-nav u{width:38px;height:14px;border-radius:5px;opacity:.85}
.mia-sitio-hero{padding:22px 16px 18px}
.mia-sitio-titulo{font-size:17px;font-weight:800;line-height:1.2;margin-bottom:5px}
.mia-sitio-sub{font-size:10.5px;line-height:1.45;margin-bottom:12px}
.mia-sitio-btn{display:inline-block;padding:6px 13px;border-radius:7px;font-size:10px;font-weight:700}
.mia-sitio-fila{display:flex;gap:8px;padding:12px;background:#f8fafc}
.mia-sitio-tarjeta{flex:1;height:54px;border-radius:8px;background:#fff;border:1px solid #e2e8f0;border-top:3px solid;padding:9px;display:flex;flex-direction:column;gap:5px}
.mia-sitio-tarjeta span{height:4px;border-radius:2px;background:#e2e8f0}
.mia-sitio-tarjeta span+span{width:55%}

.mia-detalles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mia-ficha{background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:10px 12px}
.mia-detalles .mia-ficha:nth-child(1),.mia-detalles .mia-ficha:nth-child(2){grid-column:1/-1}
.mia-ficha-label{font-size:10px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
.mia-ficha-valor{font-size:13px;font-weight:600;color:#0f172a}
.mia-paleta{display:flex;gap:14px}
.mia-paleta>div{display:flex;align-items:center;gap:8px;font-size:10.5px;color:#334155;line-height:1.35}
.mia-paleta i{width:32px;height:32px;border-radius:9px;border:1px solid rgba(15,23,42,.12);flex-shrink:0}
.mia-paleta b{color:#0f172a;font-size:11.5px}
.mia-fuente{display:flex;align-items:center;gap:10px}
.mia-fuente span{font-size:26px;font-weight:700;color:#0f172a;line-height:1}
.mia-fuente b{font-size:13px;color:#0f172a}
.mia-chips{display:flex;flex-wrap:wrap;gap:6px}
.mia-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
.mia-cita{margin:16px 0 0;padding:13px 16px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:0 12px 12px 0;font-size:13px;line-height:1.65;color:#0f172a}
.mia-aviso{margin-top:16px;padding:11px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12.5px;color:#92400e}

@keyframes mia-fade{from{opacity:0}to{opacity:1}}
@keyframes mia-sube{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
@keyframes mia-gira{to{transform:rotate(360deg)}}
@keyframes mia-pulso{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.35)}50%{box-shadow:0 0 0 5px rgba(37,99,235,0)}}
@keyframes mia-barra{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}
@media (prefers-reduced-motion:reduce){.mia-overlay,.mia-modal,.mia-orbe span,.mia-barra span,.mia-carga-marca{animation:none!important}}
@media (max-width:640px){
  .mia-overlay{padding:0;align-items:flex-end}
  .mia-modal{max-height:96vh;border-radius:20px 20px 0 0}
  .mia-ejemplos,.mia-revision{grid-template-columns:1fr}
  .mia-paso-nombre{display:none}
  .mia-paso-activo .mia-paso-nombre{display:inline}
  .mia-atajo{display:none}
}
`;
