export default function OnboardingCard({ onIrA, onboarding = {}, onSkip }) {
  const {
    tieneProductos = false,
    tieneLogo      = false,
    tienePerfil    = false,
    tieneLealtad   = false,
    tieneEquipo    = false,
    tieneTienda    = false,
    tieneReferidos = false,
    completados    = 0,
    total          = 7,
  } = onboarding;

  const porcentaje = Math.round((completados / total) * 100);

  const pasos = [
    {
      num: 1,
      titulo:   "Agrega tu primer producto",
      desc:     "Sube tu catálogo con fotos, precios y stock.",
      accion:   "productos",
      tiempo:   "2 min",
      completo: tieneProductos,
      color:    "#6366f1",
      bg:       "#eef2ff",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
    {
      num: 2,
      titulo:   "Sube el logo de tu tienda",
      desc:     "La imagen de tu empresa. Aparece en tu tienda online.",
      accion:   "configuracion",
      tiempo:   "1 min",
      completo: tieneLogo,
      color:    "#f59e0b",
      bg:       "#fffbeb",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
    },
    {
      num: 3,
      titulo:   "Personaliza tu tienda online",
      desc:     "Color, banner y descripción para que luzca profesional.",
      accion:   "editor",
      tiempo:   "3 min",
      completo: tieneTienda,
      color:    "#ec4899",
      bg:       "#fdf2f8",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
    },
    {
      num: 4,
      titulo:   "Completa tu perfil de empresa",
      desc:     "Agrega descripción, WhatsApp y datos de contacto.",
      accion:   "configuracion",
      tiempo:   "2 min",
      completo: tienePerfil,
      color:    "#0ea5e9",
      bg:       "#f0f9ff",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      num: 5,
      titulo:   "Crea niveles de lealtad",
      desc:     "Premia a tus mejores clientes con descuentos especiales.",
      accion:   "lealtad",
      tiempo:   "3 min",
      completo: tieneLealtad,
      color:    "#f97316",
      bg:       "#fff7ed",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
    },
    {
      num: 6,
      titulo:   "Agrega tu equipo",
      desc:     "Crea usuarios para cajeros y administradores.",
      accion:   "usuarios",
      tiempo:   "2 min",
      completo: tieneEquipo,
      color:    "#8b5cf6",
      bg:       "#f5f3ff",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      num: 7,
      titulo:   "Configura el sistema de referidos",
      desc:     "Define las recompensas para clientes que traigan amigos.",
      accion:   "referidos",
      tiempo:   "3 min",
      completo: tieneReferidos,
      color:    "#10b981",
      bg:       "#f0fdf4",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={s.wrap}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.headerContent}>
          <div style={s.headerText}>
            <h2 style={s.title}>
              {completados === 0
                ? "¡Bienvenido! Empieza por aquí"
                : completados === total
                ? "¡Tu tienda está lista para vender!"
                : completados === 1
                ? "Buen comienzo, sigue así"
                : `Vas bien, ya completaste ${completados} de ${total}`}
            </h2>
            <p style={s.subtitle}>
              {completados === 0
                ? "Hay algunos ajustes rápidos que harán tu tienda mucho más atractiva para tus clientes."
                : completados === total
                ? "Completaste toda la configuración. Tu tienda está lista."
                : `${total - completados} ${total - completados === 1 ? "cosa pendiente" : "cosas pendientes"} para tener tu tienda al 100%.`}
            </p>
          </div>

        </div>

        {/* Barra de progreso */}
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${porcentaje}%` }} />
        </div>
        <div style={s.progressMeta}>
          <span style={s.progressPct}>{porcentaje}% completado</span>
          <span style={s.progressCount}>{completados} de {total} listos</span>
        </div>
      </div>

      {/* ── GRID DE PASOS ── */}
      <div style={s.grid}>
        {pasos.map((paso) => (
          <PasoCard key={paso.num} paso={paso} onIrA={onIrA} />
        ))}
      </div>

    </div>
  );
}

function PasoCard({ paso, onIrA }) {
  const { num, titulo, desc, accion, tiempo, completo, color, bg, icon } = paso;

  return (
    <button
      style={{
        ...s.card,
        borderColor: completo ? "#bbf7d0" : "#e2e8f0",
        backgroundColor: completo ? "#f0fdf4" : "white",
        cursor: "pointer",
      }}
      onClick={() => onIrA(accion)}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = completo ? "#86efac" : color;
        e.currentTarget.style.boxShadow  = `0 4px 20px ${color}18`;
        e.currentTarget.style.transform  = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = completo ? "#bbf7d0" : "#e2e8f0";
        e.currentTarget.style.boxShadow   = "none";
        e.currentTarget.style.transform   = "translateY(0)";
      }}
    >
      {/* Top row: icon + check */}
      <div style={s.cardTop}>
        <div style={{ ...s.iconCircle, backgroundColor: bg, color }}>
          {icon}
        </div>
        {completo && (
          <span style={s.doneBadge}>✓ Listo</span>
        )}
      </div>

      {/* Título + desc */}
      <p style={completo ? s.tituloCompleto : s.titulo}>{titulo}</p>
      <p style={s.desc}>{desc}</p>

      {/* Footer */}
      <div style={s.cardFooter}>
        {!completo && (
          <span style={s.actionLink}>Ir ahora</span>
        )}
        <span style={s.tiempo}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {tiempo}
        </span>
      </div>
    </button>
  );
}

const s = {
  wrap: {
    display:       "flex",
    flexDirection: "column",
    gap:           "16px",
  },
  /* ── Header ── */
  header: {
    backgroundColor: "white",
    border:          "1px solid #e2e8f0",
    borderRadius:    "16px",
    padding:         "24px 28px",
  },
  headerContent: {
    display:        "flex",
    alignItems:     "flex-start",
    justifyContent: "space-between",
    gap:            "16px",
    marginBottom:   "20px",
  },
  headerText: { flex: 1 },
  title: {
    fontSize:      "18px",
    fontWeight:    "800",
    color:         "#0f172a",
    letterSpacing: "-0.02em",
    marginBottom:  "4px",
  },
  subtitle: {
    fontSize:   "13px",
    color:      "#64748b",
    lineHeight: "1.5",
  },
  skipBtn: {
    flexShrink:      0,
    padding:         "9px 18px",
    backgroundColor: "#0f172a",
    color:           "white",
    border:          "none",
    borderRadius:    "10px",
    fontSize:        "13px",
    fontWeight:      "600",
    cursor:          "pointer",
    whiteSpace:      "nowrap",
  },
  progressTrack: {
    width:           "100%",
    height:          "6px",
    borderRadius:    "99px",
    backgroundColor: "#f1f5f9",
    overflow:        "hidden",
    marginBottom:    "8px",
  },
  progressFill: {
    height:          "100%",
    borderRadius:    "99px",
    backgroundColor: "#10b981",
    transition:      "width 0.5s ease",
  },
  progressMeta: {
    display:        "flex",
    justifyContent: "space-between",
  },
  progressPct: {
    fontSize:   "12px",
    fontWeight: "600",
    color:      "#10b981",
  },
  progressCount: {
    fontSize: "12px",
    color:    "#94a3b8",
  },
  /* ── Grid ── */
  grid: {
    display:             "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap:                 "14px",
  },
  /* ── Cards ── */
  card: {
    backgroundColor: "white",
    border:          "1.5px solid #e2e8f0",
    borderRadius:    "16px",
    padding:         "22px",
    display:         "flex",
    flexDirection:   "column",
    gap:             "10px",
    textAlign:       "left",
    transition:      "all 0.18s ease",
  },
  cardTop: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   "4px",
  },
  iconCircle: {
    width:          "44px",
    height:         "44px",
    borderRadius:   "12px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  doneBadge: {
    fontSize:        "12px",
    fontWeight:      "700",
    color:           "#16a34a",
    backgroundColor: "#dcfce7",
    padding:         "4px 10px",
    borderRadius:    "99px",
  },
  titulo: {
    fontSize:   "14px",
    fontWeight: "700",
    color:      "#0f172a",
    lineHeight: "1.35",
  },
  tituloCompleto: {
    fontSize:   "14px",
    fontWeight: "700",
    color:      "#0f172a",
    lineHeight: "1.35",
  },
  desc: {
    fontSize:   "13px",
    color:      "#475569",
    lineHeight: "1.5",
    flex:       1,
  },
  cardFooter: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    marginTop:      "4px",
  },
  actionLink: {
    fontSize:   "12px",
    fontWeight: "700",
    color:      "#0f172a",
  },
  tiempo: {
    display:    "flex",
    alignItems: "center",
    gap:        "4px",
    fontSize:   "11px",
    color:      "#94a3b8",
    marginLeft: "auto",
  },
};
