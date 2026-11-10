export default function StockBajo({ productos }) {
  if (!productos || productos.length === 0) return null;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Stock bajo</h3>
          <p style={s.sub}>Productos por debajo del mínimo configurado</p>
        </div>
        <span style={s.badge}>{productos.length} producto{productos.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={s.list}>
        {productos.map((p, i) => {
          const porcentaje = p.stock_minimo > 0
            ? Math.min((p.stock / p.stock_minimo) * 100, 100)
            : 0;
          const critico = porcentaje <= 30;

          return (
            <div key={i} style={s.item}>
              <div style={s.itemInfo}>
                <p style={s.itemNombre}>{p.nombre}</p>
                <p style={s.itemStock}>
                  <span style={{ color: critico ? "#ef4444" : "#f59e0b", fontWeight: "700" }}>
                    {Number(p.stock).toFixed(1)}
                  </span>
                  {" "}/ mín {Number(p.stock_minimo).toFixed(1)}
                </p>
              </div>
              <div style={s.barWrap}>
                <div style={s.bar}>
                  <div style={{
                    ...s.barFill,
                    width: `${porcentaje}%`,
                    backgroundColor: critico ? "#ef4444" : "#f59e0b",
                  }} />
                </div>
                <p style={{ ...s.porcentaje, color: critico ? "#ef4444" : "#f59e0b" }}>
                  {Math.round(porcentaje)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid #ef4444",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    gap: 12,
  },
  title: { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 2px" },
  sub: { fontSize: "12px", color: "#94a3b8", margin: 0 },
  badge: {
    padding: "3px 12px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
  },
  list: { display: "flex", flexDirection: "column" },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "12px 20px",
    borderBottom: "1px solid #f8fafc",
  },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: "13px", fontWeight: "600", color: "#0f172a", margin: "0 0 2px" },
  itemStock: { fontSize: "11px", color: "#94a3b8", margin: 0 },
  barWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "110px",
    flexShrink: 0,
  },
  bar: {
    flex: 1,
    height: "6px",
    backgroundColor: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s",
  },
  porcentaje: {
    fontSize: "11px",
    fontWeight: "700",
    minWidth: "28px",
    textAlign: "right",
  },
};
