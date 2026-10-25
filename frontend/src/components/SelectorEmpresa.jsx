import { useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const AVATAR_COLORS = [
  "bg-sky-500","bg-violet-500","bg-emerald-500","bg-amber-500",
  "bg-red-500","bg-pink-500","bg-teal-500","bg-orange-500",
  "bg-indigo-500","bg-lime-500",
];
const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const rolLabel    = (r)  => r === 1 ? "SuperAdmin" : r === 2 ? "Administrador" : "Empleado";

export default function SelectorEmpresa({ empresas, token, rolId = 1, onSelect, onClose }) {
  const [vista,   setVista]   = useState("lista");
  const [form,    setForm]    = useState({ nombre: "", nit: "", email: "", telefono: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const seleccionar = async (empresa_id) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/api/auth/seleccionar-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ empresa_id }),
      });
      const data = await res.json();
      if (res.ok && data.token) onSelect(data);
      else setError(data.error || "Error al seleccionar empresa");
    } catch { setError("No se pudo conectar. Intenta de nuevo."); }
    finally  { setLoading(false); }
  };

  const crear = async () => {
    if (!form.nombre.trim()) { setError("El nombre de la tienda es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/api/empresa/crear-adicional`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.token) onSelect(data);
      else setError(data.error || "Error al crear la tienda");
    } catch { setError("No se pudo conectar. Intenta de nuevo."); }
    finally  { setLoading(false); }
  };

  const volverALista = () => {
    setVista("lista"); setError("");
    setForm({ nombre: "", nit: "", email: "", telefono: "" });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-auto"
         style={{
           fontFamily: "'Inter','Segoe UI',sans-serif",
           background: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)",
         }}>

      {/* Círculos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(255,255,255,0.02)", top:-100, left:-150 }}/>
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.02)", bottom:-80, right:-100 }}/>
        <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"rgba(255,255,255,0.02)", top:"40%", right:"15%" }}/>
      </div>

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full overflow-hidden"
           style={{ maxWidth: 620 }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-10 pt-9 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo-merkai-icon.png" alt="Merkai" width="34" height="34" style={{ objectFit: "contain" }} />
            <span className="font-bold text-gray-900 text-lg tracking-tight">Merkai</span>
          </div>

          <div className="flex items-center gap-2">
            {(rolId === 1 || rolId === 2) && vista === "lista" && (
              <button
                onClick={() => { setVista("crear"); setError(""); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
              >
                <span className="text-base leading-none">+</span> Crear negocio
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-10"/>

        {/* ── Título ── */}
        <div className="px-10 pt-7 pb-5">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {vista === "lista" ? "Bienvenido de nuevo" : "Nuevo negocio"}
          </h2>
          <p className="text-sm text-gray-400 mt-1.5">
            {vista === "lista" ? "Selecciona el panel que quieres gestionar" : "Agrega un negocio adicional a tu cuenta"}
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mx-10 mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Lista ── */}
        {vista === "lista" && (
          <div className="px-6 pb-8">
            <div className="flex flex-col gap-1 mb-4">
              {empresas.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => seleccionar(emp.id)}
                  disabled={loading}
                  className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left group disabled:opacity-60"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg ${avatarColor(emp.id)}`}>
                    {emp.logo_url
                      ? <img src={`${BASE_URL}${emp.logo_url}`} alt="" className="w-full h-full object-contain rounded-2xl"/>
                      : emp.nombre.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">{emp.nombre}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{rolLabel(emp.rol_id)}</div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                    <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>

          
          </div>
        )}

        {/* ── Formulario ── */}
        {vista === "crear" && (
          <div className="px-10 pb-9">
            <div className="flex flex-col gap-4 mb-6">
              {[
                { name: "nombre",   label: "Nombre de la tienda *", placeholder: "Mi tienda" },
                { name: "nit",      label: "NIT (opcional)",         placeholder: "900.123.456-1" },
                { name: "email",    label: "Email (opcional)",       placeholder: "tienda@correo.com" },
                { name: "telefono", label: "Teléfono (opcional)",    placeholder: "3001234567" },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors"
                    value={form[name]}
                    onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={volverALista} className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 font-medium transition-colors">
                Volver
              </button>
              <button
                onClick={crear}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? "Creando..." : "Crear Negocio"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}