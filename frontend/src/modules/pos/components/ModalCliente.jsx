export default function ModalCliente({
  visible,
  onClose,
  onCrear,
  nuevoCliente,
  setNuevoCliente,
  creandoCliente,
  departamentos,
  municipios,
  onDepartamentoChange
}) {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">

        <div className="modal-header">
          <h3>Nuevo Cliente</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-grid">

          <input className="form-input" placeholder="Nombre"
            value={nuevoCliente.nombre}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,nombre:e.target.value})}
          />

          <input className="form-input" placeholder="Apellido"
            value={nuevoCliente.apellido}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,apellido:e.target.value})}
          />

          <select className="form-input"
            value={nuevoCliente.tipo_documento}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,tipo_documento:e.target.value})}
          >
            <option>Cédula de ciudadanía</option>
            <option>NIT</option>
          </select>

          <input className="form-input" placeholder="Documento"
            value={nuevoCliente.numero_documento}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,numero_documento:e.target.value})}
          />

          <input className="form-input" placeholder="Teléfono"
            value={nuevoCliente.telefono}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,telefono:e.target.value})}
          />

          <input className="form-input full" placeholder="Dirección"
            value={nuevoCliente.direccion}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,direccion:e.target.value})}
          />

          {/* DEP */}
          <select className="form-input"
            value={nuevoCliente.id_departamento}
            onChange={(e)=>onDepartamentoChange(e.target.value)}
          >
            <option value="">Departamento</option>
            {departamentos.map(d=>(
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>

          {/* MUNICIPIO */}
          <select className="form-input"
            value={nuevoCliente.id_municipio}
            onChange={(e)=>setNuevoCliente({...nuevoCliente,id_municipio:e.target.value})}
          >
            <option value="">Municipio</option>
            {municipios.map(m=>(
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>

        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>

          <button className="btn-guardar" onClick={onCrear}>
            {creandoCliente ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}