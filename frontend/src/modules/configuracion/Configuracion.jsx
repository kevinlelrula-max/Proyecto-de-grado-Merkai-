import { useState, useEffect } from "react";
import { Building2, CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";
import EmpresaForm from "./components/EmpresaForm";
import VentasForm from "./components/VentasForm";
import MetodosPago from "./components/MetodosPago";
import { useConfiguracion } from "./hooks/useConfiguracion";

const TABS = [
  { key: "empresa", label: "Empresa",         descripcion: "Identidad y contacto",           Icon: Building2 },
  { key: "ventas",  label: "Ventas y pagos",  descripcion: "Impuestos y métodos de pago",    Icon: CreditCard },
];

function Esqueleto() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-5" aria-busy="true" aria-label="Cargando configuración">
      <div className="h-8 w-56 bg-slate-200 rounded-lg" />
      <div className="h-12 w-80 bg-slate-200 rounded-xl" />
      <div className="h-64 bg-slate-100 rounded-2xl" />
      <div className="h-48 bg-slate-100 rounded-2xl" />
    </div>
  );
}

export default function Configuracion() {
  const [tabActiva, setTabActiva] = useState("empresa");

  const {
    empresa, metodos, logoPreview,
    cargando, guardando, error, exito, errores, hayCambios,
    cargarConfiguracion, handleEmpresaChange,
    toggleMetodo, handleLogoChange, guardar, descartar,
  } = useConfiguracion();

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  if (cargando) return <Esqueleto />;

  // Si hay un error de validación en otra pestaña, lo señalamos en la pestaña correspondiente
  const pestañaConError = { empresa: !!(errores.nombre || errores.email || errores.whatsapp), ventas: !!errores.iva_porcentaje };
  const hayBarra = hayCambios || guardando || exito || !!error;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Configuración</h2>
          <p className="text-sm text-slate-600 mt-0.5">Datos de tu negocio, impuestos y formas de cobro</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 ${
            hayCambios ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${hayCambios ? "bg-amber-500" : "bg-emerald-500"}`} />
          {hayCambios ? "Cambios sin guardar" : "Todo guardado"}
        </span>
      </div>

      {/* Pestañas */}
      <div role="tablist" className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {TABS.map(({ key, label, descripcion, Icon }) => {
          const activa = tabActiva === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={activa}
              onClick={() => setTabActiva(key)}
              className={`flex items-center gap-3 text-left rounded-2xl border px-4 py-3 transition ${
                activa
                  ? "bg-white border-blue-300 shadow-sm ring-4 ring-blue-50"
                  : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300"
              }`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activa ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${activa ? "text-slate-900" : "text-slate-700"}`}>{label}</span>
                <span className="block text-xs text-slate-500">{descripcion}</span>
              </span>
              {pestañaConError[key] && <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" title="Hay campos por corregir" />}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div role="tabpanel" className="space-y-5">
        {tabActiva === "empresa" && (
          <EmpresaForm
            empresa={empresa}
            logoPreview={logoPreview}
            errores={errores}
            onChange={handleEmpresaChange}
            onLogoChange={handleLogoChange}
          />
        )}

        {tabActiva === "ventas" && (
          <>
            <VentasForm empresa={empresa} errores={errores} onChange={handleEmpresaChange} />
            <MetodosPago metodos={metodos} onToggle={toggleMetodo} />
          </>
        )}
      </div>

      {/* Barra de acciones flotante */}
      {hayBarra && (
        <div className="sticky bottom-4 z-20 mt-6 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl bg-slate-900 text-white pl-5 pr-2 py-2 shadow-2xl max-w-full">
            <span className="flex items-center gap-2 text-sm font-medium">
              {exito
                ? <><CheckCircle2 size={16} className="text-emerald-400" /> Cambios guardados</>
                : error
                ? <><AlertTriangle size={16} className="text-amber-400 flex-shrink-0" /> <span className="text-amber-100">{error}</span></>
                : guardando
                ? "Guardando…"
                : "Tienes cambios sin guardar"}
            </span>
            {hayCambios && !guardando && (
              <button onClick={descartar} className="text-sm font-semibold px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition">
                Descartar
              </button>
            )}
            {(hayCambios || guardando) && (
              <button
                onClick={guardar}
                disabled={guardando}
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition active:scale-95"
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
