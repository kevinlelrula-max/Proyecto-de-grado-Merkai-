export default function ClienteSearch({
  busqueda,
  setBusqueda,
  clientes,
  setClientes,
  clienteSeleccionado,
  setClienteSeleccionado
}) {
  return (
    <div className="cliente-wrap">
      
      <input
        className={`cliente-input ${clienteSeleccionado ? "seleccionado" : ""}`}
        placeholder="Buscar cliente por nombre o cédula..."
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setClienteSeleccionado(null);
        }}
      />

      {clientes.length > 0 && !clienteSeleccionado && (
        <div className="cliente-dropdown">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="cliente-option"
              onClick={() => {
                setClienteSeleccionado(c);
                setClientes([]);
                setBusqueda(`${c.nombre} ${c.apellido || ""}`);
              }}
            >
              {c.nombre} {c.apellido}
              {c.numero_documento && (
                <span>{c.numero_documento}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}