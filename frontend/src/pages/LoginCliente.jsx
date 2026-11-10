import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useLoginCliente } from "../modules/tienda/hooks/useLoginCliente";
import { loginGoogleCliente } from "../services/api";
import { MerkaiLogo, MerkaiLogoColor } from "../modules/tienda/components/MerkaiLogo";

const FEATURES = [
  "Catálogo completo con fotos y precios",
  "Seguimiento de pedidos en tiempo real",
  "Descuentos exclusivos para clientes",
];

export default function LoginCliente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, loading, error, showPass, setShowPass, handleChange, handleSubmit } = useLoginCliente();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const slug = localStorage.getItem("ultima_empresa_slug");
  const from = location.state?.from || (slug ? `/tienda/${slug}` : "/");

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoadingGoogle(true);
    setGoogleError("");
    try {
      const res = await loginGoogleCliente(credentialResponse.credential);
      if (res.token) {
        localStorage.setItem("cliente_token",  res.token);
        localStorage.setItem("cliente_id",     res.cliente_id);
        localStorage.setItem("cliente_nombre", res.nombre);
        navigate(from, { replace: true });
      } else {
        setGoogleError(res.error || "No se pudo iniciar sesión con Google.");
      }
    } catch {
      setGoogleError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Panel izquierdo (solo desktop) ── */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col items-center justify-center p-12 relative overflow-hidden"
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

        <div className="relative z-10 max-w-md w-full flex flex-col gap-10">
          <div className="flex items-center gap-3">
            <MerkaiLogo />
            <span className="text-white font-bold text-lg tracking-tight">Merkai · Tienda</span>
          </div>

          <div>
            <p className="text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-3">Compra online</p>
            <h2 className="text-white text-3xl font-extrabold tracking-tight leading-snug mb-4">
              Tu tienda favorita,<br />siempre a la mano
            </h2>
            <p className="text-white/60 text-[15px] leading-relaxed">
              Explora el catálogo, arma tu pedido y recíbelo donde estés.
            </p>
          </div>

          <ul className="flex flex-col gap-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-full bg-[#3674B5]/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/10 pt-6 flex flex-col gap-2.5">
            <p className="text-white/40 text-sm">¿Tienes un negocio?</p>
            <button
              onClick={() => navigate("/empresa/login")}
              className="self-start text-white/75 text-sm font-medium border border-white/20 rounded-lg px-4 py-2 hover:bg-white/10 transition-colors"
            >
              Acceder como empresa →
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">

          <div className="mb-8">
            <div className="mb-5"><MerkaiLogoColor /></div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              ¡Bienvenido de nuevo!
            </h2>
            <p className="text-slate-500 text-sm">Tus pedidos y favoritos te esperan</p>
          </div>

          {(error || googleError) && (
            <div role="alert" className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error || googleError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            <div>
              <label htmlFor="usuario" className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="usuario"
                  name="usuario"
                  type="email"
                  placeholder="tucorreo@gmail.com"
                  value={form.usuario}
                  onChange={handleChange}
                  autoComplete="username"
                  aria-invalid={!!error}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-[#3674B5] focus:ring-2 focus:ring-[#3674B5]/15 hover:border-slate-300 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="contrasena" className="text-[13px] font-semibold text-slate-700">
                  Contraseña
                </label>
                <Link to="/tienda/recuperar-contrasena" className="text-xs text-[#3674B5] font-medium hover:underline">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="contrasena"
                  name="contrasena"
                  type={showPass ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={form.contrasena}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-invalid={!!error}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-[#3674B5] focus:ring-2 focus:ring-[#3674B5]/15 hover:border-slate-300 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-1 bg-[#3674B5] text-white font-bold rounded-xl text-[15px] hover:bg-[#2d64a0] active:scale-[0.99] transition-all disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : "Ingresar a la tienda"}
            </button>

          </form>

          {/* Google */}
          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 whitespace-nowrap">o continúa con</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex justify-center mb-5">
            {loadingGoogle ? (
              <div className="w-full py-3 flex items-center justify-center gap-2 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setGoogleError("No se pudo iniciar sesión con Google.")}
                width="280"
                shape="rectangular"
                theme="outline"
                size="large"
                text="signin_with"
                locale="es"
              />
            )}
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 whitespace-nowrap">¿No tienes cuenta aún?</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={() => {
              const refCode = localStorage.getItem("ultima_ref_codigo");
              navigate(`/tienda/registro${refCode ? `?ref=${refCode}` : ""}`);
            }}
            className="w-full py-3 border-[1.5px] border-[#3674B5] text-[#3674B5] font-semibold rounded-xl text-sm hover:bg-[#3674B5] hover:text-white transition-all"
          >
            Crear cuenta gratis
          </button>

        </div>
      </div>

    </div>
  );
}
