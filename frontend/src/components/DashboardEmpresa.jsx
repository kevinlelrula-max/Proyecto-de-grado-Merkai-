import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BuscadorGlobal from "./BuscadorGlobal";
import PersonalizarColor, { useAcento } from "./PersonalizarColor";
import SelectorEmpresa from "./SelectorEmpresa";
import { cn } from "@/lib/utils";
import { decodeToken } from "../utils/auth";

import Inicio from "../modules/inicio/Inicio";
import Productos from "../modules/productos/Productos";
import Clientes from "../modules/clientes/Clientes";
import Usuarios from "../modules/usuarios/Usuarios";
import Ventas from "../pages/VentasEmpresa";
import Reportes from "../pages/Reportes";
import PuntoDeVenta from "../modules/pos/PuntoDeVenta";
import Configuracion from "../modules/configuracion/Configuracion";
import NivelesLealtad from "../modules/lealtad/NivelesLealtad";
import BtnSoporte from "../components/BtnSoporte";
import Mensajes from "../modules/tienda/Mensajes";
import EditorTienda from "../modules/personalizacion/EditorTienda";
import Integraciones from "../modules/integraciones/Integraciones";
import PedidosOnline from "../modules/pedidos/PedidosOnline";
import Cupones       from "../modules/cupones/Cupones";
import Reseñas       from "../modules/reseñas/Reseñas";
import Referidos     from "../modules/referidos/Referidos";
import ConectorIA    from "../modules/configuracion/components/ConectorIA";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const PERMISOS_BASE = {
  1: ["inicio","productos","clientes","ventas","reportes","usuarios","pos","configuracion","lealtad","cupones","reseñas","referidos","editor","mensajes","integraciones","pedidos","claude-ia"],
  2: ["inicio","productos","clientes","ventas","reportes","usuarios","pos","configuracion","lealtad","cupones","reseñas","referidos","editor","mensajes","integraciones","pedidos","claude-ia"],
  3: ["inicio","pos","clientes"],
  4: [],
};

const TODO_EL_MENU = [
  { key: "inicio",        label: "Inicio",          icon: InicioIcon },
  { key: "productos",     label: "Productos",        icon: ProductosIcon },
  { key: "clientes",      label: "Clientes",         icon: ClientesIcon },
  { key: "ventas",        label: "Ventas",           icon: VentasIcon },
  { key: "reportes",      label: "Reportes",         icon: ReportesIcon },
  { key: "usuarios",      label: "Usuarios",         icon: UsuariosIcon },
  { key: "pos",           label: "Punto de venta",   icon: PosIcon },
  { key: "editor",        label: "Editor de tienda", icon: EditorIcon },
  { key: "lealtad",       label: "Lealtad",          icon: LealtadIcon },
  { key: "cupones",       label: "Cupones",          icon: CuponesIcon },
  { key: "reseñas",       label: "Reseñas",          icon: ReseñasIcon },
  { key: "referidos",     label: "Referidos",        icon: ReferidosIcon },
  { key: "mensajes",      label: "Mensajes",         icon: MensajesIcon },
  { key: "integraciones", label: "Integraciones",    icon: IntegracionesIcon },
  { key: "pedidos",       label: "Pedidos",   icon: PedidosIcon },
  { key: "claude-ia",     label: "Claude AI",        icon: ClaudeIaIcon },
];

