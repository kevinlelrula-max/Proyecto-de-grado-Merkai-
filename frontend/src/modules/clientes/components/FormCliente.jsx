import { useState, useEffect } from "react";
import { User, Mail, Lock, Phone, MapPin, CreditCard, Eye, EyeOff } from "lucide-react";

const FIELDS_NUEVO = [
  { name: "nombre",           label: "Nombre",              icon: User,       type: "text",     half: true,  placeholder: "Ej: Juan"             },
  { name: "apellido",         label: "Apellido",            icon: User,       type: "text",     half: true,  placeholder: "Ej: García"            },
  { name: "usuario",          label: "Correo electrónico",  icon: Mail,       type: "email",    half: false, placeholder: "juan@correo.com"       },
  { name: "contrasena",       label: "Contraseña",          icon: Lock,       type: "password", half: false, placeholder: "Mínimo 6 caracteres"   },
  { name: "telefono",         label: "Teléfono",            icon: Phone,      type: "tel",      half: true,  placeholder: "+57 300 000 0000"      },
  { name: "numero_documento", label: "Documento",           icon: CreditCard, type: "text",     half: true,  placeholder: "1234567890"            },
  { name: "direccion",        label: "Dirección",           icon: MapPin,     type: "text",     half: false, placeholder: "Calle 123 #45-67"      },
];

const FIELDS_EDITAR = FIELDS_NUEVO.filter(f => f.name !== "contrasena");

export default function FormCliente({ onGuardar, onCancelar, clienteSeleccionado }) {
  const [form, setForm] = useState({
    nombre: "", apellido: "", usuario: "", contrasena: "",
    telefono: "", direccion: "", numero_documento: "", id_municipio: 11001,
  });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (clienteSeleccionado) {
      setForm({
        nombre: clienteSeleccionado.nombre || "",
        apellido: clienteSeleccionado.apellido || "",
        usuario: clienteSeleccionado.usuario || "",
        contrasena: "",
        telefono: clienteSeleccionado.telefono || "",
        direccion: clienteSeleccionado.direccion || "",
        numero_documento: clienteSeleccionado.numero_documento || "",
        id_municipio: clienteSeleccionado.id_municipio || 11001,
      });
    } else {
      setForm({ nombre: "", apellido: "", usuario: "", contrasena: "",
        telefono: "", direccion: "", numero_documento: "", id_municipio: 11001 });
    }
  }, [clienteSeleccionado]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => { e.preventDefault(); onGuardar(form); };

  const fields = clienteSeleccionado ? FIELDS_EDITAR : FIELDS_NUEVO;

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.grid}>
        {fields.map((f) => {
          const Icon = f.icon;
          const isPass = f.type === "password";
          return (
            <div key={f.name} style={f.half ? s.halfCol : s.fullCol}>
              <label style={s.label}>{f.label}</label>
              <div style={s.inputWrap}>
                <Icon size={15} style={s.icon} />
                <input
                  name={f.name}
                  type={isPass ? (showPass ? "text" : "password") : f.type}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={handleChange}
                  autoComplete={isPass ? "new-password" : undefined}
                  style={s.input}
                  onFocus={e => Object.assign(e.target.style, s.inputFocus)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: "#e2e8f0", boxShadow: "none" })}
                />
                {isPass && (
                  <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn} tabIndex={-1}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!clienteSeleccionado && (
        <p style={s.hint}>
          Se enviará un correo de bienvenida al cliente con sus credenciales de acceso.
        </p>
      )}

      <div style={s.actions}>
        {onCancelar && (
          <button type="button" onClick={onCancelar} style={s.btnCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" style={s.btnSave}>
          {clienteSeleccionado ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}

const s = {
  form: { display: "flex", flexDirection: "column", gap: 0 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" },
  fullCol: { gridColumn: "1 / -1" },
  halfCol: { gridColumn: "span 1" },

  label: { display: "block", fontSize: "12px", fontWeight: "600", color: "#475569",
    marginBottom: "6px", letterSpacing: "0.01em" },

  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  icon: { position: "absolute", left: "11px", color: "#94a3b8", flexShrink: 0, pointerEvents: "none" },
  eyeBtn: { position: "absolute", right: "10px", background: "none", border: "none",
    cursor: "pointer", color: "#94a3b8", padding: "2px", display: "flex", alignItems: "center" },

  input: {
    width: "100%", padding: "9px 12px 9px 34px",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    fontSize: "13.5px", color: "#0f172a", backgroundColor: "#fff",
    outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  },
  inputFocus: { borderColor: "#2563eb", boxShadow: "0 0 0 3px rgba(37,99,235,0.1)" },

  hint: { fontSize: "12px", color: "#94a3b8", backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 13px",
    margin: "0 0 18px", lineHeight: "1.5" },

  actions: { display: "flex", gap: "10px", justifyContent: "flex-end" },
  btnCancel: {
    padding: "9px 20px", borderRadius: "9px", border: "1.5px solid #e2e8f0",
    backgroundColor: "#fff", color: "#64748b", fontSize: "13.5px",
    fontWeight: "600", cursor: "pointer",
  },
  btnSave: {
    padding: "9px 24px", borderRadius: "9px", border: "none",
    backgroundColor: "#2563eb", color: "white", fontSize: "13.5px",
    fontWeight: "700", cursor: "pointer",
  },
};