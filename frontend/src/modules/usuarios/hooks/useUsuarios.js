import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  toggleUsuario,
  eliminarUsuario
} from "../services/usuarios.api";

export default function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const token = localStorage.getItem("token");

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuarios(token);
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const agregarUsuario = async (usuario) => {
    await crearUsuario(usuario, token);
    await cargarUsuarios();
  };

  // ✅ Actualizar datos de un usuario
  const actualizarUsuarioHook = async (id, data) => {
    await actualizarUsuario(id, data, token);
    await cargarUsuarios();
  };

  // ✅ Activar / desactivar
  const toggleUsuarioHook = async (id) => {
    await toggleUsuario(id, token);
    await cargarUsuarios();
  };

  // ✅ Eliminar
  const eliminarUsuarioHook = async (id) => {
    try {
      await eliminarUsuario(id, token);
      await cargarUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar usuario");
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  return {
    usuarios,
    agregarUsuario,
    actualizarUsuario: actualizarUsuarioHook,
    toggleUsuario:     toggleUsuarioHook,
    eliminarUsuario:   eliminarUsuarioHook,
  };
}