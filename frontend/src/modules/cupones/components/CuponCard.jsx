import { useState } from "react";
import { BarChart2, Pencil, Trash2, Calendar, Users, TrendingUp, Tag } from "lucide-react";

export default function CuponCard({ cupon, onEditar, onToggle, onEliminar, onVerUsos }) {
  const [confirmando, setConfirmando] = useState(false);

  const ahora = new Date();
  const vigente = !(
    (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) ||
    (cupon.fecha_fin    && new Date(cupon.fecha_fin)    < ahora)
  );
  const agotado   = cupon.usos_totales !== null && cupon.usos_actuales >= cupon.usos_totales;
  const operativo = cupon.activo && vigente && !agotado;

  const tipos = {
    porcentaje:   { label: `${cupon.valor}% descuento`,   accent: "#7c3aed", accentBg: "#ede9fe", accentLight: "#f5f3ff" },
    valor_fijo:   { label: `$${Number(cupon.valor).toLocaleString("es-CO")} dto.`, accent: "#1d4ed8", accentBg: "#dbeafe", accentLight: "#eff6ff" },
    envio_gratis: { label: "Envío gratis",                accent: "#15803d", accentBg: "#dcfce7", accentLight: "#f0fdf4" },
  };
  const t = tipos[cupon.tipo] || tipos.porcentaje;

  const usosTexto = cupon.usos_totales
    ? `${cupon.usos_actuales} / ${cupon.usos_totales}`
    : `${cupon.usos_actuales}`;

  return (
    <div style={{
      ...s.card,
      borderLeft: `4px solid ${operativo ? t.accent : "#cbd5e1"}`,
      opacity: operativo ? 1 : 0.65,
    }}>

      {/* Header: código + toggle */}
      <div style={s.header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={s.codigo}>{cupon.codigo}</span>
            <span style={{ ...s.tipoBadge, backgroundColor: t.accentBg, color: t.accent }}>
              {t.label}
            </span>
          </div>
          {cupon.descripcion && (
            <p style={s.descripcion}>{cupon.descripcion}</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {agotado  && <span style={s.badgeAgotado}>Agotado</span>}
          {!vigente && !agotado && <span style={s.badgeExpirado}>Expirado</span>}
          <div
            style={{ ...s.toggle, backgroundColor: cupon.activo ? t.accent : "#e2e8f0" }}
            onClick={() => onToggle(cupon.id)}
            title={cupon.activo ? "Desactivar" : "Activar"}
          >
            <div style={{ ...s.toggleDot, left: cupon.activo ? "18px" : "3px" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.stat}>
          <div style={s.statIcon}><Users size={12} /></div>
          <div>
            <span style={s.statLabel}>Usos</span>
            <span style={s.statVal}>{usosTexto}</span>
          </div>
        </div>
        {cupon.fecha_fin && (
          <div style={s.stat}>
            <div style={s.statIcon}><Calendar size={12} /></div>
            <div>
              <span style={s.statLabel}>Vence</span>
              <span style={s.statVal}>{new Date(cupon.fecha_fin).toLocaleDateString("es-CO")}</span>
            </div>
          </div>
        )}
        {parseFloat(cupon.minimo_compra) > 0 && (
          <div style={s.stat}>
            <div style={s.statIcon}><Tag size={12} /></div>
            <div>
              <span style={s.statLabel}>Mínimo</span>
              <span style={s.statVal}>${Number(cupon.minimo_compra).toLocaleString("es-CO")}</span>
            </div>
          </div>
        )}
        {parseFloat(cupon.total_ahorrado) > 0 && (
          <div style={s.stat}>
            <div style={{ ...s.statIcon, color: "#15803d" }}><TrendingUp size={12} /></div>
            <div>
              <span style={s.statLabel}>Total ahorrado</span>
              <span style={{ ...s.statVal, color: "#15803d" }}>
                ${Number(cupon.total_ahorrado).toLocaleString("es-CO")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={s.acciones}>
        {confirmando ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={s.confirmText}>¿Eliminar este cupón?</span>
            <button style={s.btnYes} onClick={() => { onEliminar(cupon.id); setConfirmando(false); }}>Sí</button>
            <button style={s.btnNo}  onClick={() => setConfirmando(false)}>No</button>
          </div>
        ) : (
          <>
            <button style={s.btnSecundario} onClick={() => onVerUsos(cupon)}>
              <BarChart2 size={13} /> Ver usos
            </button>
            <button style={s.btnSecundario} onClick={() => onEditar(cupon)}>
              <Pencil size={13} /> Editar
            </button>
            <button style={s.btnEliminar} onClick={() => setConfirmando(true)}>
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  card: {
    backgroundColor: "white",
    borderRadius: "14px",
    border: "1.5px solid #e2e8f0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    transition: "box-shadow 0.15s",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  codigo: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "0.06em",
    fontFamily: "'DM Mono', 'Fira Mono', monospace",
  },
  tipoBadge: {
    fontSize: "13px",
    fontWeight: "700",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  descripcion: {
    fontSize: "14px",
    color: "#0f172a",
    lineHeight: "1.5",
    margin: "6px 0 0",
  },
  toggle: {
    width: "38px", height: "22px", borderRadius: "999px",
    position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
  },
  toggleDot: {
    position: "absolute", top: "4px",
    width: "14px", height: "14px",
    backgroundColor: "white", borderRadius: "50%",
    transition: "left 0.2s",
  },
  badgeAgotado:  { fontSize: "10px", fontWeight: "700", backgroundColor: "#fef2f2", color: "#b91c1c", padding: "2px 8px", borderRadius: "20px" },
  badgeExpirado: { fontSize: "10px", fontWeight: "700", backgroundColor: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "20px" },
  stats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: "1 1 auto",
    minWidth: "80px",
  },
  statIcon: {
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#0f172a",
    display: "block",
  },
  statVal: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a",
    display: "block",
  },
  acciones: {
    display: "flex",
    gap: "8px",
    paddingTop: "4px",
    borderTop: "1px solid #f1f5f9",
  },
  btnSecundario: {
    flex: 1, padding: "10px 0", fontSize: "14px", fontWeight: "600",
    backgroundColor: "#f8fafc", color: "#0f172a",
    border: "1px solid #e2e8f0", borderRadius: "8px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  },
  btnEliminar: {
    padding: "8px 14px",
    backgroundColor: "#fef2f2", color: "#b91c1c",
    border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  confirmText: { fontSize: "12px", color: "#dc2626", fontWeight: "600", whiteSpace: "nowrap" },
  btnYes: {
    padding: "6px 14px", fontSize: "12px", fontWeight: "700",
    backgroundColor: "#dc2626", color: "white",
    border: "none", borderRadius: "7px", cursor: "pointer",
  },
  btnNo: {
    padding: "6px 14px", fontSize: "12px", fontWeight: "600",
    backgroundColor: "#f1f5f9", color: "#334155",
    border: "1px solid #e2e8f0", borderRadius: "7px", cursor: "pointer",
  },
};
