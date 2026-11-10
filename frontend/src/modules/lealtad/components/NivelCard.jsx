import { useState } from "react";
import { Pause, Play, Pencil, Trash2, Award, Medal, Star, Sparkles, Crown, CheckCircle } from "lucide-react";

export default function NivelCard({ nivel, onEditar, onEliminar, onToggle }) {
  const [confirmando, setConfirmando] = useState(false);

  const tiers = [
    { icon: Award,    color: "#b45309", accent: "#f59e0b", accentBg: "#fef3c7" },
    { icon: Medal,    color: "#475569", accent: "#334155", accentBg: "#f1f5f9" },
    { icon: Star,     color: "#b45309", accent: "#d97706", accentBg: "#fffbeb" },
    { icon: Sparkles, color: "#1d4ed8", accent: "#3b82f6", accentBg: "#eff6ff" },
    { icon: Crown,    color: "#7e22ce", accent: "#9333ea", accentBg: "#fdf4ff" },
  ];

  const nombres = ["bronce", "plata", "oro", "diamante", "platino"];
  const idx = nombres.findIndex(n => nivel.nombre.toLowerCase().includes(n));
  const t = tiers[idx >= 0 ? idx : 0];
  const Icon = t.icon;

  const precioFinal = 100000 * (1 - nivel.descuento_porcentaje / 100);

  return (
    <div style={{ ...s.card, borderLeft: `4px solid ${t.accent}` }}>

      {/* Header */}
      <div style={s.header}>
        <div style={{ ...s.iconWrap, backgroundColor: t.accentBg, color: t.accent }}>
          <Icon size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ ...s.nombre, color: t.color }}>{nivel.nombre}</p>
          <span style={{ ...s.badge, color: nivel.activo ? "#15803d" : "#334155" }}>
            {nivel.activo && <CheckCircle size={10} />}
            {nivel.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div style={s.actions}>
          {confirmando ? (
            <>
              <span style={s.confirmText}>¿Eliminar?</span>
              <button style={s.btnYes} onClick={() => { onEliminar(nivel.id); setConfirmando(false); }}>Sí</button>
              <button style={s.btnNo}  onClick={() => setConfirmando(false)}>No</button>
            </>
          ) : (
            <>
              <button style={s.btnAction} onClick={() => onToggle(nivel)} title={nivel.activo ? "Desactivar" : "Activar"}>
                {nivel.activo ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button style={s.btnAction} onClick={() => onEditar(nivel)}><Pencil size={13} /></button>
              <button style={{ ...s.btnAction, color: "#b91c1c", borderColor: "#fecaca" }} onClick={() => setConfirmando(true)}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        <div style={s.stat}>
          <span style={s.statLabel}>Compras mínimas / mes</span>
          <span style={{ ...s.statValor, color: t.color }}>
            ${Number(nivel.monto_minimo).toLocaleString("es-CO")}
          </span>
        </div>
        <div style={s.divider} />
        <div style={{ ...s.stat, alignItems: "flex-end" }}>
          <span style={s.statLabel}>Descuento</span>
          <span style={{ ...s.statValor, fontSize: "28px", color: t.accent }}>
            {nivel.descuento_porcentaje}%
          </span>
        </div>
      </div>

      {/* Ejemplo */}
      <div style={s.ejemplo}>
        <span style={s.ejemploTexto}>
          Producto de $100.000 →{" "}
          <strong style={{ color: t.color }}>${precioFinal.toLocaleString("es-CO")}</strong>
        </span>
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
    gap: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    transition: "box-shadow 0.2s",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nombre: {
    fontSize: "17px",
    fontWeight: "700",
    letterSpacing: "-0.01em",
    marginBottom: "3px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "11px",
    fontWeight: "600",
  },
  actions: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    flexShrink: 0,
  },
  btnAction: {
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    width: "30px",
    height: "30px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#334155",
  },
  confirmText: { fontSize: "11px", color: "#dc2626", fontWeight: "600", whiteSpace: "nowrap" },
  btnYes: {
    padding: "4px 10px", fontSize: "12px", fontWeight: "700",
    backgroundColor: "#dc2626", color: "white",
    border: "none", borderRadius: "7px", cursor: "pointer",
  },
  btnNo: {
    padding: "4px 10px", fontSize: "12px", fontWeight: "600",
    backgroundColor: "#f1f5f9", color: "#334155",
    border: "1px solid #e2e8f0", borderRadius: "7px", cursor: "pointer",
  },
  stats: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
  },
  stat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  statValor: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  divider: {
    width: "1px",
    height: "40px",
    backgroundColor: "#e2e8f0",
    flexShrink: 0,
  },
  ejemplo: {
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  ejemploTexto: {
    fontSize: "13px",
    color: "#334155",
  },
};
