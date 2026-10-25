import { useEffect } from "react";
import { useEnvioCliente } from "../hooks/useEnvioCliente";

const DEPARTAMENTOS = [
  { id: 5,  nombre: "Antioquia" },
  { id: 8,  nombre: "Atlántico" },
  { id: 11, nombre: "Bogotá D.C." },
  { id: 13, nombre: "Bolívar" },
  { id: 15, nombre: "Boyacá" },
  { id: 17, nombre: "Caldas" },
  { id: 18, nombre: "Caquetá" },
  { id: 19, nombre: "Cauca" },
  { id: 20, nombre: "Cesar" },
  { id: 23, nombre: "Córdoba" },
  { id: 25, nombre: "Cundinamarca" },
  { id: 27, nombre: "Chocó" },
  { id: 41, nombre: "Huila" },
  { id: 44, nombre: "La Guajira" },
  { id: 47, nombre: "Magdalena" },
  { id: 50, nombre: "Meta" },
  { id: 52, nombre: "Nariño" },
  { id: 54, nombre: "Norte de Santander" },
  { id: 63, nombre: "Quindío" },
  { id: 66, nombre: "Risaralda" },
  { id: 68, nombre: "Santander" },
  { id: 70, nombre: "Sucre" },
  { id: 73, nombre: "Tolima" },
  { id: 76, nombre: "Valle del Cauca" },
  { id: 81, nombre: "Arauca" },
  { id: 85, nombre: "Casanare" },
  { id: 86, nombre: "Putumayo" },
  { id: 88, nombre: "San Andrés y Providencia" },
  { id: 91, nombre: "Amazonas" },
  { id: 94, nombre: "Guainía" },
  { id: 95, nombre: "Guaviare" },
  { id: 97, nombre: "Vaupés" },
  { id: 99, nombre: "Vichada" },
];

/**
 * EnvioForm
 * Se renderiza dentro del Carrito.
 *
 * Props:
 *   onCostoChange(costo: number, departamentoId: number|null) — costo calculado y
 *                                   departamento elegido (el servidor recalcula el envío con él).
 */
export default function EnvioForm({ empresa_id, onCostoChange }) {
  const {
    departamentos,
    depSeleccionado,
    seleccionarDepartamento,
    costoAplicado,
    esGratis,
    requiereDepartamento,
    loading,
    error,
  } = useEnvioCliente(empresa_id);

  useEffect(() => {
    if (onCostoChange) onCostoChange(costoAplicado, depSeleccionado, requiereDepartamento);
  }, [costoAplicado, depSeleccionado, requiereDepartamento, onCostoChange]);

  if (loading) {
    return (
      <div style={s.wrap}>
        <span style={s.spinner} /> Cargando opciones de envío…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...s.wrap, color: "#ef4444", fontSize: "13px" }}>
        ⚠️ No se pudo cargar la configuración de envío.
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <h4 style={s.titulo}>Envío</h4>

      <label style={s.label} htmlFor="envio-dep">
        ¿A qué departamento enviamos?
      </label>

      <select
        id="envio-dep"
        style={s.select}
        value={depSeleccionado ?? ""}
        onChange={e => seleccionarDepartamento(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">— Selecciona tu departamento —</option>
        {DEPARTAMENTOS.map(dep => {
          const gratis = departamentos.includes(dep.id);
          return (
            <option key={dep.id} value={dep.id}>
              {dep.nombre}{gratis ? " · Envío gratis ✓" : ""}
            </option>
          );
        })}
      </select>

      {depSeleccionado !== null && (
        <div style={{ ...s.badge, ...(esGratis ? s.badgeGratis : s.badgeCobro) }}>
          {esGratis ? (
            <>🎉 ¡Envío <strong>gratuito</strong> a tu departamento!</>
          ) : (
            <>
              📦 Se añaden{" "}
              <strong>
                {costoAplicado.toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                })}
              </strong>{" "}
              por envío
            </>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    fontSize: "14px",
  },
  titulo: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  label: {
    fontSize: "13px",
    color: "#475569",
    fontWeight: "500",
  },
  select: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#1e293b",
    cursor: "pointer",
    outline: "none",
  },
  badge: {
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "center",
  },
  badgeGratis: {
    backgroundColor: "#e1f5ee",
    color: "#0f6e56",
    border: "1px solid #0f6e5633",
  },
  badgeCobro: {
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #f5853133",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid #cbd5e1",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
  },
};