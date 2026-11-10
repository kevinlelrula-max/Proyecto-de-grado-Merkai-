import { useState, useEffect } from "react";

export function useCarrito(productos) {
  const [carrito, setCarrito] = useState([]);

  const agregarProducto = (producto) => {
    if (producto.stock <= 0) return;

    const existe = carrito.find(p => p.id === producto.id);

    if (existe) {
      if (existe.cantidad >= producto.stock) return;

      setCarrito(carrito.map(p =>
        p.id === producto.id
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const cambiarCantidad = (id, cantidad) => {
    const producto = productos.find(p => p.id === id);
    if (cantidad <= 0) return;
    if (producto && cantidad > producto.stock) return;

    setCarrito(carrito.map(p =>
      p.id === id ? { ...p, cantidad } : p
    ));
  };

  const eliminarProducto = (id) => {
    setCarrito(carrito.filter(p => p.id !== id));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const total = carrito.reduce(
    (acc, p) => acc + p.precio * p.cantidad,
    0
  );

  return {
    carrito,
    setCarrito,       
    agregarProducto,
    cambiarCantidad,
    eliminarProducto,
    limpiarCarrito,   
    total
  };
}