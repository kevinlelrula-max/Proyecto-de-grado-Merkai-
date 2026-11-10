import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { User, Mail, Lock, Phone, FileText, MapPin, Shield } from "lucide-react";
import { getRoles } from "../services/usuarios.api";

export default function FormUsuario({ usuario, onGuardar, onCerrar }) {
  const token    = localStorage.getItem("token");
  const esEdicion = !!usuario;

  const [roles, setRoles]       = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre:           usuario?.nombre           || "",
    apellido:         usuario?.apellido         || "",
    usuario:          usuario?.usuario          || "",
    contrasena:       "",
    telefono:         usuario?.telefono         || "",
    direccion:        usuario?.direccion        || "",
    numero_documento: usuario?.numero_documento || "",
    rol_id:           usuario?.rol_id           || 3,
  });

  useEffect(() => {
    getRoles(token).then(setRoles).catch(console.error);
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.usuario) { toast.error("Nombre y usuario son obligatorios"); return; }
    if (!esEdicion && !form.contrasena) { toast.error("La contraseña es obligatoria"); return; }
    setGuardando(true);
    try { await onGuardar(form); } finally { setGuardando(false); }
  };

  const iniciales = `${form.nombre.charAt(0)}${form.apellido.charAt(0)}`.toUpperCase() || "?";

  return (
    <form onSubmit={handleSubmit}>

      {/* Avatar preview */}
      <div style={s.avatarPreview}>
        <div style={s.avatar}>{iniciales}</div>
        <div>
          <p style={s.avatarName}>{[form.nombre, form.apellido].filter(Boolean).join(" ") || "Nuevo usuario"}</p>
          <p style={s.avatarSub}>{form.usuario || "Sin usuario asignado"}</p>
        </div>
      </div>

      {/* Sección: Información personal */}
      <div style={s.sectionLabel}>
        <User size={12} color="#94a3b8" />
        Información personal
      </div>

      <div style={s.grid}>
        <Field label="Nombre *" icon={<User size={13} color="#94a3b8" />}>
          <input style={s.input} name="nombre" value={form.nombre} onChange={set("nombre")} placeholder="Juan" />
        </Field>
        <Field label="Apellido" icon={<User size={13} color="#94a3b8" />}>
          <input style={s.input} name="apellido" value={form.apellido} onChange={set("apellido")} placeholder="García" />
        </Field>
        <Field label="Teléfono" icon={<Phone size={13} color="#94a3b8" />}>
          <input style={s.input} name="telefono" value={form.telefono} onChange={set("telefono")} placeholder="+57 300 000 0000" />
        </Field>
        <Field label="N° documento" icon={<FileText size={13} color="#94a3b8" />}>
          <input style={s.input} name="numero_documento" value={form.numero_documento} onChange={set("numero_documento")} placeholder="Cédula o NIT" />
        </Field>
        <Field label="Dirección" icon={<MapPin size={13} color="#94a3b8" />} full>
          <input style={s.input} name="direccion" value={form.direccion} onChange={set("direccion")} placeholder="Calle 123 #45-67" />
        </Field>
      </div>

      {/* Sección: Acceso al sistema */}
      <div style={{ ...s.sectionLabel, marginTop: "20px" }}>
        <Shield size={12} color="#94a3b8" />
        Acceso al sistema
      </div>

      <div style={s.grid}>
        <Field label="Usuario / correo *" icon={<Mail size={13} color="#94a3b8" />} full>
          <input
            style={{ ...s.input, ...(esEdicion ? s.inputDisabled : {}) }}
            name="usuario" value={form.usuario} onChange={set("usuario")}
            placeholder="correo@empresa.com" disabled={esEdicion}
          />
          {esEdicion && <span style={s.hint}>El usuario no puede cambiarse después de creado</span>}
        </Field>

        {!esEdicion && (
          <Field label="Contraseña *" icon={<Lock size={13} color="#94a3b8" />} full>
            <input style={s.input} type="password" name="contrasena" value={form.contrasena} onChange={set("contrasena")} placeholder="Mínimo 6 caracteres" />
          </Field>
        )}

        <Field label="Rol del usuario *" icon={<Shield size={13} color="#94a3b8" />} full>
          <select style={s.input} name="rol_id" value={form.rol_id} onChange={set("rol_id")}>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Botones */}
      <div style={s.footer}>
        <button type="button" style={s.btnCancelar} onClick={onCerrar}>Cancelar</button>
        <button type="submit" style={s.btnGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, icon, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "span 1", display: "flex", flexDirection: "column", gap: "5px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

const s = {
  avatarPreview: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "16px", backgroundColor: "#f8fafc",
    borderRadius: "12px", marginBottom: "20px",
    border: "1px solid #e2e8f0",
  },
  avatar: {
    width: "48px", height: "48px", borderRadius: "50%",
    backgroundColor: "#2563eb", color: "white",
    fontSize: "18px", fontWeight: "800",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarName: { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" },
  avatarSub:  { fontSize: "12px", color: "#94a3b8", margin: 0 },

  sectionLabel: {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "11px", fontWeight: "700", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: "10px",
  },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },

  input: {
    width: "100%", padding: "9px 12px",
    border: "1.5px solid #e2e8f0", borderRadius: "9px",
    fontSize: "13px", color: "#0f172a", outline: "none",
    fontFamily: "inherit", backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  inputDisabled: { backgroundColor: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" },
  hint: { fontSize: "11px", color: "#94a3b8", marginTop: "3px" },

  footer: { display: "flex", gap: "10px", marginTop: "24px" },
  btnCancelar: {
    flex: 1, padding: "11px", background: "#f1f5f9", border: "none",
    borderRadius: "10px", fontSize: "13px", color: "#64748b", cursor: "pointer", fontWeight: "500",
  },
  btnGuardar: {
    flex: 2, padding: "11px", backgroundColor: "#2563eb",
    border: "none", borderRadius: "10px", fontSize: "13px",
    fontWeight: "700", color: "#fff", cursor: "pointer",
  },
};
