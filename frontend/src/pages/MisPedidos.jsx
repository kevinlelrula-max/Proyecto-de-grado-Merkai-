import { useNavigate, Navigate, useParams } from "react-router-dom";
import { Package, RefreshCw, Bell, AlertTriangle, ShoppingBag, ArrowLeft } from "lucide-react";
import { useMisPedidos } from "../modules/tienda/hooks/useMisPedidos";
import PedidoCard from "../modules/tienda/components/PedidoCard";

export default function MisPedidos() {
  const navigate = useNavigate();
  const { empresaSlug: slugParam } = useParams();
  const slug = slugParam || localStorage.getItem("ultima_empresa_slug");
  const rutaTienda = slug ? `/tienda/${slug}` : "/";
  const { pedidos, loading, error, estaLogueado, clienteNombre, refetch, notifPermiso, pedirPermiso } = useMisPedidos();

  if (!estaLogueado) {
    return <Navigate to="/tienda/login" state={{ from: "/tienda/mis-pedidos" }} replace />;
  }

  const pedidosActivos     = pedidos.filter((p) => !["entregado", "cancelado"].includes(p.estado));
  const pedidosFinalizados = pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado));

  return (
    <div style={s.page}>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLeft}>
            <button style={s.backBtn} onClick={() => navigate(rutaTienda)}>
              <ArrowLeft size={15} />
              Volver a la tienda
            </button>
          </div>
          <div style={s.navCenter}>
            <img src="/logo-merkai-icon.png" alt="Merkai" width="22" height="22" style={{ objectFit: "contain" }} />
            <span style={s.navBrand}>Merkai</span>
          </div>
          <div style={s.navRight}>
            <div style={s.navUser}>
              <div style={s.navAvatar}>{clienteNombre?.[0]?.toUpperCase() ?? "C"}</div>
              <span style={s.navUserName}>{clienteNombre}</span>
            </div>
            <button style={s.navBtnSalir} onClick={() => {
              localStorage.removeItem("cliente_token");
              localStorage.removeItem("cliente_id");
              localStorage.removeItem("cliente_nombre");
              navigate(rutaTienda);
            }}>Salir</button>
          </div>
        </div>
      </nav>

      {/* Page header */}
      <div style={s.pageHeader}>
        <div style={s.pageHeaderInner}>
          <div style={s.pageHeaderLeft}>
            <h1 style={s.pageTitle}>Mis pedidos</h1>
            {pedidos.length > 0 && (
              <p style={s.pageSub}>
                {pedidosActivos.length > 0
                  ? `${pedidosActivos.length} pedido${pedidosActivos.length > 1 ? "s" : ""} en curso`
                  : "Todos tus pedidos están finalizados"}
              </p>
            )}
          </div>
          <button style={s.refetchBtn} onClick={refetch}>
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>

        {notifPermiso !== "granted" && (
          <div style={s.notifBanner}>
            <div style={s.notifLeft}>
              <Bell size={13} color="#92400e" style={{ flexShrink: 0 }} />
              <span style={s.notifText}>Activa las notificaciones para seguir tu pedido en tiempo real</span>
            </div>
            <button
              onClick={pedirPermiso}
              style={{ ...s.notifBtn, ...(notifPermiso === "denied" ? s.notifBtnBloq : {}) }}
              disabled={notifPermiso === "denied"}
            >
              {notifPermiso === "denied" ? "Bloqueadas" : "Activar"}
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={s.content}>

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
            <div style={s.emptyIconWrap}>
              <ShoppingBag size={32} color="#2563eb" />
            </div>
            <p style={s.emptyTitle}>Sin pedidos todavía</p>
            <p style={s.emptyDesc}>Visita el marketplace y haz tu primera compra</p>
            <button style={s.emptyBtn} onClick={() => navigate(rutaTienda)}>
              Ir al marketplace
            </button>
          </div>
        ) : (
          <>
            {pedidosActivos.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionTitle}>En curso</span>
                  <span style={s.sectionCount}>{pedidosActivos.length}</span>
                  <div style={s.pollBadge}>
                    <div style={s.pollDot} />
                    Actualización automática cada 30 s
                  </div>
                </div>
                <div style={s.grid}>
                  {pedidosActivos.map((p) => <PedidoCard key={p.id} pedido={p} />)}
                </div>
              </div>
            )}

            {pedidosFinalizados.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionHeader}>
                  <span style={s.sectionTitle}>Historial</span>
                  <span style={s.sectionCount}>{pedidosFinalizados.length}</span>
                </div>
                <div style={s.grid}>
                  {pedidosFinalizados.map((p) => <PedidoCard key={p.id} pedido={p} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer style={s.footer}>
        <span style={s.footerText}>Merkai · Marketplace</span>
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f4f8",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: "flex", flexDirection: "column",
  },
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
  },
  navInner: {
    maxWidth: "1100px", margin: "0 auto",
    padding: "0 24px", height: "56px",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "16px",
  },
  navLeft: { flex: 1, display: "flex" },
  navCenter: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  navRight: { flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" },
  navBrand: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  backBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    background: "none", border: "none",
    color: "#64748b", fontSize: "13px", fontWeight: "500",
    cursor: "pointer", padding: "4px 0",
  },
  navUser: { display: "flex", alignItems: "center", gap: "7px" },
  navAvatar: {
    width: "28px", height: "28px", borderRadius: "50%",
    backgroundColor: "#2563eb", color: "white",
    fontSize: "11px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  navUserName: { fontSize: "13px", color: "#374151", fontWeight: "500" },
  navBtnSalir: { background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer" },

  pageHeader: {
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "20px 24px 16px",
  },
  pageHeaderInner: {
    maxWidth: "1100px", margin: "0 auto",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px",
  },
  pageHeaderLeft: {},
  pageTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 3px", letterSpacing: "-0.02em" },
  pageSub: { fontSize: "13px", color: "#64748b" },
  refetchBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 14px",
    backgroundColor: "white", border: "1.5px solid #e2e8f0",
    borderRadius: "9px", color: "#374151",
    fontSize: "13px", cursor: "pointer", fontWeight: "600",
    flexShrink: 0, marginTop: "2px",
  },

  notifBanner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: "12px", padding: "9px 12px",
    backgroundColor: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: "9px", marginTop: "12px",
    maxWidth: "1100px", margin: "12px auto 0",
  },
  notifLeft: { display: "flex", alignItems: "center", gap: "7px", flex: 1 },
  notifText: { fontSize: "12px", color: "#92400e" },
  notifBtn: {
    flexShrink: 0, padding: "5px 12px",
    backgroundColor: "#f59e0b", color: "white",
    border: "none", borderRadius: "7px",
    fontSize: "11px", fontWeight: "600", cursor: "pointer",
  },
  notifBtnBloq: { backgroundColor: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed" },

  content: {
    flex: 1, maxWidth: "1100px", margin: "0 auto",
    padding: "24px 24px 40px", width: "100%", boxSizing: "border-box",
  },

  section: { marginBottom: "32px" },
  sectionHeader: {
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px",
  },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  sectionCount: {
    backgroundColor: "#e2e8f0", color: "#64748b",
    fontSize: "11px", fontWeight: "700",
    padding: "2px 7px", borderRadius: "999px",
  },
  pollBadge: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "11px", color: "#2563eb",
    backgroundColor: "#eff6ff", padding: "3px 9px",
    borderRadius: "999px", fontWeight: "500",
  },
  pollDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    backgroundColor: "#2563eb",
    animation: "none",
  },

  grid: { display: "flex", flexDirection: "column", gap: "12px" },
  skeletonWrap: { display: "flex", flexDirection: "column", gap: "12px" },
  skeleton: { height: "280px", borderRadius: "16px", backgroundColor: "#dde3ea" },

  empty: {
    textAlign: "center", padding: "80px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0",
  },
  emptyIconWrap: {
    width: "64px", height: "64px", borderRadius: "18px",
    backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "4px",
  },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#0f172a" },
  emptyDesc: { fontSize: "13px", color: "#64748b" },
  emptyBtn: {
    marginTop: "6px", padding: "10px 22px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: "9px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer",
  },

  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px",
    fontSize: "13px", color: "#b91c1c", marginBottom: "16px",
  },

  footer: {
    borderTop: "1px solid #e2e8f0", backgroundColor: "white",
    padding: "12px 24px", textAlign: "center",
  },
  footerText: { fontSize: "12px", color: "#94a3b8" },
};
