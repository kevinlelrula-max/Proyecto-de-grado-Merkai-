import { Receipt } from "lucide-react";
import { Tarjeta, Campo, Selector } from "./ui";

const UNIDADES = [
  { value: "unidad",  label: "Unidad / Pieza" },
  { value: "kg",      label: "Kilogramo (kg)" },
  { value: "gramo",   label: "Gramo (g)" },
  { value: "litro",   label: "Litro (L)" },
  { value: "ml",      label: "Mililitro (ml)" },
  { value: "metro",   label: "Metro (m)" },
  { value: "caja",    label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "docena",  label: "Docena" },
];

export default function VentasForm({ empresa, errores = {}, onChange }) {
  return (
    <Tarjeta Icon={Receipt} titulo="Impuestos y unidades" descripcion="Valores por defecto que se aplican en las ventas y en el inventario">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Campo
          id="emp-iva"
          label="IVA / Impuesto (%)"
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={empresa.iva_porcentaje ?? 0}
          onChange={(e) => onChange("iva_porcentaje", e.target.value === "" ? 0 : Number(e.target.value))}
          error={errores.iva_porcentaje}
          ayuda="Ej.: 19 para Colombia. Se suma al subtotal en ventas y tienda. Usa 0 para no aplicar impuesto."
        />
        <Selector
          id="emp-unidad"
          label="Unidad para productos nuevos"
          value={empresa.unidad_predeterminada || "unidad"}
          onChange={(e) => onChange("unidad_predeterminada", e.target.value)}
          ayuda="Cada producto puede cambiarla después."
        >
          {UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </Selector>
      </div>
    </Tarjeta>
  );
}
