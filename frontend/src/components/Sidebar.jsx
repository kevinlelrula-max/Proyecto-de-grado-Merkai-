export default function Sidebar({ setSeccion }) {
  return (
    <div style={styles.sidebar}>
      <h2 style={styles.logo}>Merkai</h2>

      <button onClick={() => setSeccion("productos")} style={styles.item}>
        📦 Productos
      </button>

      <button onClick={() => setSeccion("clientes")} style={styles.item}>
        👥 Clientes
      </button>

      <button onClick={() => setSeccion("ventas")} style={styles.item}>
        💰 Ventas
      </button>

      <button onClick={() => setSeccion("reportes")} style={styles.item}>
        📊 Reportes
      </button>
      <button onClick={() => setSeccion("pos")}>
       🛒 Punto de Venta
      </button>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    background: "linear-gradient(180deg, #0f172a, #1e293b)",
    color: "white",
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  logo: {
    marginBottom: "30px",
    fontSize: "22px",
  },
  item: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
    transition: "0.2s",
  },
};