import axios from "axios";
 
const API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/ubicacion`;
 
export const getDepartamentos = async (token) => {
  const res = await axios.get(`${API}/departamentos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
 
export const getMunicipios = async (id_departamento, token) => {
  const res = await axios.get(`${API}/municipios/${id_departamento}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
 