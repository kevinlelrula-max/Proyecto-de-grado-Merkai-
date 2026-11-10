import { X, BarChart2 } from "lucide-react";

export default function ModalUsos({ cuponUsos, loading, onCerrar }) {
  const { cupon, usos = [] } = cuponUsos || {};

  return (
    <>
      <div style={s.overlay} onClick={onCerrar} />
      <div style={s.modal}>

        <div style={s.header}>
          <div>
            <h3 style={s.title}>Usos del cupón <span style={s.codigo}>{cupon?.codigo}</span></h3>
            <p style={s.sub}>{usos.length} uso{usos.length !== 1 ? "s" : ""} registrado{usos.length !== 1 ? "s" : ""}</p>
          </div>
          <button style={s.closeBtn} onClick={onCerrar}>
            <X size={16} />
          </button>
        </div>

        <div style={s.body}>
          {loading ? (
            <div style={s.loading}>Cargando...</div>
          ) : usos.length === 0 ? (
            <div style={s.empty}>
              <BarChart2 size={36} color="#2563eb" />
              <p style={s.emptyText}>Este cupón aún no ha sido usado</p>
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Cliente</th>
                  <th style={s.th}>Pedido #</th>
                  <th style={s.th}>Descuento</th>
                  <th style={s.th}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {usos.map((uso) => (
                  <tr key={uso.id}>
                    <td style={s.td}>
                      {uso.cliente_nombre
                        ? `${uso.cliente_nombre} ${uso.cliente_apellido || ""}`
                        : "—"}
                    </td>
                    <td style={s.td}>{uso.pedido_id ? `#${uso.pedido_id}` : "—"}</td>
                    <td style={{ ...s.td, color: "#15803d", fontWeight: "700" }}>
                      ${Number(uso.descuento_aplicado).toLocaleString("es-CO")}
                    </td>
                    <td style={s.td}>
                      {new Date(uso.fecha).toLocaleDateString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", zIndex: 400, backdropFilter: "blur(3px)" },
  modal: {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%", maxWidth: "520px",
    backgroundColor: "white", borderRadius: "20px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
    zIndex: 401, fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxHeight: "80vh", display: "flex", flexDirection: "column",
  },
  header: {
    padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  },
  title:    { fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 },
  codigo:   { fontFamily: "'DM Mono', monospace", color: "#2563eb" },
  sub:      { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
    padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center",
  },
  body:     { padding: "16px 24px", overflowY: "auto", flex: 1 },
  loading:  { textAlign: "center", padding: "40px", fontSize: "14px", color: "#64748b" },
  empty:    { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "40px" },
  emptyText:{ fontSize: "14px", color: "#64748b" },
  table:    { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    textAlign: "left", padding: "8px 10px",
    fontSize: "11px", fontWeight: "700", color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.04em",
    borderBottom: "1px solid #e2e8f0",
  },
  td: { padding: "10px 10px", color: "#374151", borderBottom: "1px solid #f1f5f9" },
};
