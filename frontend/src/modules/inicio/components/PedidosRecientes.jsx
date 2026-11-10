import { Clock } from "lucide-react";

const ESTADOS = {
  pendiente:      { label: "Pendiente",  cls: "bg-amber-100 text-amber-700" },
  confirmado:     { label: "Confirmado", cls: "bg-primary/10 text-primary" },
  en_preparacion: { label: "Preparando", cls: "bg-purple-100 text-purple-700" },
  enviado:        { label: "Enviado",    cls: "bg-cyan-100 text-cyan-700" },
  entregado:      { label: "Entregado",  cls: "bg-primary/10 text-primary" },
  cancelado:      { label: "Cancelado",  cls: "bg-red-100 text-red-600" },
};

export default function PedidosRecientes({ pedidos, onIrA }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Últimos pedidos</h2>
          <p className="text-sm text-muted-foreground">Lo más reciente de tus clientes</p>
        </div>
        <button
          onClick={() => onIrA("ventas")}
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todos
        </button>
      </div>

      {!pedidos || pedidos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Aún no tienes pedidos</p>
          <p className="text-xs text-muted-foreground">Cuando tus clientes compren aparecerán aquí</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {pedidos.map((pedido) => {
            const estado = ESTADOS[pedido.estado] || ESTADOS.pendiente;
            const fecha = new Date(pedido.fecha_pedido).toLocaleDateString("es-CO", {
              day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit",
            });
            return (
              <li
                key={pedido.id}
                className="flex items-center gap-4 rounded-2xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted/50"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {pedido.nombre?.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {pedido.nombre} {pedido.apellido}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {fecha}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.cls}`}>
                    {estado.label}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    ${Number(pedido.total).toLocaleString("es-CO")}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
