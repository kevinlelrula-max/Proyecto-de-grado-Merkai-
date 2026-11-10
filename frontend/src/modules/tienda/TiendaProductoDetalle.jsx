import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import TiendaLayout from "./components/TiendaLayout";
import Carrito from "./components/Carrito";
import PedidoConfirmado from "./components/PedidoConfirmado";
import { useTiendaEmpresa } from "./hooks/useTiendaEmpresa";
import Estrellas from "../reseñas/components/Estrellas";
import { getReseñasProducto } from "../reseñas/services/reseñasService";

import { imgUrl } from "../../utils/imgUrl";


const css = `
  @keyframes fadeIn { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
  .det-hero { display:grid; grid-template-columns:1fr 1fr; min-height:85vh; }
  .det-img-col { position:sticky; top:64px; align-self:start; }
  .det-rel-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; }
  .det-rel-card { background:#fff; border-radius:16px; border:1px solid #e8edf2; overflow:hidden; cursor:pointer; transition:transform 0.2s,box-shadow 0.2s; }
  .det-rel-card:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,0.12)!important; }
  .thumb-btn { transition:border-color 0.15s,transform 0.15s; }
  .thumb-btn:hover { transform:scale(1.06); }
  .det-add-btn { transition:background 0.2s,transform 0.1s,box-shadow 0.2s; }
  .det-add-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
  @media(max-width:900px){
    .det-hero{grid-template-columns:1fr!important;min-height:auto!important}
    .det-img-col{position:static!important;top:auto!important}
    .det-rel-grid{grid-template-columns:repeat(2,1fr)!important}
    .mobile-sticky{display:flex!important}
    .det-info-pad{padding:32px 20px 100px!important}
  }
`;

