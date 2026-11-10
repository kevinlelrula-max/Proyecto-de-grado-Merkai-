export default function BannerReferidos({ onIrA, totalClientes }) {
  return (
    <div style={s.wrap}>
      <div style={s.left}>
        <span style={s.badge}>Oportunidad</span>
        <p style={s.title}>Activa tu programa de referidos</p>
        <p style={s.desc}>
          Ya tienes <strong>{totalClientes}</strong> cliente{totalClientes > 1 ? "s" : ""} registrados.
          Con el sistema de referidos puedes hacer que cada uno traiga nuevos compradores
          y recompensarlos automáticamente.
        </p>
        <div style={s.features}>
          <span style={s.feat}>Premios personalizados</span>
          <span style={s.feat}>Integrado con lealtad</span>
          <span style={s.feat}>Link único por cliente</span>
        </div>
      </div>
      <div style={s.right}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <button style={s.btn} onClick={() => onIrA("referidos")}>
          Configurar ahora →
        </button>
        <p style={s.tiempo}>Solo 3 minutos</p>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    background:     "#fffbeb",
    border:         "1.5px solid #fcd34d",
    borderRadius:   "16px",
    padding:        "28px 32px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            "24px",
    flexWrap:       "wrap",
  },
  left:  { flex: 1, minWidth: "260px" },
  right: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    gap:           "10px",
    flexShrink:    0,
  },
  badge: {
    display:         "inline-block",
    fontSize:        "11px",
    fontWeight:      "700",
    color:           "#92400e",
    backgroundColor: "#fde68a",
    padding:         "3px 10px",
    borderRadius:    "99px",
    marginBottom:    "8px",
  },
  title: {
    fontSize:     "17px",
    fontWeight:   "800",
    color:        "#78350f",
    marginBottom: "6px",
    lineHeight:   "1.3",
  },
  desc: {
    fontSize:     "13px",
    color:        "#92400e",
    lineHeight:   "1.6",
    marginBottom: "14px",
  },
  features: { display: "flex", flexWrap: "wrap", gap: "8px" },
  feat: {
    fontSize:        "12px",
    fontWeight:      "600",
    color:           "#78350f",
    backgroundColor: "rgba(255,255,255,0.6)",
    border:          "1px solid #fcd34d",
    padding:         "4px 10px",
    borderRadius:    "8px",
  },
  btn: {
    padding:         "10px 20px",
    backgroundColor: "#d97706",
    color:           "white",
    border:          "none",
    borderRadius:    "10px",
    fontSize:        "13px",
    fontWeight:      "700",
    cursor:          "pointer",
    whiteSpace:      "nowrap",
  },
  tiempo: { fontSize: "11px", color: "#a16207" },
};
