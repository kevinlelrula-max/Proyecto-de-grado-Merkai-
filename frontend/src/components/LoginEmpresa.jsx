import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginEmpresa, loginGoogleEmpresa } from "../services/api";
import SelectorEmpresa from "./SelectorEmpresa";

export default function LoginEmpresa() {
  const navigate = useNavigate();
  const [form, setForm]               = useState({ usuario: "", contrasena: "" });
  const [loading, setLoading]         = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState("");
  const [misEmpresas, setMisEmpresas] = useState(null);
  const [tempToken, setTempToken]     = useState(null);
  const [tempRolId, setTempRolId]     = useState(1);

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const guardarSesion = (data) => {
    localStorage.setItem("token",           data.token);
    localStorage.setItem("empresa_id",      data.empresa_id);
    localStorage.setItem("rol_id",          data.rol_id);
    localStorage.setItem("codigo_referido", data.codigo_referido || "");
    if (data.slug) localStorage.setItem("empresa_slug", data.slug);
    navigate("/dashboard");
  };

  const handleLogin = async () => {
    if (!form.usuario || !form.contrasena) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginEmpresa(form);
      if (res.token) {
        if (res.mis_empresas && res.mis_empresas.length > 1) {
          setTempToken(res.token);
          setTempRolId(res.rol_id);
          setMisEmpresas(res.mis_empresas);
        } else {
          guardarSesion(res);
        }
      } else {
        setError(res.error || "Credenciales incorrectas.");
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoadingGoogle(true);
    setError("");
    try {
      const res = await loginGoogleEmpresa(credentialResponse.credential);
      if (res.token) {
        if (res.mis_empresas && res.mis_empresas.length > 1) {
          setTempToken(res.token);
          setTempRolId(res.rol_id);
          setMisEmpresas(res.mis_empresas);
        } else {
          guardarSesion(res);
        }
      } else {
        setError(res.error || "No se pudo iniciar sesión con Google.");
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoadingGoogle(false);
    }
  };


  if (misEmpresas) {
    return (
      <SelectorEmpresa
        empresas={misEmpresas}
        token={tempToken}
        rolId={tempRolId}
        onSelect={guardarSesion}
      />
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ display: "grid", gridTemplateColumns: "60fr 40fr", background: "#fff" }}>

      {/* ── Panel izquierdo — arte + branding ── */}
      <div
        className="hidden md:flex min-h-screen flex-col items-center justify-center gap-2 py-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0f172a 0%, #0d2b45 55%, #0f1f2e 100%)",
          clipPath: "polygon(0 0, 100% 0, calc(100% - 90px) 100%, 0 100%)",
        }}
      >
        {/* Círculos ambientales */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:"absolute", bottom:-100, right:-80, width:360, height:360, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.04)" }}/>
        </div>

        {/* Logo — top left */}
        <div className="absolute top-8 left-10 flex items-center gap-2.5 z-30">
          <img src="/logo-merkai-icon.png" alt="Merkai" width="32" height="32" style={{ objectFit: "contain" }} />
          <span className="font-bold text-white text-base tracking-tight">Merkai</span>
        </div>

        {/* Círculos decorativos — mismo estilo que SelectorEmpresa */}
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(255,255,255,0.02)", top:-100, left:-150 }}/>
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.02)", bottom:-80, right:-100 }}/>
        <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"rgba(255,255,255,0.02)", top:"40%", right:"15%" }}/>

        {/* Texto — grande, alineado a la izquierda */}
        <div className="absolute inset-0 flex flex-col justify-center z-20 pointer-events-none px-14">
          <h2 className="font-extrabold text-white leading-none tracking-tight mb-6" style={{ fontSize: "clamp(3rem, 5.5vw, 5rem)" }}>
            Tu negocio,<br/>todo en un<br/>solo lugar
          </h2>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 380 }}>
            Ventas, inventario, clientes y análisis con IA — para crecer con confianza.
          </p>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="min-h-screen bg-white flex items-center justify-center px-10">
        <div className="w-full max-w-md">

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Hola, bienvenido de nuevo
            </h2>
            <p className="text-base" style={{ color: "#94a3b8" }}>Ingresa tus datos para continuar</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Correo */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Correo electrónico
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none">
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="2" y="4" width="16" height="13" rx="2"/>
                  <path d="M2 7l8 5 8-5"/>
                </svg>
              </span>
              <input
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 text-base text-slate-900 bg-slate-50 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                name="usuario"
                type="email"
                placeholder="admin@tuempresa.com"
                value={form.usuario}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="mb-7">
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none">
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="3" y="8" width="14" height="10" rx="2"/>
                  <path d="M7 8V6a3 3 0 0 1 6 0v2"/>
                  <circle cx="10" cy="13" r="1.2" fill="#94a3b8" stroke="none"/>
                </svg>
              </span>
              <input
                className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-slate-200 text-base text-slate-900 bg-slate-50 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                name="contrasena"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.contrasena}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
              <button
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none text-sm"
                onClick={() => setShowPass(!showPass)}
                type="button"
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Botón principal */}
          <button
            className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors mb-4 disabled:opacity-70 cursor-pointer"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Verificando..." : "Iniciar sesión"}
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">o continúa con</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center mb-5">
            {loadingGoogle ? (
              <div className="w-full py-3 flex items-center justify-center gap-2 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50">
                <span>Verificando...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("No se pudo iniciar sesión con Google.")}
                width="350"
                shape="rectangular"
                theme="outline"
                size="large"
                text="signin_with"
                locale="es"
              />
            )}
          </div>

          <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
            ¿Tu empresa aún no está registrada?{" "}
            <a href="/empresa/registro" className="text-slate-900 font-semibold hover:underline">
              Crear cuenta
            </a>
          </p>

        </div>
      </div>

    </div>
  );
}
