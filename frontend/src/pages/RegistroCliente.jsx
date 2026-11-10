import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, XCircle, Loader2, Check } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useRegistroCliente, STR_LABELS, STR_BAR_COLORS, STR_TXT_COLORS } from "../modules/tienda/hooks/useRegistroCliente";
import { loginGoogleCliente } from "../services/api";
import { MerkaiLogo } from "../modules/tienda/components/MerkaiLogo";

const INPUT_BASE = "w-full px-3 py-2.5 rounded-[9px] border text-sm text-slate-900 bg-white outline-none transition-all";
const INPUT_CLS  = `${INPUT_BASE} border-slate-200 focus:border-[#3674B5] focus:ring-2 focus:ring-[#3674B5]/10 hover:border-slate-300`;

function Field({ id, label, children, full }) {
  return (
    <div className={full ? "col-span-2" : "col-span-1"}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RegistroCliente() {
  const navigate = useNavigate();
  const location = useLocation();
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
        setGoogleError(res.error || "No se pudo registrar con Google.");
      }
    } catch {
      setGoogleError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const {
    form, step, loading, error, showPass, setShowPass,
    departamentos, municipios, codigoReferidoFromUrl,
    strength, pwdsMatch, pwdsMismatch,
    handleChange, handleSiguiente, handleRegistro, goBack,
  } = useRegistroCliente();

  const confirmBorder = pwdsMismatch
    ? "border-red-300 focus:border-red-400 focus:ring-red-100/50"
    : pwdsMatch
    ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-50"
    : "border-slate-200 focus:border-[#3674B5] focus:ring-[#3674B5]/10 hover:border-slate-300";

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Panel izquierdo (solo desktop) ── */}
      <div
        className="hidden lg:flex flex-col w-[320px] flex-shrink-0 items-center justify-center p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0a1628 0%, #0e2a42 55%, #0f1f35 100%)" }}
      >
        <div
          className="absolute -top-20 -right-28 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(54,116,181,0.22) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 w-full flex flex-col gap-8">
          <div className="flex items-center gap-2.5">
            <MerkaiLogo size={32} />
            <span className="text-white font-bold text-base">Merkai · Tienda</span>
          </div>

          <div>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-2.5">Registro gratuito</p>
            <h2 className="text-white text-xl font-extrabold tracking-tight leading-snug mb-3">
              Crea tu cuenta y empieza a comprar
            </h2>
            <p className="text-white/55 text-sm leading-relaxed">
              Accede al catálogo de tus tiendas favoritas y gestiona tus pedidos en un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              { n: 1, label: "Tu cuenta",    desc: "Datos básicos y contraseña" },
              { n: 2, label: "Tu ubicación", desc: "Para calcular el envío" },
            ].map((st) => (
              <div key={st.n} className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-all duration-300 ${
                  step > st.n   ? "bg-[#3674B5] text-white" :
                  step === st.n ? "bg-white text-[#3674B5]" :
                                  "bg-white/10 text-white/30"
                }`}>
                  {step > st.n ? <Check className="w-4 h-4" strokeWidth={2.5} /> : st.n}
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-tight mb-0.5 transition-colors duration-300 ${step >= st.n ? "text-white" : "text-white/30"}`}>
                    {st.label}
                  </p>
                  <p className={`text-xs leading-snug transition-colors duration-300 ${step >= st.n ? "text-white/50" : "text-white/20"}`}>
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-5 flex flex-col gap-2">
            <p className="text-white/40 text-xs">¿Ya tienes cuenta?</p>
            <button
              onClick={() => navigate("/tienda/login")}
              className="self-start text-white/75 text-xs font-medium border border-white/20 rounded-lg px-3.5 py-1.5 hover:bg-white/10 transition-colors"
            >
              Iniciar sesión →
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Barra de progreso */}
          <div className="mb-7">
            <div className="flex justify-between text-xs text-slate-400 font-medium mb-2">
              <span>Paso {step} de 2</span>
              <span>{step === 1 ? "50%" : "100%"}</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3674B5] rounded-full transition-all duration-500"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              {step === 1 ? "Datos de tu cuenta" : "¿Dónde te enviamos?"}
            </h2>
            <p className="text-sm text-slate-500">
              {step === 1 ? "Información básica para crear tu perfil" : "Tu dirección de entrega predeterminada"}
            </p>
          </div>

          {codigoReferidoFromUrl && (
            <div className="flex gap-3 items-start bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-sm mb-4 leading-snug">
              <span className="text-lg flex-shrink-0">🎁</span>
              <div>
                <strong className="block mb-0.5">¡Código de referido aplicado!</strong>
                Recibirás un descuento en tu primera compra — código:{" "}
                <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs tracking-wider">
                  {codigoReferidoFromUrl}
                </code>
              </div>
            </div>
          )}

          {(error || googleError) && (
            <div role="alert" className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error || googleError}</span>
            </div>
          )}

          {/* Google registration — solo visible en paso 1 */}
          {step === 1 && (
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 whitespace-nowrap">Registro rápido con Google</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="flex justify-center mb-4">
                {loadingGoogle ? (
                  <div className="w-full py-3 flex items-center justify-center gap-2 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setGoogleError("No se pudo registrar con Google.")}
                    width="280"
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    text="signup_with"
                    locale="es"
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 whitespace-nowrap">o completa el formulario</span>
                <span className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
          )}

          {/* ── PASO 1 ── */}
          {step === 1 && (
            <form onSubmit={handleSiguiente} noValidate>
              <div className="grid grid-cols-2 gap-3.5 mb-6">

                <Field id="nombre" label="Nombre">
                  <input id="nombre" name="nombre" className={INPUT_CLS}
                    placeholder="Juan" value={form.nombre} onChange={handleChange} autoComplete="given-name" />
                </Field>

                <Field id="apellido" label="Apellido">
                  <input id="apellido" name="apellido" className={INPUT_CLS}
                    placeholder="García" value={form.apellido} onChange={handleChange} autoComplete="family-name" />
                </Field>

                <Field id="usuario" label="Correo electrónico" full>
                  <input id="usuario" name="usuario" type="email" className={INPUT_CLS}
                    placeholder="tucorreo@gmail.com" value={form.usuario} onChange={handleChange} autoComplete="email" />
                </Field>

                <Field id="telefono" label="Teléfono" full>
                  <input id="telefono" name="telefono" type="tel" className={INPUT_CLS}
                    placeholder="+57 300 000 0000" value={form.telefono} onChange={handleChange} autoComplete="tel" />
                </Field>

                <Field id="contrasena" label="Contraseña" full>
                  <div className="relative">
                    <input
                      id="contrasena" name="contrasena"
                      type={showPass ? "text" : "password"}
                      className={`${INPUT_CLS} pr-11`}
                      placeholder="Mínimo 6 caracteres"
                      value={form.contrasena}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.contrasena && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-200 ${i <= strength ? STR_BAR_COLORS[strength] : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <span className={`text-[11px] font-semibold ${STR_TXT_COLORS[strength]}`}>
                        {STR_LABELS[strength]}
                      </span>
                    </div>
                  )}
                </Field>

                <Field id="confirmar" label="Confirmar contraseña" full>
                  <div className="relative">
                    <input
                      id="confirmar" name="confirmar" type="password"
                      className={`${INPUT_BASE} pr-11 ${confirmBorder}`}
                      placeholder="Repite tu contraseña"
                      value={form.confirmar}
                      onChange={handleChange}
                      autoComplete="new-password"
                      aria-invalid={pwdsMismatch}
                      aria-describedby={pwdsMismatch ? "confirmar-error" : undefined}
                    />
                    {form.confirmar && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {pwdsMatch
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <XCircle      className="w-4 h-4 text-red-400" />}
                      </span>
                    )}
                  </div>
                  {pwdsMismatch && (
                    <p id="confirmar-error" role="alert" className="text-xs text-red-500 font-medium mt-1.5">
                      Las contraseñas no coinciden
                    </p>
                  )}
                </Field>

              </div>

              <button type="submit"
                className="w-full py-3.5 bg-[#3674B5] text-white font-bold rounded-xl text-[15px] hover:bg-[#2d64a0] active:scale-[0.99] transition-all">
                Continuar →
              </button>
            </form>
          )}

          {/* ── PASO 2 ── */}
          {step === 2 && (
            <form onSubmit={handleRegistro} noValidate>
              <div className="grid grid-cols-2 gap-3.5 mb-6">

                <Field id="tipo_documento" label="Tipo de documento" full>
                  <select id="tipo_documento" name="tipo_documento"
                    className={`${INPUT_CLS} cursor-pointer`}
                    value={form.tipo_documento} onChange={handleChange}>
                    <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                    <option value="Tarjeta de identidad">Tarjeta de identidad</option>
                    <option value="Cédula de extranjería">Cédula de extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </Field>

                <Field id="numero_documento" label="Número de documento" full>
                  <input id="numero_documento" name="numero_documento" className={INPUT_CLS}
                    placeholder="1234567890" value={form.numero_documento} onChange={handleChange} />
                </Field>

                <Field id="_departamento" label="Departamento">
                  <select id="_departamento" name="_departamento"
                    className={`${INPUT_CLS} cursor-pointer`}
                    value={form._departamento} onChange={handleChange}>
                    <option value="">Selecciona</option>
                    {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </Field>

                <Field id="id_municipio" label="Municipio">
                  <select id="id_municipio" name="id_municipio"
                    className={`${INPUT_CLS} cursor-pointer ${!form._departamento ? "text-slate-400" : ""}`}
                    value={form.id_municipio} onChange={handleChange} disabled={!form._departamento}>
                    <option value="">{form._departamento ? "Selecciona" : "Elige depto. primero"}</option>
                    {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </Field>

                <Field id="direccion" label="Dirección de entrega" full>
                  <input id="direccion" name="direccion" className={INPUT_CLS}
                    placeholder="Calle 123 #45-67, Apto 201"
                    value={form.direccion} onChange={handleChange} autoComplete="street-address" />
                </Field>

                <div className="col-span-2">
                  <p className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2.5 leading-relaxed">
                    Estos datos son opcionales y te ayudan a calcular el costo de envío.
                    Puedes completarlos desde tu perfil en cualquier momento.
                  </p>
                </div>

              </div>

              <div className="flex gap-2.5">
                <button type="button" onClick={goBack}
                  className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl text-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
                  ← Atrás
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 bg-[#3674B5] text-white font-bold rounded-xl text-[15px] hover:bg-[#2d64a0] active:scale-[0.99] transition-all disabled:opacity-75 flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Creando cuenta...</>
                  ) : "Crear cuenta gratis"}
                </button>
              </div>

              <p className="text-center mt-4">
                <button type="button" onClick={() => handleRegistro()} disabled={loading}
                  className="text-slate-400 text-sm hover:text-slate-600 underline underline-offset-2 transition-colors">
                  Omitir y entrar a la tienda
                </button>
              </p>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
