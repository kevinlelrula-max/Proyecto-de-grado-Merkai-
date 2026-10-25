import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

export function useLealtad() {
  const [niveles, setNiveles]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [exito, setExito]           = useState("");

  // ── Form para crear/editar
  const FORM_INICIAL = { nombre: "", monto_minimo: "", descuento_porcentaje: "" };
  const [form, setForm]             = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  // ── Cargar niveles
  const fetchNiveles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/productos/lealtad`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNiveles(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los niveles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNiveles();
  }, [fetchNiveles]);

  // ── Handlers del form
  const handleChange = useCallback((campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const abrirFormNuevo = useCallback(() => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setMostrarForm(true);
  }, []);

  const abrirFormEditar = useCallback((nivel) => {
    setForm({
      nombre:               nivel.nombre,
      monto_minimo:         nivel.monto_minimo,
      descuento_porcentaje: nivel.descuento_porcentaje,
    });
    setEditandoId(nivel.id);
    setMostrarForm(true);
  }, []);

  const cerrarForm = useCallback(() => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setMostrarForm(false);
  }, []);

  // ── Guardar (crear o editar)
  const guardar = useCallback(async () => {
    if (!form.nombre || !form.monto_minimo || !form.descuento_porcentaje) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const url = editandoId
        ? `${API_BASE}/api/productos/lealtad/${editandoId}`
        : `${API_BASE}/api/productos/lealtad`;

      const method = editandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          nombre:               form.nombre,
          monto_minimo:         Number(form.monto_minimo),
          descuento_porcentaje: Number(form.descuento_porcentaje),
          activo:               true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      const msg = editandoId ? "Nivel actualizado" : "Nivel creado";
      setExito(msg);
      toast.success(msg);
      setTimeout(() => setExito(""), 2500);
      cerrarForm();
      await fetchNiveles();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Error al guardar el nivel");
    } finally {
      setGuardando(false);
    }
  }, [form, editandoId, cerrarForm, fetchNiveles]);

  // ── Eliminar nivel
  const eliminar = useCallback(async (id) => {
    if (!confirm("¿Eliminar este nivel de lealtad?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/productos/lealtad/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo eliminar el nivel");
      }
      await fetchNiveles();
      toast.success("Nivel eliminado");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  }, [fetchNiveles]);

  // ── Togglear activo/inactivo
  const toggleActivo = useCallback(async (nivel) => {
    try {
      await fetch(`${API_BASE}/api/productos/lealtad/${nivel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...nivel, activo: !nivel.activo }),
      });
      await fetchNiveles();
      toast.success(nivel.activo ? "Nivel desactivado" : "Nivel activado");
    } catch {
      setError("No se pudo actualizar el nivel.");
      toast.error("No se pudo actualizar el nivel");
    }
  }, [fetchNiveles]);

  return {
    niveles,
    loading,
    error,
    guardando,
    exito,
    form,
    editandoId,
    mostrarForm,
    handleChange,
    abrirFormNuevo,
    abrirFormEditar,
    cerrarForm,
    guardar,
    eliminar,
    toggleActivo,
  };
}