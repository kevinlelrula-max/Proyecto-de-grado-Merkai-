import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TiendaLayout from "./components/TiendaLayout";
import { useTiendaEmpresa } from "./hooks/useTiendaEmpresa";
import CatalogoGrid from "./components/CatalogoGrid";
import Carrito from "./components/Carrito";
import ModalReseñas from "../../modules/reseñas/components/ModalReseñas";
import Estrellas from "../../modules/reseñas/components/Estrellas";
import { getReseñasProducto } from "../../modules/reseñas/services/reseñasService";

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

export default function TiendaCatalogo() {
  const navigate        = useNavigate();
  const { empresaSlug } = useParams();
  const location        = useLocation();

  const empresa       = location.state?.empresa
    || JSON.parse(localStorage.getItem("ultima_empresa") || "null");
  const empresaId      = empresa?.id;
  const empresaNombre  = empresa?.nombre || "";
  const colorMarca     = empresa?.color_primario || "#0F6E56";
  const estiloTarjeta  = (empresa?.layout || []).find(s => s.tipo === "catalogo")?.config?.estilo_tarjeta || "estandar";

  // 1️⃣ Guardar slug para que TiendaLayout lo tenga aunque esté en /mis-pedidos
useEffect(() => {
  if (empresaSlug) localStorage.setItem("ultima_empresa_slug", empresaSlug);
}, [empresaSlug]);

  const [nivelLealtad, setNivelLealtad] = useState(null);
  const [descuento, setDescuento]       = useState(0);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [ordenFiltro, setOrdenFiltro]         = useState("nombre");

  // Reseñas
  const [productoReseña, setProductoReseña]   = useState(null); // producto para el modal
  const [statsReseñas, setStatsReseñas]       = useState({});   // { [producto_id]: stats }

  const clienteId    = localStorage.getItem("cliente_id");
  const clienteToken = localStorage.getItem("cliente_token");
  const estaLogueado = !!clienteToken;

  useEffect(() => {
    if (!estaLogueado || !clienteId || !empresaId) return;
    fetch(`${API_BASE}/api/productos/lealtad/cliente/${clienteId}/empresa/${empresaId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) { setNivelLealtad(data.nivel_actual); setDescuento(data.descuento || 0); } })
      .catch(() => {});
  }, [estaLogueado, clienteId, empresaId]);

  const {
    productos, loadingProds, busqueda, setBusqueda,
    carrito, carritoAbierto, setCarritoAbierto,
    agregarAlCarrito, cambiarCantidad, quitarDelCarrito,
    vaciarCarrito, totalItems, totalPrecio,
    metodosPago, metodoPagoId, setMetodoPagoId,
    direccion, setDireccion, notas, setNotas,
    loadingPedido, errorPedido, setErrorPedido,
    pedidoExitoso, confirmarPedido, cerrarExito,
  } = useTiendaEmpresa(empresaId, empresaSlug);

  // Cargar stats de reseñas para todos los productos.
  // La dependencia es la lista de ids (texto estable) y no el arreglo "productos": ese arreglo se
  // vuelve a crear en cada render y hacía que este efecto se repitiera sin parar (bucle de peticiones).
  const clavesProductos = productos.map(p => p.id).join(",");
  useEffect(() => {
    if (!clavesProductos) return;
    let activo = true;
    Promise.all(
      clavesProductos.split(",").map(id =>
        getReseñasProducto(id)
          .then(data => ({ id, stats: data.stats }))
          .catch(() => ({ id, stats: null }))
      )
    ).then(resultados => {
      if (!activo) return;
      const map = {};
      resultados.forEach(r => { map[r.id] = r.stats; });
      setStatsReseñas(map);
    });
    return () => { activo = false; };
  }, [clavesProductos]);

  // 2️⃣ Navigate a la ruta correcta con slug
  const handlePagoExitoso = () => {
    vaciarCarrito();
    navigate(`/tienda/${empresaSlug}/pedidos`);
  };

  const productosConPrecio = productos.map((p) => ({
    ...p,
    precio_final:    calcularPrecioInteligente(p, descuento),
    precio_original: parseFloat(p.precio),
    tiene_descuento: calcularPrecioInteligente(p, descuento) < parseFloat(p.precio),
  }));

  // Categorías únicas para los chips de filtro
  const categorias = ["todas", ...new Set(
    productosConPrecio.map((p) => p.categoria).filter(Boolean)
  )];

  // Aplicar filtro de categoría + orden
  const productosFiltradosOrdenados = productosConPrecio
    .filter((p) => categoriaFiltro === "todas" || p.categoria === categoriaFiltro)
    .sort((a, b) => {
      if (ordenFiltro === "precio_asc")  return a.precio_final - b.precio_final;
      if (ordenFiltro === "precio_desc") return b.precio_final - a.precio_final;
      if (ordenFiltro === "stock")       return b.stock - a.stock;
      return a.nombre.localeCompare(b.nombre); // nombre
    });

  return (
    <TiendaLayout
      empresa={empresa}
      carrito={carrito}
      onAbrirCarrito={() => setCarritoAbierto(true)}
    >

      {estaLogueado && nivelLealtad && (
        <div style={{ ...s.lealtadBanner, backgroundColor: `${colorMarca}15`, borderBottom: `1px solid ${colorMarca}30` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <p style={s.lealtadText}>
            Nivel <strong>{nivelLealtad.nombre}</strong> — precios con{" "}
            <strong>{nivelLealtad.descuento_porcentaje}% de descuento</strong>
          </p>
        </div>
      )}

      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Catálogo</h1>
            <p style={s.subtitle}>
              {loadingProds
                ? "Cargando productos..."
                : `${productosFiltradosOrdenados.length} producto${productosFiltradosOrdenados.length !== 1 ? "s" : ""} disponible${productosFiltradosOrdenados.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div style={s.buscador}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/>
            </svg>
            <input
              style={s.buscadorInput}
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button style={s.clearBtn} onClick={() => setBusqueda("")}>✕</button>
            )}
          </div>
        </div>

        {/* Filtros de categoría + orden */}
        {!loadingProds && (categorias.length > 1 || true) && (
          <div style={s.filtrosWrap}>
            <div style={s.chipsWrap}>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  style={{
                    ...s.chip,
                    backgroundColor: categoriaFiltro === cat ? colorMarca : "white",
                    color:           categoriaFiltro === cat ? "white" : "#64748b",
                    borderColor:     categoriaFiltro === cat ? colorMarca : "#e2e8f0",
                  }}
                  onClick={() => setCategoriaFiltro(cat)}
                >
                  {cat === "todas" ? "Todos" : cat}
                </button>
              ))}
            </div>
            <select
              style={s.ordenSelect}
              value={ordenFiltro}
              onChange={(e) => setOrdenFiltro(e.target.value)}
            >
              <option value="nombre">Ordenar: A-Z</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="stock">Más disponibles</option>
            </select>
          </div>
        )}

        <CatalogoGrid
          productos={productosFiltradosOrdenados}
          loading={loadingProds}
          busqueda={busqueda}
          onAgregar={agregarAlCarrito}
          statsReseñas={statsReseñas}
          onVerReseñas={setProductoReseña}
          colorMarca={colorMarca}
          estiloTarjeta={estiloTarjeta}
        />
      </div>

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
        onPagoExitoso={handlePagoExitoso}
      />

      {/* Modal reseñas */}
      {productoReseña && (
        <ModalReseñas
          producto={productoReseña}
          colorMarca={colorMarca}
          onCerrar={() => setProductoReseña(null)}
        />
      )}

      {/* 3️⃣ Modal con navigate correcto */}
      {pedidoExitoso && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 style={s.modalTitle}>¡Pedido enviado!</h2>
            <p style={s.modalDesc}>
              Tu pedido <strong>#{pedidoExitoso.id}</strong> fue recibido.
              Te contactarán pronto.
            </p>
            <p style={s.modalTotal}>
              Total: <strong>${pedidoExitoso.total.toLocaleString("es-CO")}</strong>
            </p>
            <button style={{ ...s.modalBtn, backgroundColor: colorMarca }} onClick={() => {
              cerrarExito();
              navigate(`/tienda/${empresaSlug}/pedidos`);
            }}>
              Ver mis pedidos
            </button>
            <button style={s.modalBtnSecondary}
              onClick={() => { cerrarExito(); navigate(`/tienda/${empresaSlug}/catalogo`, { state: { empresa } }); }}>
              Seguir comprando
            </button>
          </div>
        </div>
      )}

    </TiendaLayout>
  );
}

