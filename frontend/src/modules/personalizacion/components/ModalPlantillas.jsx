import { useEffect, useState } from "react";
import { PLANTILLAS } from "../data/plantillas";
import IconoCheck from "./IconoCheck";

const TIPOS_LABELS = {
  hero:        "portada",
  catalogo:    "catálogo",
  nosotros:    "sobre nosotros",
  contacto:    "contacto",
  faq:         "preguntas frecuentes",
  galeria:     "galería",
  testimonios: "testimonios",
  promociones: "promociones",
};

// Textos pensados para el dueño del negocio (si se agrega una plantilla nueva, usa su descripción)
const TEXTOS = {
  plantilla_1: { frase: "Transmite confianza y frescura, con una portada con banner y tus datos clave a la vista.", ideal: "Pescaderías, carnicerías y negocios de alimentos frescos" },
  plantilla_2: { frase: "Una portada grande, como de revista, que deja que tus fotos hablen por ti.", ideal: "Productos con buenas fotografías" },
  plantilla_3: { frase: "Letras grandes y colores fuertes para que nadie pase de largo.", ideal: "Marcas jóvenes y con personalidad" },
  plantilla_4: { frase: "Un fondo degradado moderno que le da a tu tienda un toque premium.", ideal: "Tecnología y marcas que quieren verse modernas" },
  plantilla_5: { frase: "Limpia y tranquila, con mucho espacio para que tus productos respiren.", ideal: "Tiendas de estilo sencillo o con pocos productos" },
  plantilla_6: { frase: "Un diseño en dos columnas que pone tu logo bien a la vista.", ideal: "Negocios de tradición con un logo reconocible" },
};

