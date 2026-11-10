import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getPerfil, actualizarPerfil } from "../services/perfil.api";

export default function usePerfil() {
  const [perfil, setPerfil] = useState({});
  const token = localStorage.getItem("token");

  const cargarPerfil = async () => {
    const data = await getPerfil(token);
    setPerfil(data);
  };

  const guardarPerfil = async (data) => {
    try {
      await actualizarPerfil(data, token);
      await cargarPerfil();
      toast.success("Perfil actualizado correctamente");
      return true;
    } catch {
      toast.error("Error al actualizar el perfil");
      return false;
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  return { perfil, guardarPerfil };
}