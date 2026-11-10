import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("cliente_token");
}

export function usePerfilCliente(empresaId) {
  const clienteId = localStorage.getItem("cliente_id");

  // ── Datos del perfil
  const [perfil, setPerfil]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // ── Form datos personales
  const [form, setForm]           = useState({
    nombre: "", apellido: "", telefono: "", direccion: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [exitoDatos, setExitoDatos] = useState(false);

  // ── Form contraseña
  const [formPass, setFormPass]   = useState({
    contrasena_actual: "", contrasena_nueva: "", confirmar: "",
  });
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [exitoPass, setExitoPass]         = useState(false);
  const [errorPass, setErrorPass]         = useState("");

  // ── Nivel de lealtad
  const [nivelLealtad, setNivelLealtad] = useState(null);

  // ── Cargar perfil
  const fetchPerfil = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/clientes/perfil`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerfil(data);
      setForm({
        nombre:    data.nombre    || "",
        apellido:  data.apellido  || "",
        telefono:  data.telefono  || "",
        direccion: data.direccion || "",
      });
    } catch {
      setError("No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Cargar nivel de lealtad si hay empresaId
  useEffect(() => {
    if (!clienteId || !empresaId) return;
    fetch(`${API_BASE}/api/productos/lealtad/cliente/${clienteId}/empresa/${empresaId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setNivelLealtad(data); })
      .catch(() => {});
  }, [clienteId, empresaId]);

  useEffect(() => { fetchPerfil(); }, [fetchPerfil]);

  // ── Handlers datos personales
  const handleChange = useCallback((campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const guardarDatos = useCallback(async () => {
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/clientes/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerfil(data);
      // ✅ Actualizar nombre en localStorage
      localStorage.setItem("cliente_nombre", data.nombre);
      setExitoDatos(true);
      setTimeout(() => setExitoDatos(false), 3000);
    } catch {
      setError("No se pudo actualizar el perfil.");
    } finally {
      setGuardando(false);
    }
  }, [form]);

  // ── Handlers contraseña
  const handleChangePass = useCallback((campo, valor) => {
    setFormPass(prev => ({ ...prev, [campo]: valor }));
    setErrorPass("");
  }, []);

  const cambiarContrasena = useCallback(async () => {
    if (formPass.contrasena_nueva !== formPass.confirmar) {
      setErrorPass("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (formPass.contrasena_nueva.length < 6) {
      setErrorPass("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setGuardandoPass(true);
    setErrorPass("");
    try {
      const res = await fetch(`${API_BASE}/api/clientes/perfil/contrasena`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          contrasena_actual: formPass.contrasena_actual,
          contrasena_nueva:  formPass.contrasena_nueva,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorPass(data.error || "Error al cambiar contraseña.");
        return;
      }
      setExitoPass(true);
      setFormPass({ contrasena_actual: "", contrasena_nueva: "", confirmar: "" });
      setTimeout(() => setExitoPass(false), 3000);
    } catch {
      setErrorPass("No se pudo cambiar la contraseña.");
    } finally {
      setGuardandoPass(false);
    }
  }, [formPass]);

  return {
    perfil, loading, error,
    form, guardando, exitoDatos,
    formPass, guardandoPass, exitoPass, errorPass,
    nivelLealtad,
    handleChange,
    guardarDatos,
    handleChangePass,
    cambiarContrasena,
  };
}