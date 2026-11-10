import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowLeft, LinkIcon } from "lucide-react";
import AuthSplit from "../components/AuthSplit";
import { AUTH_TIPOS } from "../components/authTipos";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MIN_LONGITUD = 6;

// Fuerza simple de la contraseña: 0 (vacía) a 4
function fuerza(p) {
  if (!p) return 0;
  let n = 0;
  if (p.length >= MIN_LONGITUD) n++;
  if (p.length >= 10) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++;
  return Math.max(1, n);
}
const ETIQUETAS = ["", "Muy débil", "Débil", "Buena", "Fuerte"];
const COLORES   = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];

// tipo: "cliente" (tienda) | "empresa" (panel de gestión)
export default function ResetearContrasena({ tipo = "cliente" }) {
  const t = AUTH_TIPOS[tipo];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [contrasena,   setContrasena]   = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verPass,      setVerPass]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [exito,        setExito]        = useState(false);
  const [cuenta,       setCuenta]       = useState(4);

  // Tras el éxito, cuenta regresiva y redirección al inicio de sesión
  useEffect(() => {
    if (!exito) return;
    if (cuenta <= 0) { navigate(t.login); return; }
    const id = setTimeout(() => setCuenta((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [exito, cuenta, navigate, t.login]);

  if (!token) {
    return (
      <AuthSplit tipo={tipo} titulo="Enlace no válido" subtitulo="Este enlace no es válido o ya expiró. Pide uno nuevo y vuelve a intentarlo.">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3.5 text-sm mb-5">
          <LinkIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">Los enlaces de recuperación duran 1 hora y solo se pueden usar una vez.</span>
        </div>
        <Link
          to={t.recuperar}
          style={{ backgroundColor: t.acento }}
          className="block w-full py-3 rounded-xl text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity mb-5"
        >
          Solicitar un enlace nuevo
        </Link>
        <Link to={t.login} className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
        </Link>
      </AuthSplit>
    );
  }

  const enviar = async (e) => {
    e.preventDefault();
    if (contrasena.length < MIN_LONGITUD) return setError(`La contraseña debe tener al menos ${MIN_LONGITUD} caracteres`);
    if (contrasena !== confirmacion) return setError("Las contraseñas no coinciden");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_URL}${t.api}/resetear-contrasena`, { token, contrasena_nueva: contrasena });
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error || "No pudimos restablecer la contraseña. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <AuthSplit tipo={tipo} titulo="¡Contraseña actualizada!" subtitulo="Ya puedes iniciar sesión con tu nueva contraseña.">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3.5 text-sm mb-5">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Te llevamos al inicio de sesión en {Math.max(cuenta, 0)} s…</span>
        </div>
        <Link
          to={t.login}
          style={{ backgroundColor: t.acento }}
          className="block w-full py-3 rounded-xl text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
        >
          Iniciar sesión ahora
        </Link>
      </AuthSplit>
    );
  }

  const nivel = fuerza(contrasena);
  const coinciden = confirmacion.length > 0 && contrasena === confirmacion;

  const campo = (id, etiqueta, valor, setValor, autoComplete, extra) => (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold text-slate-700 mb-1.5">{etiqueta}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id={id}
          type={verPass ? "text" : "password"}
          value={valor}
          onChange={(e) => { setValor(e.target.value); setError(""); }}
          autoComplete={autoComplete}
          placeholder="••••••••"
          aria-invalid={!!error}
          className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-[#3674B5] focus:ring-2 focus:ring-[#3674B5]/15 hover:border-slate-300 transition-all"
        />
        {extra}
      </div>
    </div>
  );

  return (
    <AuthSplit tipo={tipo} titulo="Crea tu nueva contraseña" subtitulo={`Usa al menos ${MIN_LONGITUD} caracteres. Combina letras, números y símbolos para que sea más segura.`}>
      {error && (
        <div role="alert" className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {campo("nueva", "Nueva contraseña", contrasena, setContrasena, "new-password",
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVerPass(!verPass)}
            aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {contrasena && (
          <div aria-live="polite">
            <div className="flex gap-1.5 mb-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= nivel ? COLORES[nivel] : "bg-slate-200"}`} />
              ))}
            </div>
            <p className="text-xs text-slate-500">Seguridad: <span className="font-semibold text-slate-700">{ETIQUETAS[nivel]}</span></p>
          </div>
        )}

        {campo("confirmar", "Confirma la contraseña", confirmacion, setConfirmacion, "new-password")}
        {confirmacion && (
          <p className={`text-xs -mt-2 flex items-center gap-1.5 ${coinciden ? "text-emerald-600" : "text-red-500"}`}>
            {coinciden ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {coinciden ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: t.acento }}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>

      <Link to={t.login} className="flex items-center justify-center gap-2 mt-6 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
      </Link>
    </AuthSplit>
  );
}
