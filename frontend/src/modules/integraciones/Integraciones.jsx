import { useEffect, useState } from "react";
import { LayoutGrid, LayoutList, AlertTriangle, Plug } from "lucide-react";
import { useIntegraciones, PASARELAS } from "./hooks/useIntegraciones";
import PasarelaCard from "./components/PasarelaCard";

export default function Integraciones() {
  const {
    loading, guardando, error, exito,
    cargar, guardar, toggle, desconectar, getConectada,
  } = useIntegraciones();

  const [vista, setVista]   = useState("grid");
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => { cargar(); }, [cargar]);

  const pasarelasFiltradas = filtro === "conectadas"
    ? PASARELAS.filter(p => !!getConectada(p.key))
    : PASARELAS;

  const totalConectadas = PASARELAS.filter(p => !!getConectada(p.key)).length;

  return (
    <div style={s.wrap}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Integraciones</h2>
          <p style={s.sub}>
            Conecta pasarelas de pago para que tus clientes puedan pagar en tu tienda online.
          </p>
        </div>
      </div>

      {/* ── Toolbar: tabs + toggle vista ── */}
      <div style={s.toolbar}>
        <div style={s.tabs}>
          {[
            { key: "todas",      label: `Todas (${PASARELAS.length})` },
            { key: "conectadas", label: `Conectadas (${totalConectadas})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFiltro(t.key)}
              style={{
                ...s.tab,
                color:        filtro === t.key ? "#0f172a" : "#94a3b8",
                borderBottom: filtro === t.key ? "2px solid #2563eb" : "2px solid transparent",
                fontWeight:   filtro === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={s.vistaBtns}>
          <button
            onClick={() => setVista("grid")}
            title="Vista cuadrícula"
            style={{ ...s.vistaBtn, backgroundColor: vista === "grid" ? "#2563eb" : "white", color: vista === "grid" ? "white" : "#94a3b8" }}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setVista("lista")}
            title="Vista lista"
            style={{ ...s.vistaBtn, backgroundColor: vista === "lista" ? "#2563eb" : "white", color: vista === "lista" ? "white" : "#94a3b8" }}
          >
            <LayoutList size={14} />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ ...s.errorBox, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Contenido ── */}
      {loading ? (
        <div style={vista === "grid" ? s.skeletonGrid : s.skeletonLista}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: vista === "grid" ? 260 : 90, borderRadius: 12, backgroundColor: "#f1f5f9" }} />
          ))}
        </div>
      ) : pasarelasFiltradas.length === 0 ? (
        <div style={s.empty}>
          <Plug size={40} color="#e2e8f0" />
          <p style={s.emptyTitle}>No hay pasarelas conectadas aún</p>
          <p style={s.emptySub}>Haz clic en "Todas" para ver las disponibles y conectar una</p>
          <button onClick={() => setFiltro("todas")} style={s.emptyBtn}>
            Ver todas las pasarelas
          </button>
        </div>
      ) : (
        <div style={vista === "grid" ? s.grid : s.lista}>
          {pasarelasFiltradas.map(pasarela => (
            <PasarelaCard
              key={pasarela.key}
              pasarela={pasarela}
              vista={vista}
              conectada={getConectada(pasarela.key)}
              guardando={guardando === pasarela.key}
              exitoGuardado={exito === pasarela.key}
              onGuardar={(pub, priv) => guardar(pasarela.key, pub, priv)}
              onToggle={() => toggle(pasarela.key)}
              onDesconectar={() => desconectar(pasarela.key)}
            />
          ))}
        </div>
      )}


    </div>
  );
}

const s = {
  wrap: { padding: "24px 28px", fontFamily: "'Sora', 'Inter', sans-serif" },

  header: { marginBottom: 20 },
  title:  { fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  sub:    { fontSize: 13, color: "#94a3b8", lineHeight: 1.5 },

  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid #e2e8f0", marginBottom: 20,
  },
  tabs: { display: "flex", gap: 0 },
  tab: {
    padding: "10px 16px", background: "none", border: "none",
    fontSize: 13, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
  },
  vistaBtns: {
    display: "flex", gap: 4,
    backgroundColor: "#f1f5f9", padding: 3, borderRadius: 8, marginBottom: 4,
  },
  vistaBtn: {
    width: 30, height: 30, border: "none", borderRadius: 6,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", transition: "all 0.15s",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
  lista: { display: "flex", flexDirection: "column", gap: 10 },

  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
  },
  skeletonLista: { display: "flex", flexDirection: "column", gap: 10 },

  errorBox: {
    padding: "10px 14px", backgroundColor: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: 10,
    fontSize: 13, color: "#b91c1c", marginBottom: 16,
  },

  empty: {
    textAlign: "center", padding: "60px 24px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: 600, color: "#64748b" },
  emptySub:   { fontSize: 13, color: "#94a3b8", maxWidth: 300 },
  emptyBtn: {
    marginTop: 8, padding: "9px 20px",
    backgroundColor: "#2563eb", color: "white",
    border: "none", borderRadius: 9, fontSize: 13,
    fontWeight: 600, cursor: "pointer",
  },

  securityNote: {
    marginTop: 24, padding: "12px 16px",
    backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, fontSize: 12, color: "#64748b", lineHeight: 1.6,
  },
};
