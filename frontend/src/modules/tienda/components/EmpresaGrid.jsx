import { useEmpresas } from "../hooks/useEmpresas";
import EmpresaCard from "./EmpresaCard";

export default function EmpresaGrid({ onVerCatalogo }) {
  const { filtradas, empresas, busqueda, setBusqueda, cargando, error } =
    useEmpresas();

  return (
    <div style={s.root}>
      {/* ── encabezado ── */}
      <header style={s.header}>
        <div>
          <h1 style={s.titulo}>Marketplace</h1>
          <p style={s.subtitulo}>
            Encuentra empresas y haz tus pedidos en línea
          </p>
        </div>
        <input
          style={s.search}
          type="text"
          placeholder="Buscar empresa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </header>

      {/* ── cuerpo ── */}
      <main style={s.main}>
        {/* mini-stats */}
        {!cargando && !error && (
          <div style={s.statsBar}>
            <span style={s.stat}>
              <strong>{filtradas.length}</strong>{" "}
              empresa{filtradas.length !== 1 ? "s" : ""} disponibles
            </span>
            {filtradas.length < empresas.length && (
              <span style={s.stat}>
                <strong>{empresas.length}</strong> total registradas
              </span>
            )}
          </div>
        )}

        {/* estados */}
        {cargando && <p style={s.msg}>Cargando empresas…</p>}
        {error && <p style={{ ...s.msg, color: "var(--color-text-danger)" }}>{error}</p>}

        {/* grid */}
        {!cargando && !error && filtradas.length === 0 && (
          <p style={s.msg}>No se encontraron empresas.</p>
        )}

        {!cargando && !error && filtradas.length > 0 && (
          <div style={s.grid}>
            {filtradas.map((emp) => (
              <EmpresaCard
                key={emp.id}
                empresa={emp}
                onVerCatalogo={() => onVerCatalogo(emp.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root: {
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    minHeight: "100vh",
    background: "var(--color-background-tertiary, #f5f5f3)",
  },
  header: {
    padding: "2.5rem 2rem 1.5rem",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
    background: "var(--color-background-primary, #fff)",
  },
  titulo: {
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 4px",
    letterSpacing: -0.5,
    color: "var(--color-text-primary)",
  },
  subtitulo: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    margin: 0,
    fontWeight: 300,
  },
  search: {
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 14,
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
    width: 220,
    outline: "none",
  },
  main: { padding: "1.5rem 2rem 3rem" },
  statsBar: {
    display: "flex",
    gap: 10,
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  stat: {
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    color: "var(--color-text-secondary)",
  },
  msg: {
    textAlign: "center",
    padding: "3rem 1rem",
    color: "var(--color-text-secondary)",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: 14,
  },
};