const enLista = (a) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} y ${a[a.length - 1]}`);
const variante = (p) => p.secciones.find((s) => s.tipo === "hero")?.config?.variante || "oscuro";

function Barra({ w, h = 5, color, mt = 0 }) {
  return <div style={{ width: w, height: h, borderRadius: h, background: color, marginTop: mt, flexShrink: 0 }} />;
}

// Mini portada que cambia según el estilo de la plantilla
function VistaPrevia({ plantilla }) {
  const { color_primario: cp, color_secundario: cs } = plantilla;
  const v = variante(plantilla);
  const claro = v === "minimalista";
  const fondo = claro ? "#ffffff" : v === "gradiente" ? `linear-gradient(135deg, ${cs} 35%, ${cp}aa 140%)` : cs;
  const titulo = claro ? cs : "#ffffff";
  const sub = claro ? "#94a3b8" : "rgba(255,255,255,.55)";
  const lineaNav = claro ? "#cbd5e1" : "rgba(255,255,255,.35)";

  let hero;
  if (v === "revista") {
    hero = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 14px 12px", background: "linear-gradient(to top, rgba(0,0,0,.55), transparent 70%)" }}>
        <Barra w={104} h={7} color={titulo} />
        <Barra w={70} h={4} color={sub} mt={6} />
      </div>
    );
  } else if (v === "negrita") {
    hero = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 14px" }}>
        <Barra w={120} h={11} color={titulo} />
        <Barra w={92} h={11} color={cp} mt={5} />
        <Barra w={60} h={4} color={sub} mt={8} />
      </div>
    );
  } else if (v === "lateral") {
    hero = (
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 14px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <Barra w={86} h={6} color={titulo} />
          <Barra w={60} h={4} color={sub} />
          <div style={{ width: 44, height: 12, borderRadius: 7, background: cp, marginTop: 4 }} />
        </div>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: cp, opacity: 0.92, flexShrink: 0 }} />
      </div>
    );
  } else {
    hero = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "0 12px" }}>
        <Barra w={96} h={6} color={titulo} />
        <Barra w={64} h={4} color={sub} />
        <div style={{ width: 46, height: 12, borderRadius: 7, background: cp, marginTop: 5 }} />
      </div>
    );
  }

  return (
    <div style={{ height: 156, background: fondo, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 22, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0 }}>
        <div style={{ width: 14, height: 14, borderRadius: 4, background: cp }} />
        <div style={{ display: "flex", gap: 5, marginLeft: 4 }}>
          {[28, 20, 24].map((w, i) => <Barra key={i} w={w} h={3} color={lineaNav} />)}
        </div>
      </div>
      {hero}
      <div style={{ display: "flex", gap: 6, padding: "0 12px 10px", flexShrink: 0 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 26, borderRadius: 6, background: claro ? "#f1f5f9" : "rgba(255,255,255,.1)", borderTop: `3px solid ${cp}`, opacity: 0.95 }} />
        ))}
      </div>
    </div>
  );
}

export default function ModalPlantillas({ onCerrar, onAplicar }) {
  const [elegida, setElegida] = useState(null);

  useEffect(() => {
    const alTeclear = (e) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const usar = () => {
    if (!elegida) return;
    onAplicar(elegida);
    onCerrar();
  };

  return (
    <div className="mpl-overlay" onClick={onCerrar}>
      <div className="mpl-modal" role="dialog" aria-modal="true" aria-labelledby="mpl-titulo" onClick={(e) => e.stopPropagation()}>

        <div className="mpl-header">
          <div className="mpl-icono" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div className="mpl-header-texto">
            <h2 id="mpl-titulo" className="mpl-titulo">Elige cómo quieres que se vea tu tienda</h2>
            <p className="mpl-subtitulo">Empieza con la plantilla que más se parezca a tu negocio. Después puedes cambiar colores, textos y secciones desde el editor.</p>
          </div>
          <button type="button" className="mpl-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>

        <div className="mpl-cuerpo">
          <div className="mpl-grid" role="radiogroup" aria-label="Plantillas">
            {PLANTILLAS.map((p) => {
              const textos = TEXTOS[p.id] || { frase: p.descripcion, ideal: "" };
              const activa = elegida?.id === p.id;
              const incluye = enLista(p.secciones.map((s) => TIPOS_LABELS[s.tipo] || s.tipo));
              return (
                <button
                  type="button"
                  key={p.id}
                  role="radio"
                  aria-checked={activa}
                  className={`mpl-card ${activa ? "mpl-card-activa" : ""}`}
                  onClick={() => setElegida(p)}
                >
                  <div className="mpl-vista">
                    <VistaPrevia plantilla={p} />
                    {activa && <span className="mpl-marca"><IconoCheck size={14} /></span>}
                  </div>
                  <div className="mpl-info">
                    <div className="mpl-fila-nombre">
                      <span className="mpl-nombre">{p.nombre}</span>
                      <span className="mpl-colores" aria-label="Colores de la plantilla">
                        <i style={{ background: p.color_primario }} />
                        <i style={{ background: p.color_secundario }} />
                      </span>
                    </div>
                    <p className="mpl-frase">{textos.frase}</p>
                    {textos.ideal && <p className="mpl-dato"><b>Ideal para:</b> {textos.ideal}</p>}
                    <p className="mpl-dato"><b>Incluye:</b> {incluye}.</p>
                    <span className={`mpl-elegir ${activa ? "mpl-elegir-activa" : ""}`}>
                      {activa ? <><IconoCheck size={13} /> Elegida</> : "Elegir esta"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {elegida && (
          <div className="mpl-pie">
            <p className="mpl-pie-texto">
              Elegiste <strong>«{elegida.nombre}»</strong>. Se reemplazarán los colores, la letra y las secciones actuales de tu tienda.
            </p>
            <div className="mpl-pie-botones">
              <button type="button" className="mpl-btn mpl-btn-sec" onClick={() => setElegida(null)}>Cancelar</button>
              <button type="button" className="mpl-btn mpl-btn-primario" onClick={usar}>Usar esta plantilla</button>
            </div>
          </div>
        )}
      </div>

      <style>{ESTILOS}</style>
    </div>
  );
}

const ESTILOS = `
.mpl-overlay{position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);animation:mpl-fade .18s ease}
.mpl-modal{background:#fff;border-radius:22px;width:100%;max-width:980px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 28px 70px rgba(15,23,42,.35);animation:mpl-sube .22s ease;color:#1e293b;font-family:inherit}
.mpl-header{display:flex;align-items:center;gap:14px;padding:22px 26px 18px;background:linear-gradient(135deg,#eff6ff 0%,#fff 70%);border-bottom:1px solid #e2e8f0;flex-shrink:0}
.mpl-icono{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(37,99,235,.35);flex-shrink:0}
.mpl-header-texto{flex:1;min-width:0}
.mpl-titulo{margin:0;font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-.01em}
.mpl-subtitulo{margin:3px 0 0;font-size:13px;color:#334155;line-height:1.5;max-width:620px}
.mpl-cerrar{width:34px;height:34px;border-radius:50%;border:none;background:#f1f5f9;color:#334155;font-size:14px;cursor:pointer;flex-shrink:0;transition:background .15s}
.mpl-cerrar:hover{background:#e2e8f0;color:#0f172a}

.mpl-cuerpo{padding:24px 26px;overflow-y:auto;flex:1;min-height:0;background:#f8fafc}
.mpl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch}
.mpl-card{display:flex;flex-direction:column;text-align:left;background:#fff;border:2px solid #e2e8f0;border-radius:18px;padding:0;cursor:pointer;overflow:hidden;font-family:inherit;color:inherit;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.mpl-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(15,23,42,.12);border-color:#bfdbfe}
.mpl-card:focus-visible{outline:none;border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.2)}
.mpl-card-activa,.mpl-card-activa:hover{border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.14),0 14px 30px rgba(37,99,235,.14)}
.mpl-vista{position:relative}
.mpl-marca{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(37,99,235,.45);animation:mpl-pop .18s ease}
.mpl-info{display:flex;flex-direction:column;gap:8px;padding:16px 18px 18px;flex:1}
.mpl-fila-nombre{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mpl-nombre{font-size:16px;font-weight:700;color:#0f172a}
.mpl-colores{display:flex}
.mpl-colores i{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(15,23,42,.12)}
.mpl-colores i+i{margin-left:-7px}
.mpl-frase{margin:0;font-size:13.5px;line-height:1.55;color:#334155}
.mpl-dato{margin:0;font-size:12.5px;line-height:1.5;color:#475569}
.mpl-dato b{color:#1e293b;font-weight:600}
.mpl-elegir{margin-top:auto;padding-top:6px;display:inline-flex;align-items:center;justify-content:center;gap:6px;align-self:stretch;height:40px;border-radius:12px;border:1.5px solid #cbd5e1;background:#fff;font-size:13px;font-weight:700;color:#1e293b;transition:all .15s;box-sizing:border-box}
.mpl-card:hover .mpl-elegir{border-color:#2563eb;color:#1d4ed8;background:#eff6ff}
.mpl-elegir-activa,.mpl-card:hover .mpl-elegir-activa{background:#2563eb;border-color:#2563eb;color:#fff}

.mpl-pie{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 26px;border-top:1px solid #e2e8f0;background:#fff;flex-shrink:0;animation:mpl-sube .2s ease}
.mpl-pie-texto{margin:0;flex:1;min-width:240px;font-size:13px;line-height:1.5;color:#334155}
.mpl-pie-texto strong{color:#0f172a}
.mpl-pie-botones{display:flex;gap:10px}
.mpl-btn{padding:11px 20px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:1.5px solid transparent;font-family:inherit;transition:background .15s,box-shadow .15s,transform .1s}
.mpl-btn:active{transform:scale(.98)}
.mpl-btn-sec{background:#fff;border-color:#cbd5e1;color:#1e293b}
.mpl-btn-sec:hover{background:#f8fafc}
.mpl-btn-primario{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 6px 16px rgba(37,99,235,.3)}
.mpl-btn-primario:hover{box-shadow:0 8px 20px rgba(37,99,235,.42)}

@keyframes mpl-fade{from{opacity:0}to{opacity:1}}
@keyframes mpl-sube{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes mpl-pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.mpl-overlay,.mpl-modal,.mpl-pie,.mpl-marca{animation:none!important}.mpl-card,.mpl-card:hover{transition:none;transform:none}}
@media (max-width:900px){.mpl-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:600px){
  .mpl-overlay{padding:0;align-items:flex-end}
  .mpl-modal{max-height:96vh;border-radius:22px 22px 0 0}
  .mpl-grid{grid-template-columns:1fr}
  .mpl-cuerpo{padding:18px}
  .mpl-header{padding:18px}
  .mpl-pie{padding:14px 18px}
  .mpl-pie-botones{width:100%}
  .mpl-pie-botones .mpl-btn{flex:1}
}
`;
