import { useState, useEffect, useRef } from "react";
import { Sliders, Check } from "lucide-react";

const ACENTOS = {
  verde:   { label: "Verde",   primary: "161 76% 25%", hex: "#0F6E56" },
  azul:    { label: "Azul",    primary: "221 83% 53%", hex: "#2563eb" },
  marino:  { label: "Marino",  primary: "190 88% 31%", hex: "#0e7490" },
  violeta: { label: "Violeta", primary: "262 83% 58%", hex: "#7c3aed" },
  naranja: { label: "Naranja", primary: "24 95% 47%",  hex: "#ea580c" },
  rosa:    { label: "Rosa",    primary: "343 82% 50%", hex: "#e11d48" },
  pizarra: { label: "Pizarra", primary: "215 25% 36%", hex: "#475569" },
  indigo:  { label: "Índigo",  primary: "245 75% 59%", hex: "#4f46e5" },
};

const STORAGE_KEY = "merkai-accent";

function aplicarAcento(key) {
  const acento = ACENTOS[key];
  if (!acento) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", acento.primary);
  root.style.setProperty("--primary-foreground", "0 0% 100%");
  root.style.setProperty("--ring", acento.primary);
}

export function useAcento() {
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY) || "verde";
    aplicarAcento(guardado);
  }, []);
}

export default function PersonalizarColor() {
  const [abierto, setAbierto]   = useState(false);
  const [activo, setActivo]     = useState(() => localStorage.getItem(STORAGE_KEY) || "verde");
  const ref                     = useRef(null);

  useEffect(() => {
    const onKey   = (e) => { if (e.key === "Escape") setAbierto(false); };
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const elegir = (key) => {
    setActivo(key);
    aplicarAcento(key);
    localStorage.setItem(STORAGE_KEY, key);
    setAbierto(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(v => !v)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-[9px] cursor-pointer text-[13px] text-slate-600 font-medium hover:bg-slate-200/70 transition-colors"
      >
        <Sliders size={13} />
        <span className="text-xs">Color</span>
      </button>

      {abierto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-[230px]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Color de acento
          </p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(ACENTOS).map(([key, val]) => (
              <button
                key={key}
                title={val.label}
                onClick={() => elegir(key)}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: val.hex,
                    outline: activo === key ? `3px solid ${val.hex}` : "3px solid transparent",
                    outlineOffset: "2px",
                  }}
                >
                  {activo === key && <Check size={14} color="white" strokeWidth={3} />}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight text-center">
                  {val.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
