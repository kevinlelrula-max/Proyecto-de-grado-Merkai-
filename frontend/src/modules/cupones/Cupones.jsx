import { CheckCircle, AlertTriangle, Ticket, Lightbulb } from "lucide-react";
import { useCupones } from "./hooks/useCupones";
import CuponCard  from "./components/CuponCard";
import CuponForm  from "./components/CuponForm";
import ModalUsos  from "./components/ModalUsos";
import { SkeletonGrid } from "../../components/SkeletonLoader";

export default function Cupones() {
  const {
    cupones,
    loading,
    error,
    exito,
    guardando,
    editandoId,
    mostrarForm,
    form,
    cuponUsos,
    mostrarUsos,
    loadingUsos,
    handleChange,
    abrirFormNuevo,
    abrirFormEditar,
    cerrarForm,
    guardar,
    toggle,
    eliminar,
    verUsos,
    cerrarUsos,
  } = useCupones();

  const activos  = cupones.filter((c) => c.activo);
  const inactivos = cupones.filter((c) => !c.activo);

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Cupones y descuentos</h2>
          <p style={s.subtitle}>
            Crea códigos de descuento para tus clientes cada empresa define sus propias condiciones
          </p>
        </div>
        <button style={s.btnNuevo} onClick={abrirFormNuevo}>
          + Nuevo cupón
        </button>
      </div>

      {/* Notificaciones */}
      {exito && (
        <div style={s.exitoBox}>
          <CheckCircle size={14} style={{ flexShrink: 0 }} />
          {exito}
        </div>
      )}
      {error && !mostrarForm && (
        <div style={s.errorBox}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {}
      {loading ? (
        <SkeletonGrid count={3} height={180} />
      ) : cupones.length === 0 ? (
        <div style={s.empty}>
          <Ticket size={52} color="#2563eb" />
          <p style={s.emptyTitle}>Aún no tienes cupones</p>
          <p style={s.emptyDesc}>
            Crea cupones de descuento para atraer nuevos clientes, reactivar los que no compran hace tiempo
            o hacer campañas especiales de temporada.
          </p>
          <button style={s.emptyBtn} onClick={abrirFormNuevo}>
            Crear primer cupón
          </button>
        </div>
      ) : (
        <>
          {}
          <div style={s.infoBox}>
            <Lightbulb size={16} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={s.infoText}>
              Tus clientes pueden ingresar el código en el carrito de compras antes de confirmar el pedido.
              Los cupones inactivos o expirados no aplican.
            </p>
          </div>

          {}
          {activos.length > 0 && (
            <div>
              <p style={s.sectionLabel}>Activos ({activos.length})</p>
              <div style={s.grid}>
                {activos.map((c) => (
                  <CuponCard
                    key={c.id}
                    cupon={c}
                    onEditar={abrirFormEditar}
                    onToggle={toggle}
                    onEliminar={eliminar}
                    onVerUsos={verUsos}
                  />
                ))}
              </div>
            </div>
          )}

          {}
          {inactivos.length > 0 && (
            <div>
              <p style={s.sectionLabel}>Inactivos ({inactivos.length})</p>
              <div style={s.grid}>
                {inactivos.map((c) => (
                  <CuponCard
                    key={c.id}
                    cupon={c}
                    onEditar={abrirFormEditar}
                    onToggle={toggle}
                    onEliminar={eliminar}
                    onVerUsos={verUsos}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {}
      {mostrarForm && (
        <CuponForm
          form={form}
          editandoId={editandoId}
          guardando={guardando}
          error={error}
          onChange={handleChange}
          onGuardar={guardar}
          onCancelar={cerrarForm}
        />
      )}

      {/* Modal usos */}
      {mostrarUsos && (
        <ModalUsos
          cuponUsos={cuponUsos}
          loading={loadingUsos}
          onCerrar={cerrarUsos}
        />
      )}
    </div>
  );
}

const s = {
  page: {
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
  },
  title:    { fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "4px" },
  subtitle: { fontSize: "14px", color: "#334155", lineHeight: "1.5", maxWidth: "520px" },
  btnNuevo: {
    padding: "10px 20px", backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px", fontSize: "14px",
    fontWeight: "600", cursor: "pointer", flexShrink: 0,
  },
  exitoBox: {
    padding: "12px 16px", backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0", borderRadius: "10px",
    fontSize: "13px", fontWeight: "600", color: "#15803d",
    display: "flex", alignItems: "center", gap: "8px",
  },
  errorBox: {
    padding: "12px 16px", backgroundColor: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: "10px",
    fontSize: "13px", color: "#b91c1c",
    display: "flex", alignItems: "center", gap: "8px",
  },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "10px", padding: "60px 24px", textAlign: "center",
  },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a" },
  emptyDesc:  { fontSize: "14px", color: "#334155", maxWidth: "420px", lineHeight: "1.6" },
  emptyBtn: {
    marginTop: "8px", padding: "11px 24px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "14px", fontWeight: "600", cursor: "pointer",
  },
  infoBox: {
    display: "flex", alignItems: "flex-start", gap: "10px",
    padding: "14px 16px", backgroundColor: "#fffbeb",
    borderRadius: "12px", border: "1px solid #fde68a",
  },
  infoText: { fontSize: "13px", color: "#92400e", lineHeight: "1.6" },
  sectionLabel: {
    fontSize: "11px", fontWeight: "700", color: "#334155",
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "16px",
  },
};
