import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import useClientes from "./hooks/useClientes";
import { useClientesDormidos } from "./hooks/useClientesDormidos";
import TablaClientes from "./components/TablaClientes";
import FormCliente from "./components/FormCliente";
import Vista360 from "./components/Vista360";
import SegmentacionClientes from "./components/SegmentacionClientes";
import ClientesDormidos from "./components/ClientesDormidos";

export default function Clientes() {
  const { clientes, agregarCliente, editarCliente, borrarCliente, toggleEstadoCliente, borrarDatosCliente } = useClientes();
  const { clientes: clientesDormidos } = useClientesDormidos();

  const [tab, setTab] = useState("lista");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [vista360Id, setVista360Id] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [clientesPorPagina, setClientesPorPagina] = useState(10);

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const indexUltimo = paginaActual * clientesPorPagina;
  const indexPrimero = indexUltimo - clientesPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  useEffect(() => { setPaginaActual(1); }, [busqueda, clientesPorPagina]);

  const handleGuardar = (data) => {
    if (clienteSeleccionado) {
      editarCliente(clienteSeleccionado.id, data);
      setClienteSeleccionado(null);
    } else {
      agregarCliente(data);
    }
    setMostrarForm(false);
  };

  const handleEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setMostrarForm(true);
  };

  const handleNuevo = () => {
    setClienteSeleccionado(null);
    setMostrarForm(true);
  };

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h2 style={s.headerTitle}>Clientes</h2>
          <p style={s.headerSubtitle}>Administra tus clientes y su historial</p>
        </div>
        <button style={s.btnNew} onClick={handleNuevo}>
          <UserPlus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          Nuevo cliente
        </button>
      </div>

      {/* ── TABS ── */}
      <div style={s.tabs}>
        {[
          { key: "lista",      label: "Lista de clientes" },
          { key: "segmentos",  label: "Segmentación CRM"  },
          { key: "inactivos",  label: `Inactivos${clientesDormidos.length ? ` (${clientesDormidos.length})` : ""}` },
        ].map(t => (
          <button
            key={t.key}
            style={{ ...s.tab, ...(tab === t.key ? s.tabActivo : {}) }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "segmentos" && <SegmentacionClientes />}

      {tab === "inactivos" && (
        <div style={{ padding: "4px 0" }}>
          <ClientesDormidos clientes={clientesDormidos} />
        </div>
      )}

      {tab === "lista" && <>
      {/* STAT CARDS */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <span style={s.statLabel}>Total clientes</span>
          <span style={{ ...s.statValue, color: "#2563eb" }}>{clientes.length}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Resultados</span>
          <span style={s.statValue}>{clientesFiltrados.length}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Página actual</span>
          <span style={s.statValue}>{paginaActual} / {totalPaginas || 1}</span>
        </div>
      </div>

      {/* CONTROLES */}
      <div style={s.controls}>
        <div style={s.searchWrap}>
          <Search size={14} style={s.searchIcon} />
          <input
            style={s.searchInput}
            placeholder="Buscar cliente por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div style={s.selectWrap}>
          <label style={s.selectLabel}>Mostrar:</label>
          <select
            style={s.select}
            value={clientesPorPagina}
            onChange={(e) => setClientesPorPagina(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <TablaClientes
        clientes={clientesPaginados}
        onEditar={handleEditar}
        onEliminar={borrarCliente}
        onToggleEstado={toggleEstadoCliente}
        onBorrarDatos={borrarDatosCliente}
        onVerPerfil={(id) => setVista360Id(id)}
        onAgregar={() => { setMostrarForm(true); }}
      />

      {/* PAGINACIÓN */}
      <div style={s.pagination}>
        <button
          style={{ ...s.pageBtn, opacity: paginaActual === 1 ? 0.4 : 1 }}
          onClick={() => setPaginaActual(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          <ChevronLeft size={14} style={{ verticalAlign: "middle" }} />
          Anterior
        </button>
        <span style={s.pageInfo}>
          {paginaActual} de {totalPaginas || 1}
        </span>
        <button
          style={{ ...s.pageBtn, opacity: (paginaActual === totalPaginas || totalPaginas === 0) ? 0.4 : 1 }}
          onClick={() => setPaginaActual(paginaActual + 1)}
          disabled={paginaActual === totalPaginas || totalPaginas === 0}
        >
          Siguiente
          <ChevronRight size={14} style={{ verticalAlign: "middle" }} />
        </button>
      </div>

      </>}

      {/* VISTA 360 */}
      {vista360Id && (
        <Vista360
          clienteId={vista360Id}
          onCerrar={() => setVista360Id(null)}
        />
      )}

      {/* MODAL FORM */}
      {mostrarForm && (
        <div style={s.modalOverlay} onClick={() => setMostrarForm(false)}>
          <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>
                {clienteSeleccionado ? "Editar cliente" : "Nuevo cliente"}
              </h3>
              <button style={s.modalClose} onClick={() => setMostrarForm(false)}>✕</button>
            </div>
            <FormCliente
              onGuardar={handleGuardar}
              onCancelar={() => setMostrarForm(false)}
              clienteSeleccionado={clienteSeleccionado}
            />
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  page: { padding: "24px" },

  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "9px 18px",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    backgroundColor: "white",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
  },
  tabActivo: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  headerTitle: { fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 3px" },
  headerSubtitle: { fontSize: "13px", color: "#94a3b8", margin: 0 },
  btnNew: {
    display: "inline-flex", alignItems: "center",
    padding: "9px 18px", backgroundColor: "#2563eb",
    color: "white", border: "none", borderRadius: "10px",
    cursor: "pointer", fontSize: "13px", fontWeight: "600",
  },

  statsRow: { display: "flex", gap: "12px", marginBottom: "20px" },
  statCard: {
    flex: 1, backgroundColor: "#f8fafc", borderRadius: "12px",
    padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px",
    border: "1px solid #e2e8f0",
  },
  statLabel: { fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: "22px", fontWeight: "700", color: "#0f172a" },

  controls: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  searchWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: "11px", color: "#94a3b8", flexShrink: 0 },
  searchInput: {
    width: "100%", padding: "9px 12px 9px 34px",
    borderRadius: "10px", border: "1px solid #e2e8f0",
    fontSize: "13px", color: "#0f172a", outline: "none", backgroundColor: "#fff",
  },
  selectWrap: { display: "flex", alignItems: "center", gap: "6px" },
  selectLabel: { fontSize: "13px", color: "#64748b" },
  select: {
    padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0",
    fontSize: "13px", color: "#0f172a", backgroundColor: "#fff", cursor: "pointer",
  },

  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "20px" },
  pageBtn: {
    padding: "7px 18px", borderRadius: "8px",
    border: "1px solid #e2e8f0", backgroundColor: "#fff",
    cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#0f172a",
  },
  pageInfo: { fontSize: "13px", color: "#64748b", minWidth: "110px", textAlign: "center" },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(15,23,42,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: "20px",
  },
  modalCard: {
    backgroundColor: "white", borderRadius: "16px",
    padding: "28px", width: "100%", maxWidth: "480px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 },
  modalClose: {
    background: "none", border: "none", fontSize: "16px",
    cursor: "pointer", color: "#94a3b8", padding: "4px",
  },
};