export default function TiendaProductoDetalle() {
  const { empresaSlug, productoId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const empresaState = location.state?.empresa
    || JSON.parse(localStorage.getItem("ultima_empresa") || "null");
  const empresaId = empresaState?.id;

  const [imgIdx,        setImgIdx]        = useState(0);
  const [cantidad,      setCantidad]      = useState(1);
  const [añadido,       setAñadido]       = useState(false);
  const [reseñas,       setReseñas]       = useState([]);
  const [statsReseña,   setStatsReseña]   = useState(null);
  const [todasReseñas,  setTodasReseñas]  = useState(false);
  const [descExpandida, setDescExpandida] = useState(false);

  const {
    empresaData, productos, loadingProds,
    carrito, carritoAbierto, setCarritoAbierto,
    agregarAlCarrito, cambiarCantidad, quitarDelCarrito,
    vaciarCarrito, totalItems, totalPrecio,
    metodosPago, metodoPagoId, setMetodoPagoId,
    direccion, setDireccion, notas, setNotas,
    loadingPedido, errorPedido, setErrorPedido,
    pedidoExitoso, confirmarPedido, cerrarExito,
  } = useTiendaEmpresa(empresaId, empresaSlug);

  const empresa    = empresaState || empresaData;
  const colorMarca = empresa?.color_primario || "#0F6E56";
  const irAPedidos = () => navigate(`/tienda/${empresaSlug}/pedidos`, { state: { empresa } });

  const producto     = productos.find(p => String(p.id) === String(productoId));
  const relacionados = productos
    .filter(p => p.categoria === producto?.categoria && String(p.id) !== String(productoId))
    .slice(0, 8);

  useEffect(() => {
    if (!productoId) return;
    getReseñasProducto(productoId)
      .then(d => { setReseñas(d.reseñas || []); setStatsReseña(d.stats); })
      .catch(() => {});
  }, [productoId]);

  useEffect(() => { setImgIdx(0); setCantidad(1); setAñadido(false); }, [productoId]);

  if (loadingProds) return (
    <TiendaLayout empresa={empresa} carrito={carrito} onAbrirCarrito={() => setCarritoAbierto(true)}>
      <div style={{ padding: "120px 24px", textAlign: "center", color: "#94a3b8", fontSize: 16 }}>Cargando producto…</div>
    </TiendaLayout>
  );

  if (!producto) return (
    <TiendaLayout empresa={empresa} carrito={carrito} onAbrirCarrito={() => setCarritoAbierto(true)}>
      <div style={{ padding: "100px 24px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#e2e8f0", margin: "0 auto 16px" }} />
        <p style={{ fontSize: 18, color: "#64748b", marginBottom: 24 }}>Producto no encontrado</p>
        <button onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}
          style={{ padding: "12px 28px", background: colorMarca, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>
          ← Volver al catálogo
        </button>
      </div>
    </TiendaLayout>
  );

  const imagenes  = producto.imagenes?.length > 0
    ? producto.imagenes
    : (producto.imagen_url ? [{ url: producto.imagen_url }] : []);
  const sinStock  = (producto.stock ?? 0) <= 0;
  const unidad    = producto.unidad || "unidad";
  const esGranel  = ["kg", "gramo", "litro", "ml", "metro"].includes(unidad);
  const precioM   = producto.precio_final ?? parseFloat(producto.precio ?? 0);
  const precioO   = parseFloat(producto.precio ?? 0);
  const tieneDesc = producto.tiene_descuento && precioM < precioO;
  const pctDesc   = tieneDesc ? Math.round((1 - precioM / precioO) * 100) : 0;

  const handleCant = delta => {
    const paso = esGranel ? 0.5 : 1;
    setCantidad(p => Math.max(paso, Math.min(p + delta, producto.stock ?? 1)));
  };

  const handleAgregar = () => {
    if (!producto || sinStock) return;
    agregarAlCarrito({ ...producto, precio: precioM }, cantidad);
    setAñadido(true);
    setTimeout(() => setAñadido(false), 2200);
  };

  const irAProducto = prod => {
    navigate(`/tienda/${empresaSlug}/producto/${prod.id}`, { state: { empresa, producto: prod } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const promedioReseña = statsReseña ? parseFloat(statsReseña.promedio) : 0;
  const totalReseñas   = statsReseña ? Number(statsReseña.total) : 0;

  return (
    <TiendaLayout empresa={empresa} carrito={carrito} onAbrirCarrito={() => setCarritoAbierto(true)}>
      <style>{css}</style>

      {/* ─── BREADCRUMB ─── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8", flexWrap: "wrap" }}>
          <button onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0, fontSize: 13, fontWeight: 600 }}>
            Catálogo
          </button>
          {producto.categoria && (
            <><span>›</span><span>{producto.categoria}</span></>
          )}
          <span>›</span>
          <span style={{ color: "#0f172a", fontWeight: 700 }}>{producto.nombre}</span>
        </div>
      </div>

      {/* ─── HERO: IMAGEN + INFO ─── */}
      <div style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }} className="det-hero">

          {/* ── COLUMNA IMAGEN ── */}
          <div className="det-img-col" style={{ background: "#f8fafc", borderRight: "1px solid #f1f5f9" }}>
            <div style={{ padding: "40px", animation: "fadeIn 0.4s ease both" }}>

              {/* Imagen principal */}
              <div style={{
                width: "100%", aspectRatio: "1 / 1",
                background: imagenes.length > 0 ? "#fff" : "linear-gradient(145deg,#f1f5f9,#e8edf2)",
                borderRadius: 20, border: "1px solid #e8edf2",
                overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}>
                {imagenes.length > 0
                  ? <img src={imgUrl(imagenes[imgIdx].url)} alt={producto.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 24 }} />
                  : <div style={{ textAlign: "center" }}>
                      <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: "#e2e8f0", margin: "0 auto" }} />
                      <p style={{ fontSize: 13, color: "#cbd5e1", marginTop: 12 }}>Sin imagen</p>
                    </div>
                }

                {imagenes.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + imagenes.length) % imagenes.length)}
                      style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:"50%",background:"rgba(15,23,42,0.5)",color:"#fff",border:"none",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
                    <button onClick={() => setImgIdx(i => (i + 1) % imagenes.length)}
                      style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",width:38,height:38,borderRadius:"50%",background:"rgba(15,23,42,0.5)",color:"#fff",border:"none",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
                  </>
                )}

                {sinStock && (
                  <div style={{ position:"absolute",top:14,left:14,background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,padding:"5px 14px",borderRadius:999,letterSpacing:"0.05em" }}>AGOTADO</div>
                )}
                {tieneDesc && !sinStock && (
                  <div style={{ position:"absolute",top:14,right:14,background:colorMarca,color:"#fff",fontSize:13,fontWeight:800,padding:"5px 14px",borderRadius:999 }}>{pctDesc}% OFF</div>
                )}
              </div>

              {/* Thumbnails */}
              {imagenes.length > 1 && (
                <div style={{ display:"flex",gap:10,marginTop:16,flexWrap:"wrap" }}>
                  {imagenes.map((img, i) => (
                    <button key={i} className="thumb-btn" onClick={() => setImgIdx(i)}
                      style={{ width:64,height:64,padding:0,border:`2.5px solid ${i===imgIdx?colorMarca:"#e2e8f0"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",background:"#fff" }}>
                      <img src={imgUrl(img.url)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── COLUMNA INFO ── */}
          <div className="det-info-pad" style={{ padding:"56px 56px 80px",display:"flex",flexDirection:"column",gap:28,animation:"fadeIn 0.4s ease 0.1s both" }}>

            {/* Categoría badge */}
            {producto.categoria && (
              <span style={{ fontSize:12,fontWeight:800,color:colorMarca,textTransform:"uppercase",letterSpacing:"0.1em",padding:"4px 14px",background:`${colorMarca}12`,borderRadius:999,alignSelf:"flex-start" }}>
                {producto.categoria}
              </span>
            )}

            {/* Nombre */}
            <h1 style={{ fontSize:34,fontWeight:900,color:"#0f172a",lineHeight:1.15,margin:0,letterSpacing:"-0.03em" }}>
              {producto.nombre}
            </h1>

            {/* Estrellas */}
            {totalReseñas > 0 && (
              <div style={{ display:"flex",alignItems:"center",gap:10,paddingBottom:20,borderBottom:"1px solid #f1f5f9" }}>
                <Estrellas valor={Math.round(promedioReseña)} tamaño="sm" color={colorMarca} />
                <span style={{ fontSize:14,fontWeight:700,color:"#475569" }}>{promedioReseña.toFixed(1)}</span>
                <span style={{ fontSize:14,color:"#94a3b8" }}>({totalReseñas} {totalReseñas===1?"reseña":"reseñas"})</span>
              </div>
            )}

            {/* Precio */}
            <div>
              {tieneDesc && (
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                  <span style={{ fontSize:16,color:"#94a3b8",textDecoration:"line-through" }}>
                    ${precioO.toLocaleString("es-CO")}
                  </span>
                  <span style={{ fontSize:13,fontWeight:800,color:"#dc2626",background:"#fef2f2",padding:"3px 10px",borderRadius:999 }}>
                    −{pctDesc}%
                  </span>
                </div>
              )}
              <div style={{ display:"flex",alignItems:"baseline",gap:10 }}>
                <span style={{ fontSize:48,fontWeight:900,color:"#0f172a",letterSpacing:"-0.04em",lineHeight:1 }}>
                  ${precioM.toLocaleString("es-CO")}
                </span>
                <span style={{ fontSize:16,color:"#94a3b8",fontWeight:500 }}>/ {unidad}</span>
              </div>
              {tieneDesc && (
                <p style={{ fontSize:13,color:colorMarca,fontWeight:700,margin:"8px 0 0" }}>
                  Ahorras ${(precioO - precioM).toLocaleString("es-CO")} en este producto
                </p>
              )}
            </div>

            {/* Descripción */}
            {producto.descripcion && (() => {
              const larga = producto.descripcion.length > 180;
              const texto = larga && !descExpandida
                ? producto.descripcion.slice(0, 180) + "…"
                : producto.descripcion;
              return (
                <div style={{ background:"#f8fafc",borderRadius:14,padding:"20px 22px",border:"1px solid #f1f5f9" }}>
                  <p style={{ fontSize:11,fontWeight:800,color:colorMarca,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 10px" }}>Descripción</p>
                  <p style={{ fontSize:15,color:"#334155",lineHeight:1.8,margin:0 }}>{texto}</p>
                  {larga && (
                    <button onClick={() => setDescExpandida(v => !v)}
                      style={{ marginTop:10,background:"none",border:"none",color:colorMarca,fontSize:13,fontWeight:700,cursor:"pointer",padding:0 }}>
                      {descExpandida ? "Ver menos ↑" : "Ver más ↓"}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Stock indicator */}
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:10,height:10,borderRadius:"50%",flexShrink:0,
                background:sinStock?"#ef4444":producto.stock<=5?"#f59e0b":"#22c55e",
                boxShadow:`0 0 0 3px ${sinStock?"#fecaca":producto.stock<=5?"#fef3c7":"#dcfce7"}` }} />
              <span style={{ fontSize:14,fontWeight:600,color:sinStock?"#dc2626":producto.stock<=5?"#92400e":"#15803d" }}>
                {sinStock
                  ? "Producto agotado"
                  : producto.stock<=5
                    ? `Solo ${Number(producto.stock).toFixed(esGranel?1:0)} ${unidad} disponibles`
                    : `En stock · ${Number(producto.stock).toFixed(esGranel?1:0)} ${unidad}`
                }
              </span>
            </div>

            {/* Selector cantidad */}
            {!sinStock && (
              <div>
                <p style={{ fontSize:13,fontWeight:700,color:"#475569",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:"0.06em" }}>Cantidad</p>
                <div style={{ display:"flex",alignItems:"center",gap:0,border:"2px solid #e2e8f0",borderRadius:14,width:"fit-content",overflow:"hidden" }}>
                  <button onClick={() => handleCant(esGranel ? -0.5 : -1)}
                    style={{ width:50,height:50,border:"none",background:"#f8fafc",fontSize:20,fontWeight:700,cursor:"pointer",color:"#475569" }}>−</button>
                  <span style={{ minWidth:96,textAlign:"center",fontSize:16,fontWeight:800,color:"#0f172a",borderLeft:"2px solid #e2e8f0",borderRight:"2px solid #e2e8f0",lineHeight:"50px",padding:"0 8px" }}>
                    {esGranel ? cantidad.toFixed(1) : cantidad} {unidad}
                  </span>
                  <button onClick={() => handleCant(esGranel ? 0.5 : 1)}
                    style={{ width:50,height:50,border:"none",background:"#f8fafc",fontSize:20,fontWeight:700,cursor:"pointer",color:"#475569" }}>+</button>
                </div>
              </div>
            )}

            {/* Subtotal + botón agregar */}
            {!sinStock ? (
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",background:"#f8fafc",borderRadius:12,border:"1px solid #f1f5f9" }}>
                  <span style={{ fontSize:14,color:"#64748b",fontWeight:500 }}>Total del pedido</span>
                  <span style={{ fontSize:22,fontWeight:900,color:"#0f172a" }}>${(cantidad * precioM).toLocaleString("es-CO")}</span>
                </div>

                <button className="det-add-btn" onClick={handleAgregar} style={{
                  width:"100%", padding:"18px 0",
                  fontSize:17, fontWeight:800,
                  color:"#fff", border:"none", borderRadius:16, cursor:"pointer",
                  background: añadido ? "#059669" : colorMarca,
                  boxShadow: añadido ? "none" : `0 8px 24px ${colorMarca}55`,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                }}>
                  {!añadido && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                  )}
                  {añadido ? "¡Agregado!" : "Agregar al carrito"}
                </button>
              </div>
            ) : (
              <div style={{ padding:"18px",background:"#fef2f2",borderRadius:14,border:"1px solid #fecaca",textAlign:"center" }}>
                <p style={{ fontSize:15,fontWeight:700,color:"#dc2626",margin:0 }}>Producto no disponible</p>
                <p style={{ fontSize:13,color:"#ef4444",margin:"6px 0 0" }}>Consulta otros productos del catálogo</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ─── SECCIONES INFERIORES ─── */}
      <div style={{ background:"#f8fafc",borderTop:"1px solid #f1f5f9" }}>
        <div style={{ maxWidth:1280,margin:"0 auto",padding:"60px 32px 80px",display:"flex",flexDirection:"column",gap:64 }}>

          {/* RELACIONADOS */}
          {relacionados.length > 0 && (
            <section>
              <h2 style={{ fontSize:24,fontWeight:900,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-0.025em" }}>
                También te puede interesar
              </h2>
              <p style={{ fontSize:14,color:"#94a3b8",margin:"0 0 28px" }}>Más de {producto.categoria || "este comercio"}</p>
              <div className="det-rel-grid">
                {relacionados.map(rel => {
                  const ri = rel.imagenes?.length > 0 ? rel.imagenes : (rel.imagen_url?[{url:rel.imagen_url}]:[]);
                  const rp = rel.precio_final ?? parseFloat(rel.precio ?? 0);
                  return (
                    <div key={rel.id} className="det-rel-card" onClick={() => irAProducto(rel)}>
                      <div style={{ width:"100%",aspectRatio:"1/1",background:"linear-gradient(145deg,#f8fafc,#f1f5f9)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden" }}>
                        {ri.length > 0
                          ? <img src={imgUrl(ri[0].url)} alt={rel.nombre} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                          : <div style={{ width:52, height:52, borderRadius:12, backgroundColor:"#e2e8f0" }} />
                        }
                        {(rel.stock??0)<=0 && (
                          <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,0.75)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                            <span style={{ fontSize:11,fontWeight:800,color:"#dc2626",background:"#fef2f2",padding:"4px 12px",borderRadius:999 }}>Agotado</span>
                          </div>
                        )}
                        {rel.stock>0&&rel.stock<=3&&(
                          <div style={{ position:"absolute",bottom:8,left:8,fontSize:10,fontWeight:800,color:"#92400e",background:"#fef3c7",padding:"3px 10px",borderRadius:999 }}>¡Último!</div>
                        )}
                      </div>
                      <div style={{ padding:"14px 16px 18px" }}>
                        <p style={{ fontSize:14,fontWeight:700,color:"#0f172a",lineHeight:1.4,margin:"0 0 8px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>{rel.nombre}</p>
                        <p style={{ fontSize:18,fontWeight:900,color:colorMarca,margin:0 }}>${rp.toLocaleString("es-CO")}</p>
                        <p style={{ fontSize:11,color:"#94a3b8",margin:"3px 0 0" }}>/ {rel.unidad||"unidad"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* RESEÑAS */}
          {(reseñas.length > 0 || totalReseñas > 0) && (
            <section>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16 }}>
                <div>
                  <h2 style={{ fontSize:24,fontWeight:900,color:"#0f172a",margin:"0 0 6px",letterSpacing:"-0.025em" }}>Opiniones de clientes</h2>
                  <p style={{ fontSize:14,color:"#94a3b8",margin:0 }}>Lo que dicen quienes ya compraron</p>
                </div>
                {totalReseñas > 0 && (
                  <div style={{ display:"flex",alignItems:"center",gap:14,background:"#fff",borderRadius:16,border:"1px solid #e8edf2",padding:"16px 22px",boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize:44,fontWeight:900,color:"#0f172a",letterSpacing:"-0.04em",lineHeight:1 }}>{promedioReseña.toFixed(1)}</span>
                    <div>
                      <Estrellas valor={Math.round(promedioReseña)} tamaño="sm" color={colorMarca} />
                      <p style={{ fontSize:12,color:"#94a3b8",margin:"6px 0 0" }}>Basado en {totalReseñas} {totalReseñas===1?"reseña":"reseñas"}</p>
                    </div>
                  </div>
                )}
              </div>

              {reseñas.length === 0
                ? <p style={{ color:"#94a3b8",fontSize:14 }}>Sin reseñas aún.</p>
                : (
                  <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                    {(todasReseñas?reseñas:reseñas.slice(0,4)).map((r,i)=>(
                      <div key={i} style={{ background:"#fff",borderRadius:16,border:"1px solid #e8edf2",padding:"22px 26px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                            <div style={{ width:44,height:44,borderRadius:"50%",background:`${colorMarca}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:colorMarca,flexShrink:0 }}>
                              {(r.cliente_nombre||"?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontSize:15,fontWeight:800,color:"#0f172a",margin:"0 0 4px" }}>{r.cliente_nombre||"Cliente"}</p>
                              <Estrellas valor={r.calificacion} tamaño="sm" color={colorMarca} />
                            </div>
                          </div>
                          <span style={{ fontSize:12,color:"#94a3b8" }}>
                            {new Date(r.fecha).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"})}
                          </span>
                        </div>
                        {r.comentario && <p style={{ fontSize:14,color:"#334155",lineHeight:1.75,margin:0 }}>{r.comentario}</p>}
                      </div>
                    ))}
                    {reseñas.length > 4 && (
                      <button onClick={()=>setTodasReseñas(v=>!v)}
                        style={{ alignSelf:"center",padding:"12px 36px",background:"none",border:`2px solid ${colorMarca}`,color:colorMarca,borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer" }}>
                        {todasReseñas?"Ver menos":`Ver todas las ${reseñas.length} reseñas`}
                      </button>
                    )}
                  </div>
                )
              }
            </section>
          )}
        </div>
      </div>

      {/* ─── BARRA MOBILE STICKY ─── */}
      {!sinStock && (
        <div className="mobile-sticky" style={{ display:"none",position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:colorMarca,padding:"14px 20px",gap:14,alignItems:"center",boxShadow:"0 -6px 24px rgba(0,0,0,0.25)" }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:11,color:"rgba(255,255,255,0.65)",margin:0 }}>Total</p>
            <p style={{ fontSize:20,fontWeight:900,color:"#fff",margin:0 }}>${(cantidad*precioM).toLocaleString("es-CO")}</p>
          </div>
          <button onClick={handleAgregar} style={{ padding:"14px 28px",fontSize:15,fontWeight:800,color:colorMarca,background:"#fff",border:"none",borderRadius:12,cursor:"pointer",whiteSpace:"nowrap" }}>
            {añadido ? "Añadido" : "Agregar"}
          </button>
        </div>
      )}

      <Carrito
        carrito={carrito}
        carritoAbierto={carritoAbierto}
        setCarritoAbierto={setCarritoAbierto}
        cambiarCantidad={cambiarCantidad}
        quitarDelCarrito={quitarDelCarrito}
        vaciarCarrito={vaciarCarrito}
        totalItems={totalItems}
        totalPrecio={totalPrecio}
        metodosPago={metodosPago}
        metodoPagoId={metodoPagoId}
        setMetodoPagoId={setMetodoPagoId}
        direccion={direccion}
        setDireccion={setDireccion}
        notas={notas}
        setNotas={setNotas}
        loadingPedido={loadingPedido}
        errorPedido={errorPedido}
        setErrorPedido={setErrorPedido}
        confirmarPedido={confirmarPedido}
        estaLogueado={!!localStorage.getItem("cliente_token")}
        empresaId={empresaId}
        empresaNombre={empresa?.nombre}
        onPagoExitoso={vaciarCarrito}
        onVerPedidos={irAPedidos}
        colorMarca={colorMarca}
        colorSecundario={empresa?.color_secundario || "#0B1628"}
      />

      {pedidoExitoso && (
        <PedidoConfirmado
          pedido={pedidoExitoso}
          empresaNombre={empresa?.nombre}
          colorMarca={colorMarca}
          colorSecundario={empresa?.color_secundario || "#0B1628"}
          onSeguirComprando={cerrarExito}
          onVerPedidos={() => { cerrarExito(); irAPedidos(); }}
        />
      )}
    </TiendaLayout>
  );
}
