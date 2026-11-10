import { Ticket, ArrowRight } from "lucide-react";

const diasDesde = (fecha) => {
  if (!fecha || fecha === "2000-01-01") return null;
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
};

export default function ClientesReconquistar({ clientes = [], onIrA }) {
  return (
    <section className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Clientes por reconquistar</h2>
        {clientes.length > 0 && (
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {clientes.length}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        No compran hace más de 30 días. Un cupón puede traerlos de vuelta.
      </p>

      {clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay clientes inactivos por ahora.</p>
      ) : (
        <>
          <ul className="flex flex-1 flex-col gap-1">
            {clientes.slice(0, 6).map((c) => {
              const dias = diasDesde(c.ultima_compra);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {(c.nombre?.charAt(0) || "?").toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {c.nombre} {c.apellido || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dias ? `Hace ${dias} días` : "Sin compras"}
                    </p>
                  </div>
                  <button
                    onClick={() => onIrA("cupones")}
                    className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <Ticket className="size-3.5" />
                    Enviar cupón
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            onClick={() => onIrA("clientes")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver todos los clientes
            <ArrowRight className="size-4" />
          </button>
        </>
      )}
    </section>
  );
}
