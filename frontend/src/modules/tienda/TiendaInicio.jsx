import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTiendaEmpresa } from "./hooks/useTiendaEmpresa";
import TiendaLayout from "./components/TiendaLayout";
import Carrito from "./components/Carrito";
import HeroSection from "./components/HeroSection";

import { imgUrl } from "../../utils/imgUrl";
import ProductoCardEstilo from "./components/ProductoCardEstilos";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

function calcularPrecioInteligente(producto, descuentoLealtad) {
  const precios = [parseFloat(producto.precio)];
  if (producto.precio_mayoreo && parseFloat(producto.precio_mayoreo) > 0) {
    precios.push(parseFloat(producto.precio_mayoreo));
  }
  if (descuentoLealtad > 0) {
    precios.push(parseFloat(producto.precio) * (1 - descuentoLealtad / 100));
  }
  return Math.min(...precios);
}

export default function TiendaInicio() {
  const navigate        = useNavigate();
  const { empresaSlug } = useParams();

  // 1️⃣ Guardar slug para que TiendaLayout lo tenga aunque esté en /mis-pedidos
  useEffect(() => {
    if (empresaSlug) localStorage.setItem("ultima_empresa_slug", empresaSlug);
  }, [empresaSlug]);

  const {
    empresaData,
    productos,
    carrito, carritoAbierto, setCarritoAbierto,
    agregarAlCarrito, cambiarCantidad, quitarDelCarrito,
    vaciarCarrito, totalItems, totalPrecio,
    metodosPago, metodoPagoId, setMetodoPagoId,
    direccion, setDireccion, notas, setNotas,
    loadingPedido, errorPedido, setErrorPedido,
    pedidoExitoso, confirmarPedido, cerrarExito,
  } = useTiendaEmpresa(null, empresaSlug);

  const empresa       = empresaData || JSON.parse(localStorage.getItem("ultima_empresa") || "null");
  const colorMarca      = empresa?.color_primario   || "#0F6E56";
  const colorSecundario = empresa?.color_secundario || "#0B1628";
  const empresaNombre   = empresa?.nombre           || empresaSlug;
  const empresaId     = empresa?.id;

  const cantidadDestacados = empresa?.productos_destacados_cantidad || 4;
  const nosotrosTitulo = empresa?.nosotros_titulo || `Conoce ${empresaNombre}`;
  const heroVariante   = (empresa?.layout || []).find(s => s.tipo === "hero")?.config?.variante || "oscuro";
  const estiloTarjeta  = (empresa?.layout || []).find(s => s.tipo === "catalogo")?.config?.estilo_tarjeta || "estandar";

  const [descuento,    setDescuento]    = useState(0);
  const [nivelLealtad, setNivelLealtad] = useState(null);
  const [reseñasDestacadas, setReseñasDestacadas] = useState([]);
  const [cuponesActivos, setCuponesActivos] = useState([]);
  const clienteId    = localStorage.getItem("cliente_id");
  const estaLogueado = !!localStorage.getItem("cliente_token");

  useEffect(() => {
    if (!estaLogueado || !clienteId || !empresa?.id) return;
    fetch(`${API_BASE}/api/productos/lealtad/cliente/${clienteId}/empresa/${empresa.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) { setDescuento(data.descuento || 0); setNivelLealtad(data.nivel_actual); } })
      .catch(() => {});
  }, [estaLogueado, clienteId, empresa?.id]);

  useEffect(() => {
    if (!empresa?.id) return;
    fetch(`${API_BASE}/api/resenas/destacadas/${empresa.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(setReseñasDestacadas)
      .catch(() => {});
    fetch(`${API_BASE}/api/cupones/activos/${empresa.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(setCuponesActivos)
      .catch(() => {});
  }, [empresa?.id]);

  const productosConPrecio = productos.map((p) => ({
    ...p,
    precio_final:    calcularPrecioInteligente(p, descuento),
    precio_original: parseFloat(p.precio),
    tiene_descuento: calcularPrecioInteligente(p, descuento) < parseFloat(p.precio),
  }));

  // Ir a "Mis pedidos" solo cuando el cliente lo pide (ya no se redirige solo al comprar)
  const irAPedidos = () => navigate(`/tienda/${empresaSlug}/pedidos`, { state: { empresa } });

  return (
    <TiendaLayout
      empresa={empresa}
      carrito={carrito}
      onAbrirCarrito={() => setCarritoAbierto(true)}
    >

      {/* ── BANNER DE LEALTAD ── */}
      {estaLogueado && nivelLealtad && (
        <div style={{ ...s.lealtadBanner, backgroundColor: `${colorMarca}15`, borderBottom: `1px solid ${colorMarca}30` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <p style={s.lealtadText}>
            Nivel <strong>{nivelLealtad.nombre}</strong> — precios con{" "}
            <strong>{nivelLealtad.descuento_porcentaje}% de descuento</strong>
          </p>
        </div>
      )}

      {/* ── HERO ── */}
      <HeroSection
        variante={heroVariante}
        empresa={empresa}
        empresaNombre={empresaNombre}
        empresaSlug={empresaSlug}
        productosCount={productos.length}
      />

      {/* ── PRODUCTOS DESTACADOS ── */}
      <div style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionHeader}>
            <div>
              <h2 style={s.sectionTitle}>Productos destacados</h2>
              <p style={s.sectionSubtitle}>Los más populares de nuestra tienda</p>
            </div>
            <button
              style={{ ...s.verTodos, color: colorMarca, borderColor: colorMarca }}
              onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}
            >
              Ver todos →
            </button>
          </div>
          <div style={{ ...s.productosGrid, gridTemplateColumns: estiloTarjeta === "horizontal" ? "1fr" : estiloTarjeta === "boutique" ? "repeat(auto-fill, minmax(200px, 1fr))" : estiloTarjeta === "minimalista" ? "repeat(auto-fill, minmax(160px, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {productosConPrecio.slice(0, cantidadDestacados).map((producto) => (
              <ProductoCardEstilo
                key={producto.id}
                estilo={estiloTarjeta}
                producto={producto}
                onAgregar={agregarAlCarrito}
                colorMarca={colorMarca}
              />
            ))}
          </div>
          {productos.length > cantidadDestacados && (
            <div style={s.verMasWrap}>
              <button
                style={{ ...s.verMasBtn, backgroundColor: colorMarca }}
                onClick={() => navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } })}
              >
                Ver todos los productos ({productos.length}) →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SOBRE NOSOTROS ── */}
      {(empresa?.descripcion || empresa?.nosotros_contenido) && (
        <div style={s.sobreNosotros}>
          <div style={s.sectionInner}>
            <div style={s.sobreGrid}>
              <div style={s.sobreLeft}>
                <span style={{ ...s.sobreTag, color: colorMarca }}>Sobre nosotros</span>
                <h2 style={s.sobreTitle}>{nosotrosTitulo}</h2>
                <p style={s.sobreDesc}>{empresa?.nosotros_contenido || empresa?.descripcion}</p>
                {empresa?.horario && (
                  <div style={s.sobreHorario}>
                    <span style={s.sobreHorarioIcon}>Hor</span>
                    <div>
                      <p style={s.sobreHorarioLabel}>Horario de atención</p>
                      <p style={s.sobreHorarioValor}>{empresa.horario}</p>
                    </div>
                  </div>
                )}
                <button
                  style={{ ...s.sobreBtn, borderColor: colorMarca, color: colorMarca }}
                  onClick={() => navigate(`/tienda/${empresaSlug}/contacto`, { state: { empresa } })}
                >
                  Contáctanos →
                </button>
              </div>
              <div style={s.sobreRight}>
                <div style={{ ...s.sobreAvatar, backgroundColor: colorMarca }}>
                  {empresaNombre?.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECCIONES CUSTOM DEL LAYOUT ── */}
      {(empresa?.layout || []).filter(sec => sec.visible).map(sec => {
        if (sec.tipo === "faq" && sec.config?.preguntas?.length > 0) {
          return (
            <div key={sec.id} style={s.section}>
              <div style={s.sectionInner}>
                <h2 style={s.sectionTitle}>Preguntas frecuentes</h2>
                <p style={s.sectionSubtitle}>Resolvemos tus dudas</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
                  {sec.config.preguntas.filter(p => p.pregunta).map((p, i) => (
                    <details key={i} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                      <summary style={{ padding: "16px 20px", fontSize: "15px", fontWeight: "600", color: "#0f172a", cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {p.pregunta}
                        <span style={{ color: colorMarca, fontSize: "18px", flexShrink: 0, marginLeft: "12px" }}>+</span>
                      </summary>
                      <div style={{ padding: "0 20px 16px", fontSize: "14px", color: "#64748b", lineHeight: "1.7" }}>
                        {p.respuesta}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        if (sec.tipo === "galeria" && sec.config?.imagenes?.length > 0) {
          const imgs = sec.config.imagenes.filter(img => img.url);
          if (imgs.length === 0) return null;
          return (
            <div key={sec.id} style={s.section}>
              <div style={s.sectionInner}>
                <h2 style={s.sectionTitle}>Galería</h2>
                <p style={s.sectionSubtitle}>Conoce nuestro negocio</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginTop: "20px" }}>
                  {imgs.map((img, i) => (
                    <div key={i} style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", backgroundColor: "white" }}>
                      <img src={img.url} alt={img.titulo || ""} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                      {img.titulo && (
                        <p style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{img.titulo}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        if (sec.tipo === "testimonios" && reseñasDestacadas.length > 0) {
          return (
            <div key={sec.id} style={{ backgroundColor: "white", padding: "56px 24px" }}>
              <div style={s.sectionInner}>
                <h2 style={s.sectionTitle}>Lo que dicen nuestros clientes</h2>
                <p style={s.sectionSubtitle}>Opiniones reales de quienes ya compraron</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "24px" }}>
                  {reseñasDestacadas.map((r) => (
                    <div key={r.id} style={{ padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                        {[1,2,3,4,5].map(i => (
                          <span key={i} style={{ fontSize: "16px", color: i <= r.calificacion ? "#fbbf24" : "#e2e8f0" }}>★</span>
                        ))}
                      </div>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", marginBottom: "12px" }}>"{r.comentario}"</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{r.cliente_nombre}</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{r.producto_nombre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        if (sec.tipo === "promociones" && cuponesActivos.length > 0) {
          return (
            <div key={sec.id} style={{ background: `linear-gradient(135deg, ${colorMarca}10, ${colorSecundario}10)`, padding: "56px 24px" }}>
              <div style={s.sectionInner}>
                <h2 style={s.sectionTitle}>Promociones activas</h2>
                <p style={s.sectionSubtitle}>Usa estos códigos en tu próxima compra</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px", marginTop: "24px" }}>
                  {cuponesActivos.map((c, i) => (
                    <div key={i} style={{ padding: "20px", borderRadius: "14px", backgroundColor: "white", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{ fontSize: "18px", fontWeight: "800", color: colorMarca, fontFamily: "monospace", letterSpacing: "0.05em" }}>{c.codigo}</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "white", backgroundColor: colorMarca, padding: "3px 10px", borderRadius: "999px" }}>
                          {c.tipo === "porcentaje" ? `${c.valor}%` : c.tipo === "envio_gratis" ? "Envío gratis" : `$${Number(c.valor).toLocaleString("es-CO")}`}
                        </span>
                      </div>
                      {c.descripcion && <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "8px" }}>{c.descripcion}</p>}
                      <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#94a3b8" }}>
                        {c.minimo_compra > 0 && <span>Min: ${Number(c.minimo_compra).toLocaleString("es-CO")}</span>}
                        {c.fecha_fin && <span>Hasta: {new Date(c.fecha_fin).toLocaleDateString("es-CO")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* ── CARRITO ── */}
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
        estaLogueado={estaLogueado}
        empresaId={empresaId}
        empresaNombre={empresaNombre}
        onPagoExitoso={vaciarCarrito}
        onVerPedidos={irAPedidos}
        colorMarca={colorMarca}
        colorSecundario={colorSecundario}
      />

      {/* 3️⃣ Modal con navigate correcto */}
      {pedidoExitoso && (
        <PedidoConfirmado
          pedido={pedidoExitoso}
          empresaNombre={empresaNombre}
          colorMarca={colorMarca}
          colorSecundario={colorSecundario}
          onSeguirComprando={cerrarExito}
          onVerPedidos={() => { cerrarExito(); irAPedidos(); }}
        />
      )}

    </TiendaLayout>
  );
}

const s = {
  lealtadBanner: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 24px" },
  lealtadText: { fontSize: "13px", color: "#92400e" },
  section: { backgroundColor: "#f8fafc", padding: "56px 24px" },
  sobreNosotros: { backgroundColor: "white", padding: "56px 24px" },
  sectionInner: { maxWidth: "1300px", margin: "0 auto" },
  sectionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
  sectionTitle: { fontSize: "26px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "4px" },
  sectionSubtitle: { fontSize: "14px", color: "#64748b" },
  verTodos: { padding: "9px 18px", background: "transparent", border: "1.5px solid", borderRadius: "9px", fontSize: "13px", fontWeight: "600", cursor: "pointer", flexShrink: 0 },
  productosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" },
  productoCard: { backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" },
  productoImgWrap: { height: "180px", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  productoEmoji: { fontSize: "56px" },
  sinStockBadge: { position: "absolute", top: "10px", left: "10px", backgroundColor: "#ef4444", color: "white", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "999px" },
  descuentoBadge: { position: "absolute", top: "10px", right: "10px", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "999px" },
  productoInfo: { padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  productoNombre: { fontSize: "15px", fontWeight: "700", color: "#0f172a" },
  productoDesc: { fontSize: "12px", color: "#94a3b8", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  productoPrecioRow: { display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" },
  precioTachado: { fontSize: "12px", color: "#94a3b8", textDecoration: "line-through" },
  productoPrecio: { fontSize: "20px", fontWeight: "800" },
  productoUnidad: { fontSize: "12px", color: "#94a3b8" },
  productoBtn: { width: "100%", padding: "10px", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", marginTop: "auto" },
  verMasWrap: { textAlign: "center", marginTop: "32px" },
  verMasBtn: { padding: "14px 36px", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  sobreGrid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "48px", alignItems: "center" },
  sobreLeft: { display: "flex", flexDirection: "column", gap: "16px" },
  sobreTag: { fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" },
  sobreTitle: { fontSize: "32px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 },
  sobreDesc: { fontSize: "15px", color: "#64748b", lineHeight: "1.8", maxWidth: "500px" },
  sobreHorario: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" },
  sobreHorarioIcon: { fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "0.02em" },
  sobreHorarioLabel: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  sobreHorarioValor: { fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "2px" },
  sobreBtn: { alignSelf: "flex-start", padding: "11px 22px", background: "transparent", border: "1.5px solid", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  sobreRight: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  sobreAvatar: { width: "120px", height: "120px", borderRadius: "28px", color: "white", fontSize: "40px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
  modal: { backgroundColor: "white", borderRadius: "20px", padding: "40px 36px", maxWidth: "400px", width: "90%", textAlign: "center" },
  modalIcon: { marginBottom: "16px", display: "flex", justifyContent: "center" },
  modalTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" },
  modalDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "12px" },
  modalTotal: { fontSize: "18px", color: "#0F6E56", marginBottom: "24px" },
  modalBtn: { width: "100%", padding: "13px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" },
  modalBtnSecondary: { width: "100%", padding: "11px", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", cursor: "pointer" },
};