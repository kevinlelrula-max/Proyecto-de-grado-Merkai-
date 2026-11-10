import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Monitor, Smartphone, PanelLeftClose, PanelLeftOpen, Store, ExternalLink } from "lucide-react";
import { useEditor } from "./hooks/useEditor";
import PanelEditor from "./components/PanelEditor";
import PreviewStore from "./components/PreviewStore";

export default function EditorTienda() {
  const [editorAbierto, setEditorAbierto] = useState(false);

  return (
    <>
      {!editorAbierto && (
        <div className="flex items-center justify-center h-full p-10">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm">
            <span style={{ display:"flex", width:64, height:64, alignItems:"center", justifyContent:"center", borderRadius:16, backgroundColor:"#eff6ff", color:"#2563eb" }}>
              <Store size={28} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
                Editor de tienda
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Personaliza el aspecto de tu tienda online — banner, colores, secciones y más.
              </p>
            </div>
            <button
              onClick={() => setEditorAbierto(true)}
              style={{ marginTop:4, padding:"10px 24px", backgroundColor:"#2563eb", color:"white", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}
            >
              Abrir editor
            </button>
          </div>
        </div>
      )}

      {editorAbierto && createPortal(
        <EditorFullscreen onCerrar={() => setEditorAbierto(false)} />,
        document.body
      )}
    </>
  );
}

function EditorFullscreen({ onCerrar }) {
  const {
    datos, bannerPreview,
    cargando, guardando, exito, error,
    layout, onLayoutChange, onToggleSeccion,
    onDeleteSeccion, onAddSeccion, onSeccionConfigChange,
    aplicarPlantilla,
    cargar, onChange, onBannerChange, guardar,
  } = useEditor();

  const [seccionActiva, setSeccionActiva] = useState("hero");
  const [vista, setVista]               = useState("desktop");
  const [iframeKey, setIframeKey]       = useState(0);
  const [panelAbierto, setPanelAbierto] = useState(true);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleGuardar = useCallback(async () => {
    await guardar();
    setIframeKey(k => k + 1);
  }, [guardar]);

  const slug = datos.slug || localStorage.getItem("empresa_slug") || "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "#f1f5f9", display: "flex", flexDirection: "column", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── TOPBAR ── */}
      <div style={fs.topbar}>

        <button style={fs.backBtn} onClick={onCerrar}>
          <ChevronLeft size={14} strokeWidth={2.2} />
          Volver
        </button>

        <div style={fs.topCenter}>
          <span style={fs.topDot} />
          <span style={fs.topTitle}>Editor de tienda</span>
        </div>

        <div style={fs.topRight}>
          {/* Toggle panel */}
          <button
            style={{
              ...fs.iconBtn,
              backgroundColor: panelAbierto ? "#eff6ff" : "transparent",
              borderColor: panelAbierto ? "rgba(37,99,235,0.35)" : "#e2e8f0",
              color: panelAbierto ? "#2563eb" : "#64748b",
            }}
            onClick={() => setPanelAbierto(v => !v)}
            title={panelAbierto ? "Ocultar panel" : "Mostrar panel"}
          >
            {panelAbierto
              ? <PanelLeftClose size={15} />
              : <PanelLeftOpen size={15} />
            }
          </button>

          {/* Toggle desktop/mobile */}
          <div style={fs.vistasToggle}>
            {[
              { key: "desktop", Icon: Monitor,    label: "Escritorio" },
              { key: "mobile",  Icon: Smartphone, label: "Móvil" },
            ].map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setVista(key)}
                title={label}
                style={{
                  ...fs.vistaBtn,
                  backgroundColor: vista === key ? "#2563eb" : "transparent",
                  color: vista === key ? "white" : "#94a3b8",
                  boxShadow: vista === key ? "0 1px 3px rgba(37,99,235,0.3)" : "none",
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

          {/* Ver tienda */}
          {slug && (
            <a
              href={`${window.location.origin}/tienda/${slug}`}
              target="_blank"
              rel="noreferrer"
              style={fs.verTiendaBtn}
            >
              <ExternalLink size={13} />
              Ver tienda
            </a>
          )}

          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              ...fs.publishBtn,
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
      </div>

      {cargando ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>Cargando editor...</span>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {panelAbierto && (
            <div style={fs.panel}>
              <PanelEditor
                datos={datos}
                bannerPreview={bannerPreview}
                layout={layout}
                onLayoutChange={onLayoutChange}
                seccionActiva={seccionActiva}
                setSeccionActiva={setSeccionActiva}
                onChange={onChange}
                onBannerChange={onBannerChange}
                onToggleSeccion={onToggleSeccion}
                onDeleteSeccion={onDeleteSeccion}
                onAddSeccion={onAddSeccion}
                onSeccionConfigChange={onSeccionConfigChange}
                onAplicarPlantilla={aplicarPlantilla}
                guardando={false}
                exito={false}
                error={error}
                onGuardar={handleGuardar}
                ocultarHeader
              />
            </div>
          )}

          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <PreviewStore
              vista={vista}
              slug={slug}
              iframeKey={iframeKey}
            />
          </div>

        </div>
      )}
    </div>
  );
}

const fs = {
  topbar: {
    height: 52,
    flexShrink: 0,
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 14px",
    gap: 12,
  },

  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "1px solid rgba(37,99,235,0.3)",
    borderRadius: 8,
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
    cursor: "pointer",
    flexShrink: 0,
  },

  topCenter: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  topDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#2563eb",
    flexShrink: 0,
  },
  topTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  topStore: {
    fontSize: 11,
    color: "#94a3b8",
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: 5,
    fontWeight: 500,
  },

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "1px solid",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.15s",
    background: "none",
  },

  vistasToggle: {
    display: "flex",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  vistaBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.15s",
  },

  verTiendaBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 12px",
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 500,
    textDecoration: "none",
    flexShrink: 0,
  },

  publishBtn: {
    padding: "7px 18px",
    border: "none",
    borderRadius: 9,
    color: "white",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    transition: "all 0.2s",
  },

  panel: {
    width: 300,
    flexShrink: 0,
    overflowY: "auto",
    borderRight: "1px solid #e2e8f0",
    backgroundColor: "white",
  },
};
