import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  cambiarEstadoProducto
} from "../services/productos.api";

export default function useProductos() {
  const [productos, setProductos] = useState([]);
  const token = localStorage.getItem("token");

  const cargarProductos = async () => {
    const data = await getProductos(token);
    setProductos(data);
  };

  const agregar = async (producto) => {
    try {
      await crearProducto(producto, token);
      await cargarProductos();
      toast.success("Producto creado correctamente");
      return true;
    } catch {
      toast.error("Error al crear el producto");
      return false;
    }
  };

  const actualizar = async (id, data) => {
    try {
      await actualizarProducto(id, data, token);
      await cargarProductos();
      toast.success("Producto actualizado correctamente");
      return true;
    } catch {
      toast.error("Error al actualizar el producto");
      return false;
    }
  };

  // Devuelve "historial" cuando el producto tiene ventas y no se puede borrar
  const eliminar = async (id) => {
    try {
      await eliminarProducto(id, token);
      await cargarProductos();
      toast.success("Producto eliminado");
      return true;
    } catch (err) {
      if (err.response?.data?.code === "TIENE_HISTORIAL") return "historial";
      toast.error(err.response?.data?.error || "Error al eliminar el producto");
      return false;
    }
  };

  const toggleEstado = async (id) => {
    try {
      const { activo } = await cambiarEstadoProducto(id, token);
      await cargarProductos();
      toast.success(activo ? "Producto activado" : "Producto desactivado: ya no aparece en la tienda ni en el POS");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar el estado del producto");
      return false;
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return { productos, agregar, actualizar, eliminar, toggleEstado };
}