const s = {
  lealtadBanner: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 24px" },
  lealtadText: { fontSize: "13px", color: "#92400e" },
  page: { maxWidth: "1300px", margin: "0 auto", padding: "40px 24px", flex: 1, width: "100%", boxSizing: "border-box" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "28px", flexWrap: "wrap" },
  title: { fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em", marginBottom: "4px" },
  subtitle: { fontSize: "14px", color: "#64748b" },
  buscador: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "white", border: "1.5px solid #e2e8f0", borderRadius: "12px", minWidth: "260px" },
  buscadorInput: { flex: 1, background: "none", border: "none", outline: "none", fontSize: "14px", color: "#0f172a" },
  clearBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" },
  filtrosWrap: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "8px" },
  chipsWrap:   { display: "flex", flexWrap: "wrap", gap: "8px" },
  chip: {
    padding: "6px 14px", borderRadius: "999px",
    border: "1.5px solid", fontSize: "13px", fontWeight: "500",
    cursor: "pointer", transition: "all 0.15s",
  },
  ordenSelect: {
    padding: "7px 12px", borderRadius: "9px",
    border: "1.5px solid #e2e8f0", fontSize: "13px",
    color: "#374151", backgroundColor: "white", outline: "none",
    cursor: "pointer",
  },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" },
  modal: { backgroundColor: "white", borderRadius: "20px", padding: "40px 36px", maxWidth: "400px", width: "90%", textAlign: "center" },
  modalIcon: { marginBottom: "16px", display: "flex", justifyContent: "center" },
  modalTitle: { fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" },
  modalDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "12px" },
  modalTotal: { fontSize: "18px", color: "#0F6E56", marginBottom: "24px" },
  modalBtn: { width: "100%", padding: "13px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginBottom: "10px" },
  modalBtnSecondary: { width: "100%", padding: "11px", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", cursor: "pointer" },
};