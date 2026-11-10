import { CheckCircle } from "lucide-react";
import { MerkaiLogo, MerkaiLogoColor } from "../modules/tienda/components/MerkaiLogo";
import { AUTH_TIPOS } from "./authTipos";

const PUNTOS = [
  "Te enviamos un enlace seguro a tu correo",
  "El enlace es válido durante 1 hora",
  "Solo tú puedes restablecer tu contraseña",
];

export default function AuthSplit({ tipo = "cliente", titulo, subtitulo, children }) {
  const t = AUTH_TIPOS[tipo];

  return (
    <div className="min-h-screen flex font-sans">
      {/* Panel izquierdo (solo desktop) */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a1628 0%, #0e2a42 55%, #0f1f35 100%)" }}
      >
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(54,116,181,0.22) 0%, transparent 65%)" }}
        />
        <div
          className="absolute -bottom-24 -left-20 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(54,116,181,0.12) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 max-w-sm w-full flex flex-col gap-10">
          <div className="flex items-center gap-3">
            <MerkaiLogo size={34} />
            <span className="text-white font-bold text-lg tracking-tight">{t.marca}</span>
          </div>

          <div>
            <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-3">{t.etiqueta}</p>
            <h2 className="text-white text-3xl font-extrabold tracking-tight leading-snug mb-4">
              Recupera el acceso en un par de minutos
            </h2>
            <p className="text-white/60 text-[15px] leading-relaxed">
              Restablecer tu contraseña es rápido y seguro. Tus datos y tu historial no se pierden.
            </p>
          </div>

          <ul className="flex flex-col gap-3.5">
            {PUNTOS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-full bg-[#3674B5]/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-white/80 text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-5"><MerkaiLogoColor /></div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">{titulo}</h1>
            {subtitulo && <p className="text-slate-500 text-sm leading-relaxed">{subtitulo}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
