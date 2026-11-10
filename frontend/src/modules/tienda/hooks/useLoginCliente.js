import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginCliente } from "../../../services/api";

export function useLoginCliente() {
  const navigate = useNavigate();
  const location = useLocation();

  const slug = localStorage.getItem("ultima_empresa_slug");
  const from = location.state?.from || (slug ? `/tienda/${slug}` : "/");

  const [form, setForm]         = useState({ usuario: "", contrasena: "" });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario || !form.contrasena) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginCliente(form);
      if (res.token) {
        localStorage.setItem("cliente_token",  res.token);
        localStorage.setItem("cliente_id",     res.cliente_id);
        localStorage.setItem("cliente_nombre", res.nombre);
        navigate(from, { replace: true });
      } else {
        setError(res.error || "Correo o contraseña incorrectos.");
      }
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, error, showPass, setShowPass, handleChange, handleSubmit };
}
