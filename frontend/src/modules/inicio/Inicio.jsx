import { useState } from "react";
import { Sun, Sunrise, Moon } from "lucide-react";
import { useInicio } from "./hooks/useInicio";
import StatCard            from "./components/StatCard";
import OnboardingCard      from "./components/OnboardingCard";
import PedidosRecientes    from "./components/PedidosRecientes";
import BannerReferidos     from "./components/BannerReferidos";
import ModalQR             from "./components/ModalQR";
import InsightWidget        from "./components/InsightWidget";
import ClientesReconquistar from "./components/ClientesReconquistar";

function getIconoSaludo(saludo) {
  if (saludo === "Buenos días")  return Sunrise;
  if (saludo === "Buenas tardes") return Sun;
  return Moon;
}

function getNombreEmpresa() {
  try {
    const config = JSON.parse(localStorage.getItem("fishware_configuracion") || "{}");
    return config?.empresa?.nombre || "tu empresa";
  } catch {
    return "tu empresa";
  }
}

export default function Inicio({ onIrA }) {
  const {
    resumen, loading, error,
    saludo, nombreUsuario,
    onboarding, esOnboardingCompleto,
  } = useInicio();

  const [forzarDashboard, setForzarDashboard] = useState(false);
  const [mostrarQR, setMostrarQR]             = useState(false);
  const [copiado, setCopiado]                 = useState(false);

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(linkTienda);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el navegador bloqueó el portapapeles: el enlace sigue visible para copiarlo a mano */ }
  };

  const mostrarOnboarding = !esOnboardingCompleto && !forzarDashboard;
  const slug              = localStorage.getItem("empresa_slug") || "";
  const linkTienda        = slug ? `${window.location.origin}/tienda/${slug}` : null;
  const IconoSaludo       = getIconoSaludo(saludo);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20">
        <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-teal-400 animate-spin" />
        <p className="text-sm text-slate-400">Cargando tu panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-7 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="p-7 flex flex-col gap-5 font-sans">

      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium capitalize text-primary mb-1">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {saludo}, {nombreUsuario}
          </h2>
        </div>
        {linkTienda && (
          <a
            href={linkTienda}
            target="_blank"
            rel="noreferrer"
            className="self-center px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl no-underline transition-colors"
          >
            Ver mi tienda
          </a>
        )}
      </div>

      {/* Enlace público de la tienda: es el que se comparte en redes, mensajes o pósters */}
      {linkTienda && (
        <div className="flex items-center gap-2.5 flex-wrap bg-white border border-slate-200 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-[220px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Enlace de tu tienda</p>
            <p className="text-sm font-semibold text-slate-800 break-all select-all">{linkTienda}</p>
          </div>
          <button
            onClick={copiarEnlace}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            {copiado ? "¡Copiado!" : "Copiar enlace"}
          </button>
          <button
            onClick={() => setMostrarQR(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Código QR
          </button>
        </div>
      )}

      {mostrarOnboarding ? (
        <OnboardingCard
          onboarding={onboarding}
          onIrA={onIrA}
          onSkip={() => setForzarDashboard(true)}
        />
      ) : (
        <>
          <InsightWidget />

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <StatCard
              label="Ventas hoy"
              valor={`$${Number(resumen?.ventasHoy?.ingresos_hoy || 0).toLocaleString("es-CO")}`}
              descripcion={`${resumen?.ventasHoy?.total_ventas || 0} transacciones`}
            />
            <StatCard
              label="Pedidos pendientes"
              valor={resumen?.pedidosPendientes || 0}
              descripcion="Sin atender"
              alerta={resumen?.pedidosPendientes > 0}
            />
            <StatCard
              label="Stock bajo"
              valor={resumen?.stockBajo || 0}
              descripcion="Bajo el mínimo"
              alerta={resumen?.stockBajo > 0}
            />
            <StatCard
              label="Clientes"
              valor={resumen?.totalClientes || 0}
              descripcion="Registrados"
            />
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-5 items-start">
            <PedidosRecientes pedidos={resumen?.ultimosPedidos} onIrA={onIrA} />
            <ClientesReconquistar
              clientes={resumen?.clientesDormidos || []}
              onIrA={onIrA}
            />
          </div>

          {!onboarding?.tieneReferidos && (resumen?.totalClientes ?? 0) > 0 && (
            <BannerReferidos onIrA={onIrA} totalClientes={resumen.totalClientes} />
          )}
        </>
      )}

      {mostrarQR && linkTienda && (
        <ModalQR url={linkTienda} onClose={() => setMostrarQR(false)} />
      )}
    </div>
  );
}