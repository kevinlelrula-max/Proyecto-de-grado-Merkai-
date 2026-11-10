import { useState, useEffect, useRef, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const SECCIONES = [
  { key: "inicio",        label: "Inicio",          icon: "🏠", grupo: "Sección" },
  { key: "productos",     label: "Productos",        icon: "📦", grupo: "Sección" },
  { key: "clientes",      label: "Clientes",         icon: "👥", grupo: "Sección" },
  { key: "ventas",        label: "Ventas / POS",     icon: "🛒", grupo: "Sección" },
  { key: "pos",           label: "Punto de Venta",   icon: "🖥️",  grupo: "Sección" },
  { key: "reportes",      label: "Reportes",         icon: "📊", grupo: "Sección" },
  { key: "pedidos",       label: "Pedidos online",   icon: "📬", grupo: "Sección" },
  { key: "editor",        label: "Editor de tienda", icon: "🎨", grupo: "Sección" },
  { key: "cupones",       label: "Cupones",          icon: "🏷️",  grupo: "Sección" },
  { key: "lealtad",       label: "Lealtad",          icon: "⭐", grupo: "Sección" },
  { key: "reseñas",       label: "Reseñas",          icon: "💬", grupo: "Sección" },
  { key: "mensajes",      label: "Mensajes",         icon: "✉️",  grupo: "Sección" },
  { key: "usuarios",      label: "Usuarios",         icon: "👤", grupo: "Sección" },
  { key: "configuracion", label: "Configuración",    icon: "⚙️",  grupo: "Sección" },
  { key: "referidos",     label: "Referidos",        icon: "🔗", grupo: "Sección" },
  { key: "integraciones", label: "Integraciones",    icon: "🔌", grupo: "Sección" },
];

export default function BuscadorGlobal({ abierto, onCerrar, onIrA, permisosRol = [] }) {
  const [query,     setQuery]     = useState("");
  const [productos, setProductos] = useState([]);
  const [clientes,  setClientes]  = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [cursor,    setCursor]    = useState(0);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);
  const timerRef  = useRef(null);
  const token     = localStorage.getItem("token");

  // Secciones filtradas por permisos
  const seccionesFiltradas = SECCIONES.filter(s =>
    permisosRol.includes(s.key) &&
    (query === "" || s.label.toLowerCase().includes(query.toLowerCase()))
  );

  // Resultados combinados
  const resultados = [
    ...seccionesFiltradas.map(s => ({ ...s, tipo: "seccion" })),
    ...productos.map(p => ({ key: "productos", label: p.nombre, sub: `$${parseFloat(p.precio).toLocaleString("es-CO")} / ${p.unidad||"unidad"}`, icon: "📦", grupo: "Producto", tipo: "producto", id: p.id })),
    ...clientes.map(c  => ({ key: "clientes",  label: `${c.nombre} ${c.apellido||""}`.trim(), sub: c.email || c.telefono || "", icon: "👤", grupo: "Cliente",  tipo: "cliente",  id: c.id })),
  ];

  // Buscar al tipear (debounce 300ms)
  useEffect(() => {
    if (!abierto || !token) return;
    clearTimeout(timerRef.current);
    if (query.trim() === "") { setProductos([]); setClientes([]); return; }
    setCargando(true);
    timerRef.current = setTimeout(async () => {
      try {
        const [rProd, rCli] = await Promise.all([
          fetch(`${BASE_URL}/api/productos?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BASE_URL}/api/clientes/buscar?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const prods = rProd.ok ? await rProd.json() : [];
        const clis  = rCli.ok  ? await rCli.json()  : [];
        const arr   = Array.isArray(prods) ? prods : (prods.productos || []);
        setProductos(arr.filter(p => p.nombre?.toLowerCase().includes(query.toLowerCase())).slice(0, 5));
        setClientes((Array.isArray(clis) ? clis : []).slice(0, 5));
      } catch { } finally { setCargando(false); }
    }, 280);
    return () => clearTimeout(timerRef.current);
  }, [query, abierto]);

  // Focus input al abrir
  useEffect(() => {
    if (abierto) {
      setQuery(""); setCursor(0); setProductos([]); setClientes([]);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [abierto]);

  // Reset cursor cuando cambian resultados
  useEffect(() => { setCursor(0); }, [resultados.length]);

  // Scroll del ítem activo a la vista
  useEffect(() => {
    const items = listRef.current?.querySelectorAll("[data-item]");
    items?.[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const seleccionar = useCallback((item) => {
    onIrA(item.key);
    onCerrar();
  }, [onIrA, onCerrar]);

  // Teclado
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, resultados.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")     { if (resultados[cursor]) seleccionar(resultados[cursor]); }
    if (e.key === "Escape")    { onCerrar(); }
  };

  if (!abierto) return null;

  const grupos = ["Sección", "Producto", "Cliente"];

  return (
    <>
      <style>{`
        @keyframes buscador-in { from{opacity:0;transform:scale(0.97) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .buscador-item:hover, .buscador-item.activo { background: #f1f5f9; }
        .buscador-item { display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;border-radius:10px;transition:background 0.1s; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onCerrar} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",backdropFilter:"blur(4px)",zIndex:9998 }} />

      {/* Modal */}
      <div style={{
        position:"fixed", top:"15%", left:"50%", transform:"translateX(-50%)",
        width:"min(640px,92vw)", background:"#fff", borderRadius:18,
        boxShadow:"0 24px 80px rgba(0,0,0,0.22)", zIndex:9999,
        overflow:"hidden", animation:"buscador-in 0.18s ease both",
      }}>

        {/* Input */}
        <div style={{ display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderBottom:"1px solid #f1f5f9" }}>
          <span style={{ fontSize:20,flexShrink:0 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar secciones, productos, clientes…"
            style={{ flex:1,border:"none",outline:"none",fontSize:16,color:"#0f172a",background:"transparent",fontFamily:"inherit" }}
          />
          {cargando && <div style={{ width:18,height:18,border:"2px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0 }} />}
          <kbd style={{ fontSize:11,color:"#94a3b8",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,padding:"2px 7px",fontFamily:"inherit",flexShrink:0 }}>ESC</kbd>
        </div>

        {/* Resultados */}
        <div ref={listRef} style={{ maxHeight:420,overflowY:"auto",padding:"8px 12px 12px" }}>
          {resultados.length === 0 && query === "" && (
            <p style={{ textAlign:"center",color:"#94a3b8",fontSize:14,padding:"32px 0",margin:0 }}>
              Escribe para buscar secciones, productos o clientes
            </p>
          )}
          {resultados.length === 0 && query !== "" && !cargando && (
            <p style={{ textAlign:"center",color:"#94a3b8",fontSize:14,padding:"32px 0",margin:0 }}>
              Sin resultados para «{query}»
            </p>
          )}

          {grupos.map(grupo => {
            const items = resultados.filter(r => r.grupo === grupo);
            if (!items.length) return null;
            const globalOffset = resultados.findIndex(r => r.grupo === grupo);
            return (
              <div key={grupo} style={{ marginTop:8 }}>
                <p style={{ fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",margin:"8px 4px 6px",padding:"0 4px" }}>{grupo}s</p>
                {items.map((item, localIdx) => {
                  const globalIdx = globalOffset + localIdx;
                  return (
                    <div key={`${item.key}-${item.id||localIdx}`}
                      data-item
                      className={`buscador-item${globalIdx === cursor ? " activo" : ""}`}
                      onClick={() => seleccionar(item)}
                      onMouseEnter={() => setCursor(globalIdx)}
                    >
                      <span style={{ fontSize:18,width:28,textAlign:"center",flexShrink:0 }}>{item.icon}</span>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:14,fontWeight:600,color:"#0f172a",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.label}</p>
                        {item.sub && <p style={{ fontSize:12,color:"#94a3b8",margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.sub}</p>}
                      </div>
                      <span style={{ fontSize:11,color:"#cbd5e1",background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:6,padding:"2px 8px",flexShrink:0 }}>
                        {grupo === "Sección" ? "Ir →" : grupo}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:"10px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:16,alignItems:"center" }}>
          {[["↑↓","Navegar"],["↵","Seleccionar"],["ESC","Cerrar"]].map(([k,l]) => (
            <div key={k} style={{ display:"flex",alignItems:"center",gap:5 }}>
              <kbd style={{ fontSize:11,color:"#64748b",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:5,padding:"1px 6px",fontFamily:"inherit" }}>{k}</kbd>
              <span style={{ fontSize:11,color:"#94a3b8" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
