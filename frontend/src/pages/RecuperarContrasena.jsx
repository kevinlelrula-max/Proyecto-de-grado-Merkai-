import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Mail, AlertCircle, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import AuthSplit from "../components/AuthSplit";
import { AUTH_TIPOS } from "../components/authTipos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ESPERA_REENVIO = 60; // segundos antes de poder pedir otro enlace

// tipo: "cliente" (tienda) | "empresa" (panel de gestión)
export default function RecuperarContrasena({ tipo = "cliente" }) {
  const t = AUTH_TIPOS[tipo];
  const [usuario, setUsuario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [espera,  setEspera]  = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const enviar = async () => {
    const correo = usuario.trim();
    if (!correo) return setError("Ingresa tu correo electrónico");
    if (!/^\S+@\S+\.\S+$/.test(correo)) return setError("Revisa que el correo esté bien escrito");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_URL}${t.api}/recuperar-contrasena`, { usuario: correo });
      setEnviado(true);
      setEspera(ESPERA_REENVIO);
    } catch {
      setError("No pudimos procesar la solicitud. Intenta de nuevo en unos minutos.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => { e.preventDefault(); enviar(); };

  if (enviado) {
    return (
      <AuthSplit
        tipo={tipo}
        titulo="Revisa tu correo"
        subtitulo={<>Si <strong className="text-slate-700">{usuario.trim()}</strong> está registrado, te enviamos un enlace para crear una nueva contraseña.</>}
      >
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3.5 text-sm mb-5">
          <MailCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">El enlace llega en unos minutos y es válido por <strong>1 hora</strong>. Si no lo ves, revisa la carpeta de spam.</span>
        </div>

        <button
          type="button"
          onClick={enviar}
          disabled={espera > 0 || loading}
          className="w-full py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        >
          {loading ? "Enviando..." : espera > 0 ? `Reenviar enlace en ${espera} s` : "Reenviar enlace"}
        </button>

        <Link to={t.login} className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
        </Link>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      tipo={tipo}
      titulo="¿Olvidaste tu contraseña?"
      subtitulo="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."
    >
      {error && (
        <div role="alert" className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="correo" className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="correo"
              type="email"
              autoFocus
              autoComplete="email"
              placeholder={tipo === "empresa" ? "admin@tuempresa.com" : "tucorreo@gmail.com"}
              value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setError(""); }}
              aria-invalid={!!error}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-[#3674B5] focus:ring-2 focus:ring-[#3674B5]/15 hover:border-slate-300 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: t.acento }}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>

      <Link to={t.login} className="flex items-center justify-center gap-2 mt-6 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
      </Link>
    </AuthSplit>
  );
}
