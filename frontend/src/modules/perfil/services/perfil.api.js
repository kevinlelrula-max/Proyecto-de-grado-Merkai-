import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/usuarios/perfil`;

export const getPerfil = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const actualizarPerfil = async (data, token) => {
  const res = await axios.put(API, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const cambiarContrasena = async (contrasena_actual, contrasena_nueva, token) => {
  const res = await axios.put(
    `${API}/contrasena`,
    { contrasena_actual, contrasena_nueva },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};