// ── Íconos SVG ───────────────────────────────────────────────────────────────
function InicioIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function ProductosIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function ClientesIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function VentasIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}
function ReportesIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function UsuariosIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function PosIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
      <path d="M7 8h.01M11 8h.01M15 8h.01M7 12h.01M11 12h.01M15 12h.01"/>
    </svg>
  );
}
function EditorIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}
function LealtadIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}
function MensajesIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function IntegracionesIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/>
      <circle cx="5" cy="19" r="3"/>
      <circle cx="19" cy="19" r="3"/>
      <line x1="12" y1="8" x2="5" y2="16"/>
      <line x1="12" y1="8" x2="19" y2="16"/>
    </svg>
  );
}
function CuponesIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 5H3a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2z"/>
      <line x1="9" y1="9" x2="9" y2="9.01"/>
      <line x1="15" y1="15" x2="15" y2="15.01"/>
      <line x1="9" y1="15" x2="15" y2="9"/>
    </svg>
  );
}
function ReseñasIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function PedidosIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function ClaudeIaIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
      <path d="M12 8v4l3 3"/>
      <circle cx="12" cy="12" r="1" fill={active ? "#fff" : "#7A8BA0"}/>
    </svg>
  );
}
function ReferidosIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#7A8BA0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <line x1="19" y1="8" x2="23" y2="8"/>
      <line x1="21" y1="6" x2="21" y2="10"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Notificaciones ───────────────────────────────────────────────────────────
const TIPO_META = {
  nuevo_pedido:     { emoji: "🛍️", color: "#3B82F6" },
  stock_bajo:       { emoji: "⚠️", color: "#F59E0B" },
  nuevo_cliente:    { emoji: "👤", color: "#10B981" },
  pedido_entregado: { emoji: "✅", color: "#00C9A7" },
  pedido_cancelado: { emoji: "❌", color: "#EF4444" },
  cupon_por_vencer: { emoji: "🎟️", color: "#8B5CF6" },
};

