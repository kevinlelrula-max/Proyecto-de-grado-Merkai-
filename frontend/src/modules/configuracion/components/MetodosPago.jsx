import { Banknote, Building2, Smartphone, CreditCard, DollarSign, Wallet } from "lucide-react";
import { Tarjeta, Interruptor } from "./ui";

const ICONOS = {
  efectivo:      { Icon: Banknote,   bg: "bg-emerald-50", text: "text-emerald-700" },
  transferencia: { Icon: Building2,  bg: "bg-blue-50",    text: "text-blue-700"    },
  nequi:         { Icon: Smartphone, bg: "bg-purple-50",  text: "text-purple-700"  },
  tarjeta:       { Icon: CreditCard, bg: "bg-amber-50",   text: "text-amber-700"   },
};

export default function MetodosPago({ metodos, onToggle }) {
  const activos = metodos.filter((m) => m.activo).length;

  return (
    <Tarjeta
      Icon={Wallet}
      titulo="Métodos de pago"
      descripcion="Elige los métodos que acepta tu negocio en el punto de venta y en los pedidos"
      acciones={
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-3 py-1 whitespace-nowrap">
          {activos} de {metodos.length} activos
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {metodos.map((metodo) => {
          const { Icon, bg, text } = ICONOS[metodo.key] || { Icon: DollarSign, bg: "bg-slate-100", text: "text-slate-700" };
          return (
            <div
              key={metodo.key}
              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                metodo.activo ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${bg} ${text} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{metodo.label}</p>
                  <p className="text-xs text-slate-600">{metodo.descripcion}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`hidden sm:inline text-xs font-semibold ${metodo.activo ? "text-emerald-700" : "text-slate-500"}`}>
                  {metodo.activo ? "Activo" : "Inactivo"}
                </span>
                <Interruptor activo={metodo.activo} onChange={() => onToggle(metodo.key)} etiqueta={`${metodo.activo ? "Desactivar" : "Activar"} ${metodo.label}`} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Para cobrar con tarjeta en la tienda en línea, conecta una pasarela de pago en la sección <strong className="text-slate-700">Integraciones</strong> del menú.
      </p>
    </Tarjeta>
  );
}
