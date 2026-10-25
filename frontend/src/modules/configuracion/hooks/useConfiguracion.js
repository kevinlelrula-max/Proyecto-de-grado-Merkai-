import { useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  getConfiguracion,
  updateDatosEmpresa,
  updateMetodosPago,
  uploadLogo,
  uploadBanner,
} from "../services/configuracion.api";

const STORAGE_KEY = "fishware_configuracion";

const METODOS_INICIALES = [
  { key: "efectivo",      label: "Efectivo",        descripcion: "Pago en billetes y monedas",            activo: true  },
  { key: "transferencia", label: "Transferencia",    descripcion: "Consignación bancaria o transferencia",  activo: true  },
  { key: "nequi",         label: "Nequi",            descripcion: "Pago digital por Nequi",                activo: true  },
  { key: "tarjeta",       label: "Tarjeta",          descripcion: "Débito o crédito con datáfono",         activo: false },
];

const EMPRESA_INICIAL = {
  nombre: "", nit: "", telefono: "", email: "",
  direccion: "", logoUrl: null, slug: "",
  descripcion: "", color_primario: "#0F6E56", color_secundario: "#0B1628",
  banner_url: null, instagram: "", whatsapp: "",
  facebook: "", horario: "",
  hero_titulo: "", hero_subtitulo: "", hero_btn_texto: "",
  nosotros_titulo: "", nosotros_contenido: "",
  unidad_predeterminada: "unidad",
  fuente: "Inter", productos_destacados_cantidad: 4, footer_texto: "",
  iva_porcentaje: 0,
};

function cargarDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function guardarEnStorage(empresa, metodos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ empresa, metodos }));
  } catch { /* storage lleno */ }
}

export function validarEmpresa(e) {
  const errores = {};
  if (!e.nombre?.trim()) errores.nombre = "El nombre de la empresa es obligatorio";
  if (e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) errores.email = "Escribe un correo válido";
  if (e.whatsapp && !/^\d{8,15}$/.test(e.whatsapp)) errores.whatsapp = "Solo números con indicativo de país, sin + ni espacios";
  const iva = Number(e.iva_porcentaje);
  if (Number.isNaN(iva) || iva < 0 || iva > 100) errores.iva_porcentaje = "El IVA debe estar entre 0 y 100";
  return errores;
}

const foto = (empresa, metodos) => JSON.stringify({ empresa, metodos });

