import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { decodeToken, tokenVigente } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ROLES_ADMIN = [1, 2]; // SuperAdmin y Administrador tienen acceso a todas las secciones

// `seccion` (opcional): además de la sesión exige que el rol tenga esa sección en rol_permisos,
// la misma fuente que arma el menú del panel. El servidor la vuelve a validar en cada petición.
export default function ProtectedRoute({ children, seccion }) {
  const token = localStorage.getItem("token");
  const vigente = !!token && tokenVigente(token);
  const payload = vigente ? decodeToken(token) : null;
  const rolId = payload?.rol_id;

  const requiereConsulta = !!seccion && !!payload && rolId !== 4 && !ROLES_ADMIN.includes(rolId);
  const [permisos, setPermisos] = useState(null);

  useEffect(() => {
    if (!requiereConsulta) return;
    let activo = true;
    fetch(`${API_URL}/api/usuarios/roles/${rolId}/permisos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (activo) setPermisos(Array.isArray(d) ? d : []); })
      .catch(() => { if (activo) setPermisos([]); });
    return () => { activo = false; };
  }, [requiereConsulta, rolId, token]);

  if (!vigente || !payload || rolId === 4) return <Navigate to="/empresa/login" replace />;
  if (requiereConsulta) {
    if (permisos === null) return null;
    if (!permisos.includes(seccion)) return <Navigate to="/dashboard" replace />;
  }
  return children;
}
