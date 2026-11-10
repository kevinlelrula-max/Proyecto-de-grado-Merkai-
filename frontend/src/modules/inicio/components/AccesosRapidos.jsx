import { BarChart3, Store, Package, Ticket } from "lucide-react";

const actions = [
  { label: "Reportes",        desc: "Revisa tus números",      icon: BarChart3, key: "reportes"  },
  { label: "Editor de tienda",desc: "Personaliza tu vitrina",  icon: Store,     key: "editor"    },
  { label: "Productos",       desc: "Gestiona tu inventario",  icon: Package,   key: "productos" },
  { label: "Cupones",         desc: "Crea promociones",        icon: Ticket,    key: "cupones"   },
];

export default function AccesosRapidos({ onIrA }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={() => onIrA(action.key)}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block font-medium text-foreground">{action.label}</span>
              <span className="block text-xs text-muted-foreground">{action.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
