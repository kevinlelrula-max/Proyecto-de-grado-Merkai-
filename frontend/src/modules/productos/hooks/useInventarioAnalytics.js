
import { useState, useEffect } from "react";
const API=import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useInventarioAnalytics(){
  const [datos, setdatos] = useState(null);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const token=localStorage.getItem("token");
    fetch(`${API}/api/reportesEmpresa/inicio`,{
      headers: {Authorization: `Bearer ${token}`},
    })
    .then(r => r.ok ? r.json() : null)
    .then(data => setdatos(data))
    .catch(() => {})
    .finally(() => setloading (false));
  }, [] )

  return {
    stockBajo:  datos?.productosStockBajo || [],
    predictorStock:  datos?.predictorStock || [],
    sugerenciasReorden:  datos?.sugerenciasReorden || [],
    loading,
  }


}