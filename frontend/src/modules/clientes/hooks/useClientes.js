import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  cambiarEstadoCliente,
  anonimizarCliente
} from "../services/clientes.api";

export default function useClientes() {
  const [clientes, setClientes] = useState([]);

  const token = localStorage.getItem("token");

  const cargarClientes = async () => {
    const data = await getClientes(token);
    setClientes(data);
  };

  const agregarCliente = async (cliente) => {
    try {
      await crearCliente(cliente, token);
      await cargarClientes();
      toast.success("Cliente registrado correctamente");
      return true;
    } catch {
      toast.error("Error al registrar el cliente");
      return false;
    }
  };

  const editarCliente = async (id, cliente) => {
    try {
      await actualizarCliente(id, cliente, token);
      await cargarClientes();
      toast.success("Cliente actualizado correctamente");
      return true;
    } catch {
      toast.error("Error al actualizar el cliente");
      return false;
    }
  };

  // Devuelve "historial" cuando el cliente tiene compras y no se puede borrar
  const borrarCliente = async (id) => {
    try {
      await eliminarCliente(id, token);
      await cargarClientes();
      toast.success("Cliente eliminado");
      return true;
    } catch (err) {
      if (err.response?.data?.code === "TIENE_HISTORIAL") return "historial";
      toast.error(err.response?.data?.error || "Error al eliminar el cliente");
      return false;
    }
  };

  const toggleEstadoCliente = async (id) => {
    try {
      const { activo } = await cambiarEstadoCliente(id, token);
      await cargarClientes();
      toast.success(activo ? "Cliente activado" : "Cliente desactivado");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar el estado del cliente");
      return false;
    }
  };

  const borrarDatosCliente = async (id) => {
    try {
      await anonimizarCliente(id, token);
      await cargarClientes();
      toast.success("Datos personales eliminados. Las compras se conservan.");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al borrar los datos del cliente");
      return false;
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  return {
    clientes,
    agregarCliente,
    editarCliente,
    borrarCliente,
    toggleEstadoCliente,
    borrarDatosCliente
  };
}