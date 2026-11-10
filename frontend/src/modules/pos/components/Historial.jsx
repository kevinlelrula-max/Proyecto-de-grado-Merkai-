import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Historial({ token }) {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await fetch(`${API}/api/ventas/empresa`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        // 🔥 asegurar array
        const lista = Array.isArray(data)
          ? data
          : data.ventas || data.data || [];

        // 📅 filtrar SOLO HOY
        const hoy = new Date();
        const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        const filtradas = lista.filter(v => {
          const fecha = new Date(v.created_at || v.fecha);
          return fecha >= inicioDia;
        });

        setVentas(filtradas);

      } catch (error) {
        console.error("Error cargando historial:", error);
        setVentas([]);
      }
    };

    fetchHistorial();
  }, [token]);

  return (
    <div className="historial-wrap">
      <table className="historial-tabla">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Método</th>
            <th>Total</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {ventas.map((v) => (
            <tr key={v.id || v.venta_id}>
              <td>{v.cliente_nombre || v.cliente}</td>

              <td>
                <span className="badge-metodo">
                  {v.metodo_pago}
                </span>
              </td>

              <td>
                ${Number(v.total || 0).toLocaleString("es-CO")}
              </td>

              <td>
                {new Date(v.created_at || v.fecha).toLocaleString("es-CO")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}