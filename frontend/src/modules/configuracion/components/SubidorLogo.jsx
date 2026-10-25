import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ImageIcon, Upload, RefreshCw, FileText } from "lucide-react";
import { imgUrl } from "../../../utils/imgUrl";

const MAX_MB = 2;
const TIPOS = ["image/png", "image/jpeg", "image/webp"];

// Las imágenes recién elegidas llegan como data URL; las guardadas, como ruta del servidor
const resolver = (u) => (!u ? null : /^(https?:|data:|blob:)/.test(u) ? u : imgUrl(u));

const tamano = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

export default function SubidorLogo({ logoPreview, nombre, onLogoChange }) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [pendiente, setPendiente] = useState(null); // { nombre, tamano } del archivo elegido y aún sin guardar

  const src = resolver(logoPreview);
  useEffect(() => { setFallo(false); }, [logoPreview]);
  const hayLogo = !!src && !fallo;
  const inicial = (nombre || "T").trim().charAt(0).toUpperCase();

  function recibir(file) {
    if (!file) return;
    if (!TIPOS.includes(file.type)) {
      toast.error("Usa una imagen PNG, JPG o WebP.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`El logo pesa más de ${MAX_MB} MB. Elige una imagen más liviana.`);
      return;
    }
    setPendiente({ nombre: file.name, tamano: tamano(file.size) });
    onLogoChange(file);
  }

  const abrir = () => inputRef.current?.click();

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

      {/* Zona de carga */}
      <div className="md:col-span-3">
        <span className="block text-[13px] font-semibold text-slate-800 mb-1.5">Logo de tu negocio</span>
        <div
          role="button"
          tabIndex={0}
          onClick={abrir}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } }}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastrando(false); recibir(e.dataTransfer.files?.[0]); }}
          aria-label={hayLogo ? "Cambiar logo" : "Subir logo"}
          className={`rounded-2xl border-2 border-dashed min-h-[200px] flex flex-col items-center justify-center text-center px-6 py-7 cursor-pointer transition outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
            arrastrando ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          {hayLogo ? (
            <>
              <div className="w-full flex justify-center bg-white rounded-xl border border-slate-200 py-4 mb-4">
                <img
                  src={src}
                  alt={`Logo de ${nombre || "tu negocio"}`}
                  onError={() => setFallo(true)}
                  className="h-24 max-w-[80%] object-contain"
                />
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                <RefreshCw size={15} /> Cambiar logo
              </span>
              {pendiente ? (
                <p className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1.5">
                  <FileText size={13} /> {pendiente.nombre} · {pendiente.tamano} — se guardará cuando pulses «Guardar cambios»
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-2">O arrastra aquí una imagen nueva</p>
              )}
            </>
          ) : (
            <>
              <span className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-blue-600 mb-4">
                {arrastrando ? <Upload size={24} /> : <ImageIcon size={24} />}
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {fallo ? "No pudimos mostrar tu logo actual" : "Sube el logo de tu negocio"}
              </p>
              <p className="text-[13px] text-slate-600 mt-1 max-w-xs">
                {fallo ? "Sube una imagen nueva para reemplazarlo." : "Arrástralo hasta aquí o haz clic para elegirlo desde tu equipo."}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-300 text-slate-800 shadow-sm">
                <Upload size={15} /> Elegir imagen
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">PNG, JPG o WebP · máx. {MAX_MB} MB. Se ve mejor con fondo transparente o blanco.</p>
        <input ref={inputRef} type="file" accept={TIPOS.join(",")} className="hidden" onChange={(e) => { recibir(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

      {/* Así se verá */}
      <div className="md:col-span-2">
        <span className="block text-[13px] font-semibold text-slate-800 mb-1.5">Así se verá</span>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">En tu panel</p>
            <div className="rounded-2xl bg-[#0B1628] p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-[11px] bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                {hayLogo
                  ? <img src={src} alt="" className="w-full h-full object-contain p-0.5" />
                  : <span className="text-base font-bold text-[#0B1628]">{inicial}</span>}
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#E8F4FF] truncate">{nombre || "Tu negocio"}</div>
                <div className="text-[10px] text-[#7A93AF] uppercase tracking-[0.08em] mt-0.5">Panel de gestión</div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">En tus comprobantes</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {hayLogo
                    ? <img src={src} alt="" className="w-full h-full object-contain p-0.5" />
                    : <span className="text-sm font-bold text-slate-700">{inicial}</span>}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{nombre || "Tu negocio"}</div>
                  <div className="text-[11px] text-slate-500">Comprobante de venta</div>
                </div>
              </div>
              <div className="pt-3 space-y-1.5">
                <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                <div className="h-1.5 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
