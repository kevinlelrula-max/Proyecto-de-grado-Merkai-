import { useEffect, useState } from "react";
import { useNavigate, Navigate, useParams, useLocation } from "react-router-dom";
import { RefreshCw, Bell, AlertTriangle, ShoppingBag, Truck, CheckCircle2, Wallet } from "lucide-react";
import { useMisPedidos } from "../modules/tienda/hooks/useMisPedidos";
import PedidoCard from "../modules/tienda/components/PedidoCard";
import TiendaLayout from "../modules/tienda/components/TiendaLayout";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function MisPedidos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { empresaSlug: slugParam } = useParams();
  const slug = slugParam || localStorage.getItem("ultima_empresa_slug");
  const rutaTienda = slug ? `/tienda/${slug}` : "/";
  const { pedidos, loading, error, estaLogueado, clienteNombre, refetch, notifPermiso, pedirPermiso } = useMisPedidos();

  // Datos de la empresa para usar sus colores, logo y pie de página (igual que el resto de la tienda)
  const [empresa, setEmpresa] = useState(
    () => location.state?.empresa || JSON.parse(localStorage.getItem("ultima_empresa") || "null")
  );
  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/api/empresas/slug/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setEmpresa(data); })
      .catch(() => {});
  }, [slug]);

  const colorMarca      = empresa?.color_primario   || "#0F6E56";
  const colorSecundario = empresa?.color_secundario || "#0B1628";

  if (!estaLogueado) {
    return <Navigate to="/tienda/login" state={{ from: "/tienda/mis-pedidos" }} replace />;
  }

  const pedidosActivos     = pedidos.filter((p) => !["entregado", "cancelado"].includes(p.estado));
  const pedidosFinalizados = pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado));
  const entregados         = pedidos.filter((p) => p.estado === "entregado");
  const totalComprado      = pedidos
    .filter((p) => p.estado !== "cancelado")
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  const stats = [
    { icono: Truck,         label: "En curso",         valor: pedidosActivos.length },
    { icono: CheckCircle2,  label: "Entregados",       valor: entregados.length },
    { icono: Wallet,        label: "Total comprado",   valor: `$${totalComprado.toLocaleString("es-CO")}` },
  ];

  return (
    <TiendaLayout
      empresa={empresa}
      carrito={[]}
      onAbrirCarrito={() => navigate(`${rutaTienda}/catalogo`, { state: { empresa } })}
    >
      {/* Encabezado en los colores de la tienda */}
      <header style={{ ...s.hero, background: `linear-gradient(135deg, ${colorSecundario} 0%, ${colorMarca} 160%)` }}>
        <div style={s.heroInner}>
          <div style={s.heroTop}>
            <div>
              <p style={s.heroEyebrow}>Hola, {(clienteNombre || "").split(" ")[0] || "cliente"}</p>
              <h1 style={s.heroTitle}>Mis pedidos</h1>
              <p style={s.heroSub}>
                {pedidos.length === 0
                  ? "Aquí verás el seguimiento de tus compras"
                  : pedidosActivos.length > 0
                  ? `${pedidosActivos.length} pedido${pedidosActivos.length > 1 ? "s" : ""} en curso`
                  : "Todos tus pedidos están finalizados"}
              </p>
            </div>
            <button style={s.refetchBtn} onClick={refetch}>
              <RefreshCw size={13} />
              Actualizar
            </button>
          </div>

          {pedidos.length > 0 && (
            <div style={s.stats}>
              {stats.map((st) => {
                const Icono = st.icono;
                return (
                  <div key={st.label} style={s.stat}>
                    <span style={s.statIcono}><Icono size={16} /></span>
                    <div>
                      <div style={s.statValor}>{st.valor}</div>
                      <div style={s.statLabel}>{st.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main style={s.content}>

        {notifPermiso !== "granted" && (
          <div style={s.notifBanner}>
            <div style={s.notifLeft}>
              <Bell size={14} color={colorMarca} style={{ flexShrink: 0 }} />
              <span style={s.notifText}>Activa las notificaciones para seguir tu pedido en tiempo real</span>
            </div>
            <button
              onClick={pedirPermiso}
              style={{ ...s.notifBtn, backgroundColor: colorMarca, ...(notifPermiso === "denied" ? s.notifBtnBloq : {}) }}
              disabled={notifPermiso === "denied"}
            >
              {notifPermiso === "denied" ? "Bloqueadas" : "Activar"}
            </button>
          </div>
        )}

        {error && (
          <div style={s.errorBox}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={s.skeletonWrap}>
            {[1, 2, 3].map((i) => <div key={i} style={s.skeleton} />)}
          </div>
        ) : pedidos.length === 0 ? (
          <div style={s.empty}>
            <div style={{ ...s.emptyIconWrap, backgroundColor: `${colorMarca}14` }}>
              <ShoppingBag size={32} color={colorMarca} />
            </div>
            <p style={s.emptyTitle}>Sin pedidos todavía</p>
            <p style={s.emptyDesc}>Cuando hagas tu primera compra, aquí podrás seguirla paso a paso.</p>
            <button
              style={{ ...s.emptyBtn, backgroundColor: colorMarca }}
              onClick={() => navigate(`${rutaTienda}/catalogo`, { state: { empresa } })}
            >
              Ver el catálogo
            </button>
          </div>
        ) : (
          <>
            {pedidosActivos.length > 0 && (
              <section style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionTitle}>En curso</span>
                  <span style={{ ...s.sectionCount, backgroundColor: `${colorMarca}18`, color: colorMarca }}>{pedidosActivos.length}</span>
                  <div style={{ ...s.pollBadge, backgroundColor: `${colorMarca}12`, color: colorMarca }}>
                    <div style={{ ...s.pollDot, backgroundColor: colorMarca }} />
                    Se actualiza solo cada 30 s
                  </div>
                </div>
                <div style={s.grid}>
                  {pedidosActivos.map((p) => <PedidoCard key={p.id} pedido={p} colorMarca={colorMarca} />)}
                </div>
              </section>
            )}

            {pedidosFinalizados.length > 0 && (
              <section style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionTitle}>Historial</span>
                  <span style={{ ...s.sectionCount, backgroundColor: `${colorMarca}18`, color: colorMarca }}>{pedidosFinalizados.length}</span>
                </div>
                <div style={s.grid}>
                  {pedidosFinalizados.map((p) => <PedidoCard key={p.id} pedido={p} colorMarca={colorMarca} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </TiendaLayout>
  );
}

const s = {
  // Encabezado
  hero: { padding: "34px 28px 28px", color: "white" },
  heroInner: { maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "22px" },
  heroTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" },
  heroEyebrow: { fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", margin: "0 0 6px" },
  heroTitle: { fontSize: "30px", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", color: "white" },
  heroSub: { fontSize: "14px", color: "rgba(255,255,255,0.75)", margin: 0 },
  refetchBtn: {
    display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px",
    backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "10px", color: "white", fontSize: "13px", cursor: "pointer", fontWeight: 600, flexShrink: 0,
  },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" },
  stat: {
    display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
    backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "14px",
  },
  statIcono: {
    width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.16)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  statValor: { fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 },
  statLabel: { fontSize: "11px", color: "rgba(255,255,255,0.65)", fontWeight: 600, marginTop: "2px" },

  content: { flex: 1, maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 48px", width: "100%", boxSizing: "border-box" },

  notifBanner: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
    padding: "11px 14px", backgroundColor: "white", border: "1px solid #e2e8f0",
    borderRadius: "12px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
  },
  notifLeft: { display: "flex", alignItems: "center", gap: "8px", flex: 1 },
  notifText: { fontSize: "13px", color: "#334155" },
  notifBtn: { flexShrink: 0, padding: "6px 14px", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
  notifBtnBloq: { backgroundColor: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed" },

  section: { marginBottom: "32px" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexWrap: "wrap" },
  sectionTitle: { fontSize: "16px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" },
  sectionCount: { fontSize: "11px", fontWeight: 800, padding: "2px 9px", borderRadius: "999px" },
  pollBadge: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "3px 10px", borderRadius: "999px", fontWeight: 600 },
  pollDot: { width: "6px", height: "6px", borderRadius: "50%" },

  grid: { display: "flex", flexDirection: "column", gap: "14px" },
  skeletonWrap: { display: "flex", flexDirection: "column", gap: "14px" },
  skeleton: { height: "260px", borderRadius: "16px", backgroundColor: "#e8edf3" },

  empty: {
    textAlign: "center", padding: "70px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    backgroundColor: "white", borderRadius: "18px", border: "1px solid #e2e8f0",
  },
  emptyIconWrap: { width: "68px", height: "68px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" },
  emptyTitle: { fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 },
  emptyDesc: { fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "340px" },
  emptyBtn: { marginTop: "8px", padding: "11px 24px", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" },

  errorBox: {
    display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#b91c1c", marginBottom: "16px",
  },
};
