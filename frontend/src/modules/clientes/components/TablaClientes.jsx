import { useState } from "react";

export default function TablaClientes({ clientes, onEditar, onEliminar, onToggleEstado, onBorrarDatos, onVerPerfil, onAgregar }) {
  // { id, paso: "eliminar" | "historial" | "anonimizar" }
  const [pendiente, setPendiente] = useState(null);
  const cerrar = () => setPendiente(null);

  const confirmarEliminar = async (id) => {
    const resultado = await onEliminar(id);
    setPendiente(resultado === "historial" ? { id, paso: "historial" } : null);
  };

  const renderAcciones = (c) => {
    const paso = pendiente?.id === c.id ? pendiente.paso : null;

    if (paso === "eliminar") return (
      <>
        <span style={s.confirmText}>¿Eliminar?</span>
        <button style={s.btnConfirmYes} onClick={() => confirmarEliminar(c.id)}>Sí</button>
        <button style={s.btnConfirmNo} onClick={cerrar}>No</button>
      </>
    );

    if (paso === "historial") return (
      <div style={s.historialBox}>
        <span style={s.historialText}>
          {c.anonimizado
            ? "Tiene compras registradas: se conserva sin datos personales."
            : "Tiene compras registradas, no se puede eliminar."}
        </span>
        <div style={s.actions}>
          {!c.anonimizado && c.activo && (
            <button style={s.warnBtn} onClick={() => { onToggleEstado(c.id); cerrar(); }}>Desactivar</button>
          )}
          {!c.anonimizado && (
            <button style={s.deleteBtn} onClick={() => setPendiente({ id: c.id, paso: "anonimizar" })}>Borrar datos personales</button>
          )}
          <button style={s.btnConfirmNo} onClick={cerrar}>{c.anonimizado ? "Cerrar" : "Cancelar"}</button>
        </div>
      </div>
    );

    if (paso === "anonimizar") return (
      <div style={s.historialBox}>
        <span style={s.historialText}>Se borran nombre, documento, teléfono, correo y dirección. Las compras se conservan. No se puede deshacer.</span>
        <div style={s.actions}>
          <button style={s.btnConfirmYes} onClick={() => { onBorrarDatos(c.id); cerrar(); }}>Borrar datos</button>
          <button style={s.btnConfirmNo} onClick={cerrar}>Cancelar</button>
        </div>
      </div>
    );

    return (
      <>
        <button style={s.perfilBtn} onClick={() => onVerPerfil(c.id)}>👁 Vista 360</button>
        {!c.anonimizado && <button style={s.editBtn} onClick={() => onEditar(c)}>✏️ Editar</button>}
        {!c.anonimizado && (
          <button style={c.activo ? s.warnBtn : s.editBtn} onClick={() => onToggleEstado(c.id)}>
            {c.activo ? "Desactivar" : "Activar"}
          </button>
        )}
        <button style={s.deleteBtn} onClick={() => setPendiente({ id: c.id, paso: "eliminar" })}>🗑️ Eliminar</button>
      </>
    );
  };

  if (clientes.length === 0) {
    return (
      <div style={s.empty}>
        <span style={s.emptyIcon}>👥</span>
        <p style={s.emptyTitle}>No hay clientes registrados</p>
        <p style={s.emptyText}>Los clientes que compren en tu tienda o registres desde el POS aparecerán aquí</p>
        {onAgregar && (
          <button style={s.emptyBtn} onClick={onAgregar}>+ Registrar primer cliente</button>
        )}
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <div style={{ overflowX: "auto" }}>
      <table style={{ ...s.table, minWidth: "540px" }}>
        <thead>
          <tr>
            <th style={s.th}>Cliente</th>
            <th style={s.th}>Usuario</th>
            <th style={s.th}>Teléfono</th>
            <th style={{ ...s.th, textAlign: "center" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} style={{ ...s.row, ...(c.activo ? {} : s.rowInactiva) }}>
              <td style={s.td}>
                <div style={s.clienteInfo}>
                  <div style={s.avatar}>
                    {c.nombre?.charAt(0).toUpperCase()}{c.apellido?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={s.nombre}>{c.nombre} {c.apellido}</div>
                    {!c.activo && (
                      <span style={s.badge}>{c.anonimizado ? "Datos borrados" : "Desactivado"}</span>
                    )}
                  </div>
                </div>
              </td>
              <td style={s.td}>
                <span style={s.usuario}>{c.usuario}</span>
              </td>
              <td style={s.td}>
                <span style={s.telefono}>{c.telefono || "—"}</span>
              </td>
              <td style={{ ...s.td, textAlign: "center" }}>
                <div style={s.actions}>{renderAcciones(c)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1.5px solid #cbd5e1",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "13px 16px", textAlign: "left",
    fontSize: "12px", fontWeight: "600", color: "#334155",
    backgroundColor: "#f8fafc", borderBottom: "1.5px solid #e2e8f0",
  },
  row: { borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" },
  rowInactiva: { backgroundColor: "#f8fafc", opacity: 0.7 },
  badge: {
    display: "inline-block", marginTop: "3px", padding: "1px 8px",
    fontSize: "11px", fontWeight: "600", borderRadius: "999px",
    backgroundColor: "#e2e8f0", color: "#475569",
  },
  warnBtn: {
    padding: "6px 12px", fontSize: "12px", fontWeight: "600",
    border: "1.5px solid #f59e0b", borderRadius: "8px",
    backgroundColor: "transparent", color: "#b45309", cursor: "pointer",
  },
  historialBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", maxWidth: "360px" },
  historialText: { fontSize: "12px", color: "#475569", lineHeight: 1.4 },
  td: { padding: "15px 16px", fontSize: "14px", color: "#0f172a" },

  clienteInfo: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    backgroundColor: "#eff6ff", color: "#2563eb",
    fontSize: "12px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  nombre: { fontSize: "14px", fontWeight: "600", color: "#0f172a" },

  usuario: { fontSize: "13px", color: "#64748b" },
  telefono: { fontSize: "13px", color: "#64748b" },

  actions: { display: "flex", gap: "6px", justifyContent: "center" },
  perfilBtn: {
    padding: "6px 12px", fontSize: "12px", fontWeight: "600",
    border: "1.5px solid #2563eb", borderRadius: "8px",
    backgroundColor: "transparent", color: "#2563eb", cursor: "pointer",
  },
  editBtn: {
    padding: "6px 12px", fontSize: "12px", fontWeight: "600",
    border: "1.5px solid #2563eb", borderRadius: "8px",
    backgroundColor: "transparent", color: "#2563eb", cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 12px", fontSize: "12px", fontWeight: "600",
    border: "1.5px solid #ef4444", borderRadius: "8px",
    backgroundColor: "transparent", color: "#dc2626", cursor: "pointer",
  },

  empty: {
    textAlign: "center", padding: "64px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
  },
  emptyIcon: { fontSize: "48px", lineHeight: 1 },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 },
  emptyText: { fontSize: "13px", color: "#94a3b8", maxWidth: "340px", lineHeight: 1.5, margin: 0 },
  emptyBtn: {
    marginTop: "6px", padding: "10px 22px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },

  confirmText: { fontSize: "12px", color: "#dc2626", fontWeight: "600", whiteSpace: "nowrap" },
  btnConfirmYes: {
    padding: "5px 10px", fontSize: "12px", fontWeight: "700",
    backgroundColor: "#dc2626", color: "white",
    border: "none", borderRadius: "7px", cursor: "pointer",
  },
  btnConfirmNo: {
    padding: "5px 10px", fontSize: "12px", fontWeight: "600",
    backgroundColor: "#f1f5f9", color: "#64748b",
    border: "1px solid #e2e8f0", borderRadius: "7px", cursor: "pointer",
  },
};
