export default function Carrito({
  carrito,
  cambiarCantidad,
  eliminarProducto,
  fmt
}) {
  return (
    <div className="carrito-wrap">
      {carrito.length === 0 ? (
        <div className="carrito-vacio">
          <p>Sin productos en el carrito</p>
          <span>Selecciona un producto de la izquierda</span>
        </div>
      ) : (
        carrito.map(item => (
          <div key={item.id} className="carrito-item">
            <div className="carrito-item-info">
              <div className="carrito-item-name">{item.nombre}</div>

              {/* 🔥 subtotal correcto */}
              <div className="carrito-item-price">
                ${fmt(item.precio)} × {item.cantidad} = ${fmt(item.precio * item.cantidad)}
              </div>
            </div>

            <div className="qty-control">
              <button
                className="qty-btn"
                onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
              >
                -
              </button>

              <span className="qty-num">{item.cantidad}</span>

              <button
                className="qty-btn"
                onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
              >
                +
              </button>
            </div>

            <button
              className="del-btn"
              onClick={() => eliminarProducto(item.id)}
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}