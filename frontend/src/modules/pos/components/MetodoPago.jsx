const metodos = [
  { id: 1, label: "Efectivo" },
  { id: 2, label: "Transferencia" },
  { id: 3, label: "Nequi" },
  { id: 4, label: "Tarjeta" }
];

export default function MetodoPago({ metodoPago, setMetodoPago }) {
  return (
    <div className="metodos-grid">
      {metodos.map(m => (
        <button
          key={m.id}
          className={`metodo-btn ${metodoPago === m.id ? "activo" : ""}`}
          onClick={() => setMetodoPago(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}