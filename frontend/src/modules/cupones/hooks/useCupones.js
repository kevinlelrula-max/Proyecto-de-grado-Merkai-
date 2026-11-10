import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getCupones,
  crearCupon,
  actualizarCupon,
  toggleCupon,
  eliminarCupon,
  getUsosCupon,
} from "../services/cuponesService";

const FORM_INICIAL = {
  codigo:           "",
  descripcion:      "",
  tipo:             "porcentaje",
  valor:            "",
  minimo_compra:    "",
  maximo_descuento: "",
  usos_totales:     "",
  usos_por_cliente: "1",
  fecha_inicio:     "",
  fecha_fin:        "",
};

export function useCupones() {
  const token = localStorage.getItem("token");

  const [cupones,     setCupones]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [exito,       setExito]       = useState("");
  const [guardando,   setGuardando]   = useState(false);
  const [editandoId,  setEditandoId]  = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form,        setForm]        = useState(FORM_INICIAL);

  // Usos
  const [cuponUsos,       setCuponUsos]       = useState(null); // { cupon, usos }
  const [mostrarUsos,     setMostrarUsos]     = useState(false);
  const [loadingUsos,     setLoadingUsos]     = useState(false);

  // ── Cargar lista ──────────────────────────────────────────────────────────
  const fetchCupones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCupones(token);
      setCupones(data);
    } catch {
      setError("Error al cargar los cupones");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCupones(); }, [fetchCupones]);

  // ── Formulario ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "codigo" ? value.toUpperCase() : value,
    }));
    setError("");
  };

  const abrirFormNuevo = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setMostrarForm(true);
    setError("");
  };

  const abrirFormEditar = (cupon) => {
    setForm({
      codigo:           cupon.codigo,
      descripcion:      cupon.descripcion || "",
      tipo:             cupon.tipo,
      valor:            cupon.valor,
      minimo_compra:    cupon.minimo_compra || "",
      maximo_descuento: cupon.maximo_descuento || "",
      usos_totales:     cupon.usos_totales || "",
      usos_por_cliente: cupon.usos_por_cliente || 1,
      fecha_inicio:     cupon.fecha_inicio ? cupon.fecha_inicio.slice(0, 10) : "",
      fecha_fin:        cupon.fecha_fin    ? cupon.fecha_fin.slice(0, 10)    : "",
    });
    setEditandoId(cupon.id);
    setMostrarForm(true);
    setError("");
  };

  const cerrarForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setError("");
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const guardar = async () => {
    setError("");
    if (!form.codigo.trim()) return setError("El código es obligatorio");
    if (!form.valor || isNaN(form.valor)) return setError("El valor es obligatorio y debe ser un número");

    setGuardando(true);
    try {
      const payload = {
        ...form,
        valor:            parseFloat(form.valor),
        minimo_compra:    form.minimo_compra    ? parseFloat(form.minimo_compra)    : 0,
        maximo_descuento: form.maximo_descuento ? parseFloat(form.maximo_descuento) : null,
        usos_totales:     form.usos_totales     ? parseInt(form.usos_totales)       : null,
        usos_por_cliente: form.usos_por_cliente ? parseInt(form.usos_por_cliente)   : 1,
        fecha_inicio:     form.fecha_inicio || null,
        fecha_fin:        form.fecha_fin    || null,
      };

      if (editandoId) {
        await actualizarCupon(editandoId, payload, token);
        setExito("Cupón actualizado correctamente");
        toast.success("Cupón actualizado correctamente");
      } else {
        await crearCupon(payload, token);
        setExito("Cupón creado correctamente");
        toast.success("Cupón creado correctamente");
      }

      cerrarForm();
      fetchCupones();
      setTimeout(() => setExito(""), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || "Error al guardar el cupón";
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggle = async (id) => {
    try {
      const { activo } = await toggleCupon(id, token);
      setCupones((prev) => prev.map((c) => (c.id === id ? { ...c, activo } : c)));
      toast.success(activo ? "Cupón activado" : "Cupón desactivado");
    } catch {
      setError("Error al cambiar el estado del cupón");
      toast.error("Error al cambiar el estado del cupón");
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este cupón? No se puede deshacer.")) return;
    try {
      await eliminarCupon(id, token);
      setCupones((prev) => prev.filter((c) => c.id !== id));
      setExito("Cupón eliminado");
      setTimeout(() => setExito(""), 3000);
      toast.success("Cupón eliminado");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al eliminar el cupón";
      setError(msg);
      toast.error(msg);
    }
  };

  // ── Ver usos ──────────────────────────────────────────────────────────────
  const verUsos = async (cupon) => {
    setLoadingUsos(true);
    setMostrarUsos(true);
    try {
      const usos = await getUsosCupon(cupon.id, token);
      setCuponUsos({ cupon, usos });
    } catch {
      setError("Error al cargar los usos");
    } finally {
      setLoadingUsos(false);
    }
  };

  const cerrarUsos = () => {
    setMostrarUsos(false);
    setCuponUsos(null);
  };

  return {
    cupones,
    loading,
    error,
    exito,
    guardando,
    editandoId,
    mostrarForm,
    form,
    cuponUsos,
    mostrarUsos,
    loadingUsos,
    handleChange,
    abrirFormNuevo,
    abrirFormEditar,
    cerrarForm,
    guardar,
    toggle,
    eliminar,
    verUsos,
    cerrarUsos,
  };
}
