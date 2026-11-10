import { useState, useEffect } from "react";
import { Crown, Repeat2, UserPlus, AlertTriangle, Clock, UserMinus, Phone, Mail, MessageCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const SEGMENTOS = {
  embajador: {
    label: "Embajadores VIP",
    Icon: Crown,
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    desc: "3+ compras · activos en 60 días",
    mensaje: (nombre, empresa) =>
      `¡Hola ${nombre}! 🌟 Eres uno de nuestros clientes más especiales en ${empresa}. Tenemos algo exclusivo preparado para ti. ¡Escríbenos y te contamos!`,
  },
  frecuente: {
    label: "Frecuentes",
    Icon: Repeat2,
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#86efac",
    desc: "2 compras · activos en 60 días",
    mensaje: (nombre, empresa) =>
      `¡Hola ${nombre}! Gracias por confiar en ${empresa}. Tenemos novedades que te van a encantar. ¿Cuándo nos visitas de nuevo? 😊`,
  },
  nuevo: {
    label: "Nuevos",
    Icon: UserPlus,
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#93c5fd",
    desc: "Primera compra · activos ≤30 días",
    mensaje: (nombre, empresa) =>
      `¡Bienvenido/a ${nombre}! 🎉 Nos alegra tenerte como cliente de ${empresa}. Si tienes alguna duda, aquí estamos. ¡Esperamos verte pronto!`,
  },
  en_riesgo: {
    label: "En riesgo",
    Icon: AlertTriangle,
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fcd34d",
    desc: "Sin compra entre 30 y 60 días",
    mensaje: (nombre, empresa) =>
      `¡Hola ${nombre}! Han pasado unos días desde tu última visita a ${empresa} y te echamos de menos. ¿Podemos hacer algo por ti? 🙌`,
  },
  inactivo: {
    label: "Inactivos",
    Icon: Clock,
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fca5a5",
    desc: "Sin compra en más de 60 días",
    mensaje: (nombre, empresa) =>
      `¡Hola ${nombre}! Hace tiempo que no sabemos de ti en ${empresa}. Tenemos nuevos productos y ofertas especiales. ¡Te esperamos! 👋`,
  },
  sin_compra: {
    label: "Sin compra",
    Icon: UserMinus,
    color: "#475569",
    bg: "#f8fafc",
    border: "#cbd5e1",
    desc: "Registrados pero sin pedidos",
    mensaje: (nombre, empresa) =>
      `¡Hola ${nombre}! Ya eres parte de ${empresa}. ¿Sabías que puedes ver todos nuestros productos en nuestra tienda? ¡Anímate a hacer tu primer pedido! 🛍️`,
  },
};

const ORDEN = ["embajador", "frecuente", "nuevo", "en_riesgo", "inactivo", "sin_compra"];

function limpiarTelefono(tel) {
  if (!tel) return null;
  return tel.replace(/\D/g, "");
}

function waLink(telefono, mensaje) {
  const num = limpiarTelefono(telefono);
  if (!num) return null;
  const prefix = num.startsWith("57") ? "" : "57";
  return `https://wa.me/${prefix}${num}?text=${encodeURIComponent(mensaje)}`;
}

export default function SegmentacionClientes() {
  const [clientes, setClientes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [segActivo, setSegActivo] = useState("embajador");
  const [expandido, setExpandido] = useState(null);
  const empresa = localStorage.getItem("empresa_nombre") || "nuestra tienda";

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/api/reportesEmpresa/segmentacion-clientes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setClientes(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        Analizando segmentos...
      </div>
    );
  }

  const grupos = {};
  ORDEN.forEach(seg => {
    grupos[seg] = clientes.filter(c => c.segmento === seg);
  });

  const totalIngresos = (seg) =>
    grupos[seg].reduce((acc, c) => acc + parseFloat(c.total_gastado || 0), 0);

  const clientesSeg = grupos[segActivo] || [];
  const cfg         = SEGMENTOS[segActivo];
  const IconActivo  = cfg.Icon;

  return (
    <div style={s.wrap}>
      {/* ── CABECERA ── */}
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Segmentación de clientes</h3>
          <p style={s.sub}>
            Clasificación automática basada en historial de compras · {clientes.length} clientes analizados
          </p>
        </div>
      </div>

      {/* ── PILLS DE SEGMENTOS ── */}
      <div style={s.pillsWrap}>
        {ORDEN.map(seg => {
          const c   = SEGMENTOS[seg];
          const cnt = grupos[seg].length;
          const act = segActivo === seg;
          const PillIcon = c.Icon;
          return (
            <button
              key={seg}
              style={{
                ...s.pill,
                backgroundColor: act ? c.bg : "white",
                border: `1.5px solid ${act ? c.color : "#e2e8f0"}`,
                color: act ? c.color : "#475569",
              }}
              onClick={() => setSegActivo(seg)}
            >
              <span style={{
                ...s.pillIconWrap,
                background: act ? `${c.color}18` : "#f1f5f9",
                color: act ? c.color : "#94a3b8",
              }}>
                <PillIcon size={13} />
              </span>
              <div style={s.pillTexts}>
                <span style={s.pillLabel}>{c.label}</span>
                <span style={{ ...s.pillCnt, color: act ? c.color : "#94a3b8" }}>{cnt} clientes</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── PANEL DEL SEGMENTO ACTIVO ── */}
      <div style={{ ...s.panel, borderColor: cfg.border, backgroundColor: cfg.bg }}>
        {/* Cabecera del segmento */}
        <div style={s.panelHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ ...s.panelIconWrap, background: `${cfg.color}18`, color: cfg.color }}>
              <IconActivo size={16} />
            </span>
            <div>
              <p style={{ ...s.panelTitle, color: cfg.color }}>{cfg.label}</p>
              <p style={s.panelDesc}>{cfg.desc}</p>
            </div>
          </div>
          <div style={s.panelKpis}>
            <div style={s.panelKpi}>
              <span style={{ ...s.panelKpiVal, color: cfg.color }}>{clientesSeg.length}</span>
              <span style={s.panelKpiLabel}>clientes</span>
            </div>
            {totalIngresos(segActivo) > 0 && (
              <div style={s.panelKpi}>
                <span style={{ ...s.panelKpiVal, color: cfg.color }}>
                  ${Number(totalIngresos(segActivo)).toLocaleString("es-CO")}
                </span>
                <span style={s.panelKpiLabel}>ingresos totales</span>
              </div>
            )}
          </div>
        </div>

        {clientesSeg.length === 0 ? (
          <p style={s.vacioMsg}>No hay clientes en este segmento.</p>
        ) : (
          <>
            {/* Mensaje sugerido */}
            <div style={s.msgBox}>
              <p style={s.msgLabel}>Mensaje de contacto sugerido</p>
              <p style={s.msgTexto}>
                "{cfg.mensaje(`[nombre]`, empresa)}"
              </p>
            </div>

            {/* Lista de clientes */}
            <div style={s.lista}>
              {clientesSeg.map((c, i) => {
                const msg  = cfg.mensaje(`${c.nombre}`, empresa);
                const link = waLink(c.telefono, msg);
                const open = expandido === c.id;
                return (
                  <div key={c.id} style={{ ...s.clienteRow, borderTop: i > 0 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={s.clienteMain} onClick={() => setExpandido(open ? null : c.id)}>
                      <div style={{ ...s.avatar, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {c.nombre[0]?.toUpperCase()}
                      </div>
                      <div style={s.clienteInfo}>
                        <p style={s.clienteNombre}>{c.nombre} {c.apellido}</p>
                        <p style={s.clienteMeta}>
                          {c.total_pedidos} pedido{c.total_pedidos !== 1 ? "s" : ""}
                          {parseFloat(c.total_gastado) > 0 && ` · $${Number(c.total_gastado).toLocaleString("es-CO")}`}
                          {c.ultima_compra && ` · última: ${new Date(c.ultima_compra).toLocaleDateString("es-CO")}`}
                        </p>
                      </div>
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          style={s.waBtn}
                          onClick={e => e.stopPropagation()}
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle size={13} />
                          WhatsApp
                        </a>
                      )}
                    </div>

                    {open && (
                      <div style={s.clienteDetalle}>
                        {c.telefono && (
                          <p style={s.detalleItem}>
                            <Phone size={11} style={{ marginRight: 5, verticalAlign: "middle", color: "#94a3b8" }} />
                            {c.telefono}
                          </p>
                        )}
                        {c.email && (
                          <p style={s.detalleItem}>
                            <Mail size={11} style={{ marginRight: 5, verticalAlign: "middle", color: "#94a3b8" }} />
                            {c.email}
                          </p>
                        )}
                        {link && (
                          <div style={s.msgPrev}>
                            <p style={s.msgPrevLabel}>Mensaje que se enviará</p>
                            <p style={s.msgPrevText}>{cfg.mensaje(c.nombre, empresa)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 20 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title:  { fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" },
  sub:    { fontSize: 12, color: "#94a3b8", margin: 0 },

  pillsWrap: { display: "flex", flexWrap: "wrap", gap: 10 },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
  pillIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s",
  },
  pillTexts: { display: "flex", flexDirection: "column", gap: 1 },
  pillLabel: { fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  pillCnt:   { fontSize: 11, fontWeight: 600 },

  panel: {
    borderRadius: 16,
    border: "1.5px solid",
    overflow: "hidden",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    flexWrap: "wrap",
    gap: 12,
  },
  panelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  panelTitle: { fontSize: 14, fontWeight: 800, margin: "0 0 2px" },
  panelDesc:  { fontSize: 11, color: "#64748b", margin: 0 },
  panelKpis: { display: "flex", gap: 20 },
  panelKpi:  { textAlign: "right" },
  panelKpiVal:   { fontSize: 22, fontWeight: 900, display: "block" },
  panelKpiLabel: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" },

  vacioMsg: { fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "24px", margin: 0 },

  msgBox: {
    margin: "0 20px 16px",
    padding: "12px 16px",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    border: "1px dashed #cbd5e1",
  },
  msgLabel: { fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 6px" },
  msgTexto: { fontSize: 12, color: "#374151", lineHeight: 1.6, margin: 0, fontStyle: "italic" },

  lista: { backgroundColor: "rgba(255,255,255,0.6)" },
  clienteRow: { transition: "background 0.1s" },
  clienteMain: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 20px",
    cursor: "pointer",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
  },
  clienteInfo: { flex: 1, minWidth: 0 },
  clienteNombre: { fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" },
  clienteMeta:   { fontSize: 11, color: "#94a3b8", margin: 0 },

  waBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 12px",
    backgroundColor: "#25D366",
    color: "white",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  clienteDetalle: {
    padding: "0 20px 14px 66px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  detalleItem: { fontSize: 12, color: "#475569", margin: 0, display: "flex", alignItems: "center" },
  msgPrev: {
    marginTop: 8,
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  msgPrevLabel: { fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 4px" },
  msgPrevText:  { fontSize: 12, color: "#374151", lineHeight: 1.6, margin: 0 },
};