export function useConfiguracion() {
  const local = cargarDesdeStorage();

  const [empresa, setEmpresa]         = useState(local?.empresa || EMPRESA_INICIAL);
  const [metodos, setMetodos]         = useState(local?.metodos || METODOS_INICIALES);
  const [base, setBase]               = useState(() => foto(local?.empresa || EMPRESA_INICIAL, local?.metodos || METODOS_INICIALES));
  const [logoPreview, setLogoPreview]     = useState(local?.empresa?.logoUrl || null);
  const [logoFile, setLogoFile]           = useState(null);
  const [bannerPreview, setBannerPreview] = useState(local?.empresa?.banner_url || null);
  const [bannerFile, setBannerFile]       = useState(null);
  const [cargando, setCargando]       = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState(null);
  const [exito, setExito]             = useState(false);
  const [intento, setIntento]         = useState(false);

  const errores = useMemo(() => validarEmpresa(empresa), [empresa]);
  // "Obligatorio" solo se muestra después de intentar guardar; el resto, en cuanto el valor es inválido
  const erroresVisibles = useMemo(() => (intento ? errores : { ...errores, nombre: undefined }), [errores, intento]);
  const hayCambios = useMemo(
    () => !!logoFile || !!bannerFile || foto(empresa, metodos) !== base,
    [empresa, metodos, base, logoFile, bannerFile]
  );

  // ── Carga inicial desde backend ──────────────────────────────────
  const cargarConfiguracion = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getConfiguracion();

      const nuevaEmpresa = {
        nombre:             data.nombre             || "",
        nit:                data.nit                || "",
        telefono:           data.telefono           || "",
        email:              data.email              || "",
        direccion:          data.direccion          || "",
        logoUrl:            data.logoUrl            || null,
        slug:               data.slug               || "",
        descripcion:        data.descripcion        || "",
        color_primario:     data.color_primario     || "#0F6E56",
        color_secundario:   data.color_secundario   || "#0B1628",
        banner_url:         data.banner_url         || null,
        instagram:          data.instagram          || "",
        whatsapp:           data.whatsapp           || "",
        facebook:           data.facebook           || "",
        horario:            data.horario            || "",
        hero_titulo:        data.hero_titulo        || "",
        hero_subtitulo:     data.hero_subtitulo     || "",
        hero_btn_texto:     data.hero_btn_texto     || "",
        nosotros_titulo:      data.nosotros_titulo      || "",
        nosotros_contenido:   data.nosotros_contenido   || "",
        unidad_predeterminada:         data.unidad_predeterminada         || "unidad",
        fuente:                        data.fuente                        || "Inter",
        productos_destacados_cantidad: data.productos_destacados_cantidad || 4,
        footer_texto:                  data.footer_texto                  || "",
        iva_porcentaje:                Number(data.iva_porcentaje)        || 0,
      };

      // Mezcla los metodos del backend con los labels del frontend
      const nuevosMetodos = METODOS_INICIALES.map((m) => {
        const fromApi = data.metodosPago?.find((dm) => dm.key === m.key);
        return fromApi ? { ...m, activo: fromApi.activo } : m;
      });

      setEmpresa(nuevaEmpresa);
      setMetodos(nuevosMetodos);
      setBase(foto(nuevaEmpresa, nuevosMetodos));
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview(data.logoUrl || null);
      setBannerPreview(data.banner_url || null);
      setIntento(false);
      guardarEnStorage(nuevaEmpresa, nuevosMetodos);
    } catch {
      // Backend no disponible — usa datos de localStorage (ya están en estado)
    } finally {
      setCargando(false);
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleEmpresaChange = useCallback((campo, valor) => {
    setEmpresa((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const toggleMetodo = useCallback((key) => {
    setMetodos((prev) =>
      prev.map((m) => (m.key === key ? { ...m, activo: !m.activo } : m))
    );
  }, []);

  const handleLogoChange = useCallback((file) => {
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleBannerChange = useCallback((file) => {
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Guardar ───────────────────────────────────────────────────────
  const guardar = useCallback(async () => {
    setIntento(true);
    setError(null);
    setExito(false);

    if (Object.keys(errores).length > 0) {
      toast.error("Revisa los campos marcados en rojo");
      return false;
    }

    setGuardando(true);
    // Persiste localmente siempre
    guardarEnStorage(empresa, metodos);

    try {
      await updateDatosEmpresa({
        nombre:             empresa.nombre,
        nit:                empresa.nit,
        telefono:           empresa.telefono,
        email:              empresa.email,
        direccion:          empresa.direccion,
        descripcion:        empresa.descripcion,
        color_primario:     empresa.color_primario,
        color_secundario:   empresa.color_secundario,
        instagram:          empresa.instagram,
        whatsapp:           empresa.whatsapp,
        facebook:           empresa.facebook,
        horario:            empresa.horario,
        hero_titulo:        empresa.hero_titulo,
        hero_subtitulo:     empresa.hero_subtitulo,
        hero_btn_texto:     empresa.hero_btn_texto,
        nosotros_titulo:      empresa.nosotros_titulo,
        nosotros_contenido:   empresa.nosotros_contenido,
        unidad_predeterminada:         empresa.unidad_predeterminada,
        fuente:                        empresa.fuente,
        productos_destacados_cantidad: empresa.productos_destacados_cantidad,
        footer_texto:                  empresa.footer_texto,
        iva_porcentaje:                empresa.iva_porcentaje,
      });

      await updateMetodosPago(
        metodos.map(({ key, activo }) => ({ key, activo }))
      );

      const empresaFinal = { ...empresa };

      if (logoFile) {
        const { logoUrl } = await uploadLogo(logoFile);
        empresaFinal.logoUrl = logoUrl;
        setLogoFile(null);
      }

      if (bannerFile) {
        const { bannerUrl } = await uploadBanner(bannerFile);
        empresaFinal.banner_url = bannerUrl;
        setBannerFile(null);
      }

      setEmpresa(empresaFinal);
      setBase(foto(empresaFinal, metodos));
      guardarEnStorage(empresaFinal, metodos);
      // Avisa al panel para que actualice el nombre y el logo del encabezado sin recargar
      window.dispatchEvent(new CustomEvent("configuracion:guardada", {
        detail: { nombre: empresaFinal.nombre, logoUrl: empresaFinal.logoUrl },
      }));

      setExito(true);
      toast.success("Configuración guardada correctamente");
      setTimeout(() => setExito(false), 3000);
      return true;
    } catch {
      // El guardado local funcionó, pero el servidor no: no se muestra como éxito
      setError("No se pudo guardar en el servidor. Tus cambios quedaron solo en este equipo; intenta de nuevo.");
      toast.warn("No se pudo guardar en el servidor. Intenta de nuevo.");
      return false;
    } finally {
      setGuardando(false);
    }
  }, [empresa, metodos, logoFile, bannerFile, errores]);

  const descartar = useCallback(() => {
    const guardado = JSON.parse(base);
    setEmpresa(guardado.empresa);
    setMetodos(guardado.metodos);
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(guardado.empresa.logoUrl || null);
    setBannerPreview(guardado.empresa.banner_url || null);
    setIntento(false);
    setError(null);
    setExito(false);
  }, [base]);

  return {
    empresa, metodos, logoPreview, bannerPreview,
    cargando, guardando, error, exito,
    errores: erroresVisibles, hayCambios,
    cargarConfiguracion,
    handleEmpresaChange,
    toggleMetodo,
    handleLogoChange,
    handleBannerChange,
    guardar,
    descartar,
  };
}
