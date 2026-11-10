import { useState } from "react";
import { Users, KeyRound, Search, Shield, Briefcase, Tag } from "lucide-react";
import useUsuarios from "./hooks/useUsuarios.js";
import TablaUsuarios from "./components/TablaUsuarios";
import FormUsuario from "./components/FormUsuario";
import Gestionroles from "./components/Gestionroles";

export default function Usuarios() {
  const { usuarios, agregarUsuario, actualizarUsuario, toggleUsuario, eliminarUsuario } = useUsuarios();

  const [pestana, setPestana]         = useState("usuarios");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [busqueda, setBusqueda]       = useState("");

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nombre} ${u.apellido} ${u.usuario}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const admins    = usuarios.filter((u) => u.rol_id === 2).length;
  const empleados = usuarios.filter((u) => u.rol_id === 3).length;
  const otros     = usuarios.filter((u) => u.rol_id !== 2 && u.rol_id !== 3).length;

  const handleNuevo  = () => { setUsuarioEditar(null); setMostrarForm(true); };
  const handleEditar = (u) => { setUsuarioEditar(u); setMostrarForm(true); };

  const handleGuardar = async (data) => {
    if (usuarioEditar) await actualizarUsuario(usuarioEditar.id, data);
    else await agregarUsuario(data);
    setMostrarForm(false);
    setUsuarioEditar(null);
  };

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h2 style={s.headerTitle}>Usuarios y Roles</h2>
          <p style={s.headerSub}>Gestiona los miembros y permisos de tu empresa</p>
        </div>
        {pestana === "usuarios" && (
          <button style={s.btnNew} onClick={handleNuevo}>Nuevo usuario</button>
        )}
      </div>

      {/* PESTAÑAS */}
      <div style={s.tabs}>
        <button
          style={{ ...s.tab, ...(pestana === "usuarios" ? s.tabActive : {}) }}
          onClick={() => setPestana("usuarios")}
        >
          Usuarios
        </button>
        <button
          style={{ ...s.tab, ...(pestana === "roles" ? s.tabActive : {}) }}
          onClick={() => setPestana("roles")}
        >
          Roles
        </button>
      </div>

      {/* ════ PESTAÑA USUARIOS ════ */}
      {pestana === "usuarios" && (
        <>
          {/* STAT CARDS */}
          <div style={s.statsRow}>
            <StatCard icon={<Users size={16} />}    label="Usuarios en total"  value={usuarios.length} />
            <StatCard icon={<Shield size={16} />}   label="Administradores"    value={admins} />
            <StatCard icon={<Briefcase size={16} />} label="Empleados"         value={empleados} />
            <StatCard icon={<Tag size={16} />}      label="Con otro rol"       value={otros} />
          </div>

          {/* BUSCADOR */}
          <div style={s.controls}>
            <div style={s.searchWrap}>
              <Search size={15} color="#334155" style={{ position: "absolute", left: "12px" }} />
              <input
                style={s.searchInput}
                placeholder="Buscar usuario por nombre, apellido o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <span style={s.resultCount}>
              {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* TABLA */}
          <TablaUsuarios
            usuarios={usuariosFiltrados}
            onEditar={handleEditar}
            onToggle={toggleUsuario}
            onEliminar={async (id) => {
              if (!confirm("¿Eliminar este usuario?")) return;
              await eliminarUsuario(id);
            }}
          />
        </>
      )}

      {/* ════ PESTAÑA ROLES ════ */}
      {pestana === "roles" && <Gestionroles />}

      {/* MODAL */}
      {mostrarForm && (
        <div style={s.overlay} onClick={() => setMostrarForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>
                {usuarioEditar ? "Editar usuario" : "Nuevo usuario"}
              </h3>
              <button style={s.modalClose} onClick={() => setMostrarForm(false)}>✕</button>
            </div>
            <FormUsuario
              usuario={usuarioEditar}
              onGuardar={handleGuardar}
              onCerrar={() => setMostrarForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={s.statCard}>
      <div style={s.statIcon}>{icon}</div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const s = {
  page: { padding: "24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  headerTitle: { fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" },
  headerSub: { fontSize: "13px", color: "#334155", margin: 0 },
  btnNew: {
    padding: "10px 22px", backgroundColor: "#2563eb",
    color: "white", border: "none", borderRadius: "10px",
    cursor: "pointer", fontSize: "14px", fontWeight: "600", flexShrink: 0,
    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
  },

  tabs: { display: "flex", borderBottom: "2px solid #cbd5e1", marginBottom: "20px" },
  tab: {
    padding: "9px 20px", fontSize: "13px", fontWeight: "500",
    color: "#334155", background: "none", border: "none",
    borderBottom: "2px solid transparent", cursor: "pointer",
    transition: "all 0.15s", marginBottom: "-2px",
    display: "flex", alignItems: "center", gap: "6px",
  },
  tabActive: { color: "#2563eb", borderBottomColor: "#2563eb", fontWeight: "600" },

  statsRow: { display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" },
  statCard: {
    flex: 1, backgroundColor: "white", borderRadius: "16px",
    padding: "18px 20px", display: "flex", flexDirection: "column", gap: "6px",
    border: "1.5px solid #cbd5e1", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  statIcon: {
    color: "#334155", marginBottom: "2px",
    display: "flex", alignItems: "center",
  },
  statLabel: { fontSize: "12px", color: "#334155", fontWeight: "500" },
  statValue: { fontSize: "28px", fontWeight: "800", color: "#0f172a", lineHeight: 1 },

  controls: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  searchWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
  searchInput: {
    width: "100%", padding: "11px 12px 11px 36px",
    borderRadius: "10px", border: "2px solid #cbd5e1",
    fontSize: "14px", color: "#0f172a", outline: "none", backgroundColor: "#f8fafc",
    boxSizing: "border-box",
  },
  resultCount: { fontSize: "13px", color: "#334155", whiteSpace: "nowrap" },

  overlay: {
    position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.5)",
    backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 1000, padding: "20px",
  },
  modal: {
    backgroundColor: "white", borderRadius: "16px", padding: "28px",
    width: "100%", maxWidth: "480px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
    maxHeight: "90vh", overflowY: "auto",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 },
  modalClose: { background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#334155" },
};
