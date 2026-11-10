import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registroCliente } from "../../../services/api";
import { getDepartamentos, getMunicipios } from "../../ubicacion/services/ubicacion.api";

export const STR_LABELS     = ["", "Débil", "Regular", "Buena", "Fuerte"];
export const STR_BAR_COLORS = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"];
export const STR_TXT_COLORS = ["", "text-red-500", "text-amber-500", "text-blue-500", "text-emerald-600"];

export function pwdStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 4);
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function useRegistroCliente() {
  const navigate = useNavigate();
  const location = useLocation();

  const empresaFromStorage    = (() => { try { return JSON.parse(localStorage.getItem("ultima_empresa") || "null"); } catch { return null; } })();
  const empresaIdFromState    = location.state?.empresa_id || empresaFromStorage?.id || null;
  const empresaSlugFromState  = location.state?.empresa_slug || localStorage.getItem("ultima_empresa_slug") || null;
  const codigoReferidoFromUrl = new URLSearchParams(location.search).get("ref")
                                || location.state?.codigo_referido
                                || localStorage.getItem("ultima_ref_codigo")
                                || null;

  const [step, setStep]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios]       = useState([]);

  const [form, setForm] = useState({
    nombre: "", apellido: "", usuario: "", contrasena: "", confirmar: "",
    telefono: "", direccion: "", tipo_documento: "Cédula de ciudadanía",
    numero_documento: "", _departamento: "", id_municipio: "",
    rol_id: 4,
    empresa_id: empresaIdFromState,
    codigo_referido_invitante: codigoReferidoFromUrl,
  });

  useEffect(() => {
    getDepartamentos(null).then(setDepartamentos).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form._departamento) { setMunicipios([]); return; }
    getMunicipios(form._departamento, null).then(setMunicipios).catch(console.error);
  }, [form._departamento]);

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;
    if (name === "_departamento") {
      setForm((p) => ({ ...p, _departamento: value, id_municipio: "" }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const paso1Error = () => {
    if (!form.nombre || !form.apellido)     return "Ingresa tu nombre completo.";
    if (!form.usuario)                      return "Ingresa tu correo electrónico.";
    if (!emailValido(form.usuario))         return "El correo electrónico no es válido.";
    if (!form.contrasena)                   return "Ingresa una contraseña.";
    if (form.contrasena.length < 6)         return "La contraseña debe tener al menos 6 caracteres.";
    if (form.contrasena !== form.confirmar) return "Las contraseñas no coinciden.";
    if (!form.telefono)                     return "Ingresa tu número de teléfono.";
    return "";
  };

  const handleSiguiente = (e) => {
    e.preventDefault();
    const err = paso1Error();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleRegistro = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { _departamento, confirmar, ...payload } = form;
      payload.id_municipio = payload.id_municipio ? Number(payload.id_municipio) : null;
      const res = await registroCliente(payload);
      if (res.token) {
        localStorage.setItem("cliente_token",  res.token);
        localStorage.setItem("cliente_id",     res.cliente_id);
        localStorage.setItem("cliente_nombre", res.nombre);
        localStorage.removeItem("ultima_ref_codigo");
        navigate(empresaSlugFromState ? `/tienda/${empresaSlugFromState}` : "/tienda");
      } else {
        setError(res.error || "Error al registrar. Verifica los datos.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const strength     = pwdStrength(form.contrasena);
  const pwdsMatch    = form.confirmar.length > 0 && form.contrasena === form.confirmar;
  const pwdsMismatch = form.confirmar.length > 0 && form.contrasena !== form.confirmar;

  return {
    form, step, loading, error, showPass, setShowPass,
    departamentos, municipios, codigoReferidoFromUrl,
    strength, pwdsMatch, pwdsMismatch,
    handleChange, handleSiguiente, handleRegistro,
    goBack: () => { setError(""); setStep(1); },
  };
}