function formatRelativo(fechaStr) {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

function NotificacionesBell({ token, irA }) {
  const [notifs, setNotifs]     = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [openBell, setOpenBell] = useState(false);
  const ref = useRef(null);

  const fetchNotifs = useCallback(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/notificaciones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setNotifs(data.notificaciones || []);
        setNoLeidas(data.no_leidas || 0);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(iv);
  }, [fetchNotifs]);

  useEffect(() => {
    if (!openBell) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenBell(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openBell]);

  const marcarLeida = async (id) => {
    await fetch(`${BASE_URL}/api/notificaciones/${id}/leer`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas(prev => Math.max(0, prev - 1));
  };

  const marcarTodas = async () => {
    await fetch(`${BASE_URL}/api/notificaciones/leer-todas`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  const limpiarLeidas = async () => {
    await fetch(`${BASE_URL}/api/notificaciones/limpiar-leidas`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setNotifs(prev => prev.filter(n => !n.leida));
  };

  const handleClickNotif = (notif) => {
    if (!notif.leida) marcarLeida(notif.id);
    if (notif.seccion) irA(notif.seccion);
    setOpenBell(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpenBell(v => !v)}
        className="relative w-9 h-9 rounded-[9px] bg-white border border-slate-400/60 flex items-center justify-center cursor-pointer text-[#5A7090] transition-colors hover:bg-slate-50 hover:border-slate-400 shadow-sm p-0"
        title="Notificaciones"
      >
        <BellIcon />
        {noLeidas > 0 && (
          <span style={{
            position: "absolute", top: 5, right: 5,
            width: noLeidas > 9 ? 16 : 14, height: 14,
            background: "#EF4444", borderRadius: 999,
            fontSize: 9, fontWeight: 700, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid #F0F4F8", lineHeight: 1,
          }}>
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {openBell && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 340, background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)", zIndex: 200,
          display: "flex", flexDirection: "column", overflow: "hidden",
          maxHeight: 480,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F0F4F8" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0B1628" }}>
              Notificaciones
              {noLeidas > 0 && (
                <span style={{ marginLeft: 8, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>
                  {noLeidas}
                </span>
              )}
            </span>
            {noLeidas > 0 && (
              <button onClick={marcarTodas} style={{ fontSize: 11, color: "#00A884", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>
                Marcar todas leídas
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                Sin notificaciones
              </div>
            ) : notifs.map(n => {
              const meta = TIPO_META[n.tipo] || { emoji: "📌", color: "#334155" };
              return (
                <div
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 16px", background: n.leida ? "transparent" : "rgba(0,201,167,0.05)", borderBottom: "1px solid #F8FAFC", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F5F7FA"}
                  onMouseLeave={e => e.currentTarget.style.background = n.leida ? "transparent" : "rgba(0,201,167,0.05)"}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.leida ? 400 : 600, color: "#0B1628", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {n.titulo}
                    </div>
                    {n.mensaje && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>{n.mensaje}</div>}
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{formatRelativo(n.creado_en)}</div>
                  </div>
                  {!n.leida && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00C9A7", flexShrink: 0, marginTop: 4 }} />}
                </div>
              );
            })}
          </div>

          {notifs.some(n => n.leida) && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid #F0F4F8" }}>
              <button onClick={limpiarLeidas} style={{ fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "center", padding: "4px 0" }}>
                Limpiar notificaciones leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({ item, active, onClick, badge }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 px-2.5 py-[9px] rounded-[9px] text-[13px] w-full text-left transition-all duration-150 border border-transparent",
        active
          ? "bg-white/[0.07] text-white font-medium border-white/[0.08]"
          : "font-normal text-[#7A94B0] hover:bg-white/[0.04] hover:text-[#C8D6E5]"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-[#4F8EF7]" />
      )}
      <div className={cn(
        "w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0 transition-all duration-150",
        active
          ? "bg-[#4F8EF7]/20 text-[#4F8EF7]"
          : "text-[#5A7090]"
      )}>
        <Icon active={active} />
      </div>
      {item.label}
      {badge > 0 && (
        <span className="ml-auto bg-red-500 text-white rounded-full text-[10px] font-bold px-1.5 py-[1px] leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function DashboardEmpresa() {
  const navigate      = useNavigate();
  const token         = localStorage.getItem("token");
  const decoded       = decodeToken(token);
  const rolId         = decoded?.rol_id || 3;
  const nombreUsuario = decoded?.usuario || "Usuario";

  useAcento();

  const [permisosRol, setPermisosRol]           = useState(null);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);

  useEffect(() => {
    if (!token) return;
    const ROLES_FIJOS = [1, 2, 3, 4];
    if (ROLES_FIJOS.includes(rolId)) {
      setPermisosRol(PERMISOS_BASE[rolId] || []);
      setCargandoPermisos(false);
      return;
    }
    fetch(`${BASE_URL}/api/usuarios/roles/${rolId}/permisos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setPermisosRol(Array.isArray(data) ? data : []))
      .catch(() => setPermisosRol([]))
      .finally(() => setCargandoPermisos(false));
  }, [rolId, token]);

  useEffect(() => {
    if (!token) return;
    const fetchNoLeidos = () => {
      fetch(`${BASE_URL}/api/contacto/no-leidos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setMensajesNoLeidos(data.total); })
        .catch(() => {});
    };
    fetchNoLeidos();
    const interval = setInterval(fetchNoLeidos, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const menu = permisosRol
    ? TODO_EL_MENU.filter(item => permisosRol.includes(item.key))
    : [];

  const GRUPOS_DEF = [
    { id: "principal",   label: "Principal",   keys: ["productos","clientes","ventas","reportes"] },
    { id: "operaciones", label: "Operaciones", keys: ["usuarios","pos"] },
    { id: "comercial",   label: "Comercial",   keys: ["editor","lealtad","cupones","reseñas","referidos","mensajes","integraciones","pedidos"] },
  ];

  const grupoDeSeccion = (key) => GRUPOS_DEF.find(g => g.keys.includes(key))?.id || null;

  const [seccion, setSeccion]               = useState(null);
  const [open, setOpen]                     = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [logoUrl, setLogoUrl]               = useState(null);
  const [nombreEmpresa, setNombreEmpresa]   = useState("Merkai");
  const [misEmpresas, setMisEmpresas]       = useState([]);
  const [showSwitcher, setShowSwitcher]     = useState(false);

  const [gruposAbiertos, setGruposAbiertos] = useState({
    principal: true, operaciones: true, comercial: true,
  });

  const toggleGrupo = (id) =>
    setGruposAbiertos(prev => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    if (menu.length > 0 && !seccion) setSeccion("inicio");
  }, [menu]);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/configuracion`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.nombre)  setNombreEmpresa(data.nombre);
        if (data.slug)    localStorage.setItem("empresa_slug", data.slug);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onConfigGuardada(e) {
      if (e.detail?.logoUrl) setLogoUrl(e.detail.logoUrl);
      if (e.detail?.nombre)  setNombreEmpresa(e.detail.nombre);
    }
    window.addEventListener("configuracion:guardada", onConfigGuardada);
    return () => window.removeEventListener("configuracion:guardada", onConfigGuardada);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/auth/mis-empresas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMisEmpresas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const irA = (key) => {
    if (permisosRol?.includes(key)) {
      setSeccion(key);
      setSidebarAbierto(false);
      if (key === "mensajes") setMensajesNoLeidos(0);
      const gid = grupoDeSeccion(key);
      if (gid) setGruposAbiertos(prev => ({ ...prev, [gid]: true }));
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setBuscadorAbierto(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const rolLabel = rolId === 1 ? "SuperAdmin" : rolId === 2 ? "Administrador" : rolId === 3 ? "Empleado" : "Usuario";
  const inicial  = nombreUsuario.charAt(0).toUpperCase();

  if (cargandoPermisos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-3" style={{ fontFamily: "'Sora', sans-serif" }}>
        <img src="/logo-merkai-icon.png" alt="Merkai" width="40" height="40" style={{ objectFit: "contain" }} />
        <div className="text-sm text-slate-500">Cargando permisos...</div>
      </div>
    );
  }

  if (!cargandoPermisos && menu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 gap-3" style={{ fontFamily: "'Sora', sans-serif" }}>
        <div className="text-[32px]">🔒</div>
        <div className="text-[15px] font-semibold text-slate-900">Sin acceso</div>
        <div className="text-[13px] text-slate-500">Tu rol no tiene secciones habilitadas.</div>
        <button
          className="mt-2 px-5 py-2 bg-gradient-to-br from-[#00C9A7] to-[#0099FF] border-none rounded-[9px] text-white text-[13px] font-semibold cursor-pointer"
          onClick={() => { localStorage.clear(); navigate("/"); }}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');`}</style>

      {/* Overlay mobile */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 bg-[#0B1628]/55 z-[39] backdrop-blur-sm md:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-60 bg-[#0B1628] flex flex-col z-40 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        sidebarAbierto
          ? "translate-x-0 shadow-[4px_0_32px_rgba(0,0,0,0.35)]"
          : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand */}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={`${BASE_URL}${logoUrl}`}
                alt="Logo"
                className="w-9 h-9 rounded-[10px] object-contain bg-white p-0.5 flex-shrink-0"
              />
            ) : (
              <img src="/logo-merkai-icon.png" alt="Merkai" width="36" height="36" className="flex-shrink-0" style={{ objectFit: "contain" }} />
            )}
            <div>
              <div className="text-[15px] font-semibold text-[#E8F4FF] tracking-tight leading-snug">{nombreEmpresa}</div>
              <div className="text-[10px] text-[#5A7A9A] uppercase tracking-[0.08em] mt-0.5">Panel de gestión</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">

          {/* Inicio — sin grupo */}
          {menu.filter(i => i.key === "inicio").map(item => (
            <NavItem key={item.key} item={item} active={seccion === item.key} onClick={() => irA(item.key)} />
          ))}

          {/* Grupos colapsables */}
          {GRUPOS_DEF.map(grupo => {
            const items = menu.filter(i => grupo.keys.includes(i.key));
            if (items.length === 0) return null;
            const abierto = gruposAbiertos[grupo.id] !== false;
            const itemActivo = !abierto && items.find(i => i.key === seccion);

            return (
              <div key={grupo.id}>
                <div
                  className="flex items-center justify-between px-2 pt-2.5 pb-1.5 mt-1.5 cursor-pointer rounded-[7px] hover:bg-white/[0.04] transition-colors select-none"
                  onClick={() => toggleGrupo(grupo.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#4A6680] uppercase tracking-[0.1em]">
                      {grupo.label}
                    </span>
                    {itemActivo && (
                      <span className="text-[10px] text-[#00C9A7] font-medium normal-case tracking-normal">
                        · {itemActivo.label}
                      </span>
                    )}
                  </div>
                  <svg
                    className={cn("text-[#4A6680] transition-transform duration-200 flex-shrink-0", abierto && "rotate-180")}
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                <div className={cn(
                  "overflow-hidden transition-all duration-200 flex flex-col gap-0.5",
                  abierto ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                )}>
                  {items.map(item => (
                    <NavItem
                      key={item.key}
                      item={item}
                      active={seccion === item.key}
                      onClick={() => irA(item.key)}
                      badge={item.key === "mensajes" ? mensajesNoLeidos : 0}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Claude AI — standalone destacado */}
          {menu.filter(i => i.key === "claude-ia").map(item => {
            const active = seccion === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => irA(item.key)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-[9px] rounded-[9px] text-[13px] border w-full text-left transition-all duration-150 mt-2.5",
                  active
                    ? "bg-gradient-to-br from-[#00C9A7]/20 to-[#0099FF]/12 border-[#00C9A7]/25 text-white font-medium"
                    : "bg-gradient-to-br from-[#00C9A7]/8 to-[#0099FF]/5 border-[#00C9A7]/20 text-[#00C9A7] font-normal hover:from-[#00C9A7]/15 hover:to-[#0099FF]/10"
                )}
              >
                <div className={cn(
                  "w-[30px] h-[30px] rounded-[7px] flex items-center justify-center flex-shrink-0 transition-all",
                  active ? "bg-gradient-to-br from-[#00C9A7] to-[#0099FF]" : "bg-white/[0.04] border border-white/[0.06]"
                )}>
                  <Icon active={active} />
                </div>
                {item.label}
                <span className={cn(
                  "ml-auto text-[9px] font-bold px-1.5 py-[1px] rounded border",
                  active
                    ? "text-white bg-[#00C9A7]/20 border-[#00C9A7]/30"
                    : "text-[#00C9A7] bg-[#00C9A7]/12 border-[#00C9A7]/30"
                )}>AI</span>
              </button>
            );
          })}
        </nav>

      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 md:ml-60 ml-0 flex flex-col min-h-screen">

        {/* TOPBAR */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-6 md:px-10 h-[68px] flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 rounded-[9px] bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-200 transition-colors p-0 mr-1 flex-shrink-0"
              onClick={() => setSidebarAbierto(v => !v)}
              aria-label="Menú"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <div className="text-[15px] font-semibold text-[#0B1628] tracking-tight leading-tight">
                {menu.find(m => m.key === seccion)?.label || { configuracion: "Configuración" }[seccion] || seccion}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight hidden sm:block">{nombreEmpresa}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PersonalizarColor />

            {/* Buscador Ctrl+K */}
            <button
              onClick={() => setBuscadorAbierto(true)}
              title="Buscar (Ctrl+K)"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-400/60 rounded-[9px] cursor-pointer text-[12px] text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span>Buscar</span>
              <kbd className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-[2px] text-slate-400 font-sans">Ctrl K</kbd>
            </button>

            <NotificacionesBell token={token} irA={irA} />

            <div className="w-px h-8 bg-slate-300 mx-2" />

            {/* User menu */}
            <div
              className="relative flex items-center gap-2.5 py-1.5 pl-1.5 pr-3 bg-white border border-slate-400/60 rounded-[12px] cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all select-none shadow-sm"
              onClick={e => { e.stopPropagation(); setOpen(!open); }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#0099FF] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                {inicial}
              </div>
              <div className="hidden sm:block">
                <div className="text-[13px] font-semibold text-[#0B1628] leading-tight">{nombreUsuario}</div>
                <div className="text-[10px] text-[#00A884] leading-tight font-medium">{rolLabel}</div>
              </div>
              <span className="text-slate-400 ml-0.5"><ChevronIcon /></span>

              {open && (
                <div
                  className="absolute top-[calc(100%+6px)] right-0 w-[200px] bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden z-[100]"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-3.5 py-3 border-b border-slate-100">
                    <div className="text-[13px] font-medium text-[#0B1628]">{nombreUsuario}</div>
                    <div className="text-[11px] text-[#00A884] mt-0.5">{rolLabel}</div>
                  </div>
                  <button
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#3D5068] hover:bg-slate-50 hover:text-[#0B1628] transition-colors bg-transparent border-none w-full text-left cursor-pointer"
                    onClick={() => { setOpen(false); navigate("/perfil"); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    Mi perfil
                  </button>
                  {(rolId === 1 || rolId === 2) && (
                    <button
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#3D5068] hover:bg-slate-50 hover:text-[#0B1628] transition-colors bg-transparent border-none w-full text-left cursor-pointer"
                      onClick={() => { setOpen(false); irA("configuracion"); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      Configuración
                    </button>
                  )}
                  {(rolId === 1 || rolId === 2) && (
                    <button
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[#3D5068] hover:bg-slate-50 hover:text-[#0B1628] transition-colors bg-transparent border-none w-full text-left cursor-pointer"
                      onClick={() => { setOpen(false); setShowSwitcher(true); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Mis tiendas
                    </button>
                  )}
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors bg-transparent border-none w-full text-left cursor-pointer"
                    onClick={() => { localStorage.clear(); navigate("/"); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 p-4 md:p-7">
          <div className="bg-white rounded-2xl border border-black/[0.06] min-h-[calc(100vh-108px)] overflow-hidden [&:has(.editor-fullbleed)]:overflow-visible [&:has(.editor-fullbleed)]:bg-transparent [&:has(.editor-fullbleed)]:border-none [&:has(.editor-fullbleed)]:shadow-none">
            {seccion === "inicio"        && <Inicio onIrA={irA} />}
            {seccion === "productos"     && <Productos />}
            {seccion === "clientes"      && <Clientes />}
            {seccion === "ventas"        && <Ventas />}
            {seccion === "reportes"      && <Reportes />}
            {seccion === "usuarios"      && <Usuarios />}
            {seccion === "pos"           && <PuntoDeVenta />}
            {seccion === "configuracion" && <Configuracion />}
            {seccion === "editor"        && <EditorTienda />}
            {seccion === "lealtad"       && <NivelesLealtad />}
            {seccion === "cupones"       && <Cupones />}
            {seccion === "reseñas"       && <Reseñas />}
            {seccion === "referidos"     && <Referidos />}
            {seccion === "mensajes"      && <Mensajes />}
            {seccion === "integraciones" && <Integraciones />}
            {seccion === "pedidos"       && <PedidosOnline />}
            {seccion === "claude-ia"     && (
              <div className="max-w-[640px] mx-auto">
                <ConectorIA />
              </div>
            )}
          </div>
        </div>
      </main>

      <BtnSoporte />

      {showSwitcher && (
        <SelectorEmpresa
          empresas={misEmpresas}
          token={token}
          rolId={rolId}
          onClose={() => setShowSwitcher(false)}
          onSelect={(data) => {
            localStorage.setItem("token",           data.token);
            localStorage.setItem("empresa_id",      data.empresa_id);
            localStorage.setItem("rol_id",          data.rol_id);
            localStorage.setItem("codigo_referido", data.codigo_referido || "");
            if (data.slug) localStorage.setItem("empresa_slug", data.slug);
            window.location.reload();
          }}
        />
      )}

      <BuscadorGlobal
        abierto={buscadorAbierto}
        onCerrar={() => setBuscadorAbierto(false)}
        onIrA={irA}
        permisosRol={permisosRol || []}
      />
    </div>
  );
}
