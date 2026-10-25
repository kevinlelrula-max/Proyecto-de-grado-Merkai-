import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getProductosPublicos, crearPedidoOnline, getMetodosPago, getEmpresaPorSlug } from "../../../services/api";

// ─── Hook principal ──────────────────────────────────────────────────────────
export function useTiendaEmpresa(empresaIdProp, empresaSlug) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ empresaId puede venir por prop o buscarse por slug
  const [empresaId, setEmpresaId]           = useState(empresaIdProp || null);
  const [empresaData, setEmpresaData]       = useState(null);
  const [loadingEmpresa, setLoadingEmpresa] = useState(!empresaIdProp);

  // ── Estado de productos
  const [productos, setProductos]       = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [busqueda, setBusqueda]         = useState("");

  // ── Estado carrito
  const [carrito, setCarrito]               = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  // ── Estado pedido
  const [metodosPago, setMetodosPago]     = useState([]);
  const [metodoPagoId, setMetodoPagoId]   = useState(null);
  const [direccion, setDireccion]         = useState(
    localStorage.getItem("cliente_direccion") || ""
  );
  const [notas, setNotas]                 = useState("");
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState(null);
  const [errorPedido, setErrorPedido]     = useState("");

  // ── Auth
  const clienteNombre = localStorage.getItem("cliente_nombre");
  const estaLogueado  = !!localStorage.getItem("cliente_token");

  // ✅ Si no viene empresaId por prop, buscar la empresa por slug
  useEffect(() => {
    if (empresaIdProp) {
      setEmpresaId(empresaIdProp);
      setLoadingEmpresa(false);
      return;
    }
    if (!empresaSlug) return;

    setLoadingEmpresa(true);
    getEmpresaPorSlug(empresaSlug)
      .then((data) => {
        if (data) {
          setEmpresaId(data.id);
          setEmpresaData(data);
          localStorage.setItem("ultima_empresa", JSON.stringify(data));
        }
      })
      .finally(() => setLoadingEmpresa(false));
  }, [empresaIdProp, empresaSlug]);

  // ── Cargar productos — espera a tener el empresaId real
  useEffect(() => {
    if (!empresaId) return;

    setLoadingProds(true);
    getProductosPublicos(empresaId)
      .then(setProductos)
      .finally(() => setLoadingProds(false));
  }, [empresaId]);

  // ── Cargar métodos de pago
  useEffect(() => {
    getMetodosPago().then((data) => {
      setMetodosPago(data);
      if (data.length > 0) setMetodoPagoId(data[0].id);
    });
  }, []);

  // ── Detectar "repetir pedido" desde localStorage y pre-poblar carrito
  useEffect(() => {
    if (!productos.length || !empresaSlug) return;
    const raw = localStorage.getItem("fishware_repetir_pedido");
    if (!raw) return;

    try {
      const { empresa_slug: targetSlug, items } = JSON.parse(raw);
      if (targetSlug !== empresaSlug) return;
      localStorage.removeItem("fishware_repetir_pedido");
      localStorage.removeItem(`fishware_carrito_${empresaSlug}`); // repetir tiene prioridad sobre carrito guardado
      items.forEach(item => {
        const producto = productos.find(p => p.id === item.producto_id);
        if (producto && producto.stock > 0) {
          agregarAlCarrito(producto, Math.min(item.cantidad, producto.stock));
        }
      });
    } catch { /* silencioso */ }
  }, [productos, empresaSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restaurar carrito desde localStorage al cargar productos
  useEffect(() => {
    if (!productos.length || !empresaSlug) return;
    if (localStorage.getItem("fishware_repetir_pedido")) return; // repetir toma prioridad
    const raw = localStorage.getItem(`fishware_carrito_${empresaSlug}`);
    if (!raw) return;

    try {
      const guardado = JSON.parse(raw);
      const carritoValido = guardado
        .map(item => {
          const producto = productos.find(p => p.id === item.id);
          if (!producto || producto.stock <= 0) return null;
          return { ...producto, cantidad: Math.min(item.cantidad, producto.stock) };
        })
        .filter(Boolean);
      if (carritoValido.length > 0) setCarrito(carritoValido);
    } catch { /* silencioso */ }
  }, [productos, empresaSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persistir carrito en localStorage al cambiar
  useEffect(() => {
    if (!empresaSlug) return;
    if (carrito.length === 0) {
      localStorage.removeItem(`fishware_carrito_${empresaSlug}`);
    } else {
      localStorage.setItem(`fishware_carrito_${empresaSlug}`, JSON.stringify(carrito));
    }
  }, [carrito, empresaSlug]);

  // ── Sincronizar carrito con backend (carrito abandonado)
  useEffect(() => {
    if (!empresaId) return;
    const clienteToken    = localStorage.getItem("cliente_token");
    const clienteId       = localStorage.getItem("cliente_id");
    const clienteNombre   = localStorage.getItem("cliente_nombre")   || "";
    const clienteEmail    = localStorage.getItem("cliente_email")    || "";
    const clienteTelefono = localStorage.getItem("cliente_telefono") || "";
    if (!clienteToken || !clienteId) return;

    const total = carrito.reduce((acc, item) => acc + item.cantidad * item.precio, 0);
    const timer = setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/carritos/guardar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${clienteToken}` },
        body: JSON.stringify({
          empresa_id: empresaId, cliente_id: Number(clienteId),
          cliente_nombre: clienteNombre, cliente_email: clienteEmail,
          cliente_telefono: clienteTelefono,
          items: carrito.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
          total,
        }),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [carrito, empresaId]);

  // ── Filtrar productos por búsqueda
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── CARRITO: agregar producto
  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    if (!localStorage.getItem("cliente_token")) {
      navigate("/tienda/login", { state: { from: location.pathname } });
      return;
    }
    if (producto.stock <= 0) return;

    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        const nuevaCantidad = Math.min(existe.cantidad + cantidad, producto.stock);
        return prev.map((item) =>
          item.id === producto.id ? { ...item, cantidad: nuevaCantidad } : item
        );
      }
      return [...prev, { ...producto, cantidad }];
    });

    setCarritoAbierto(true);
  }, [navigate, location.pathname]);

  // ── CARRITO: cambiar cantidad
  const cambiarCantidad = useCallback((productoId, cantidad) => {
    if (cantidad <= 0) {
      quitarDelCarrito(productoId);
      return;
    }
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === productoId
          ? { ...item, cantidad: Math.min(cantidad, item.stock) }
          : item
      )
    );
  }, []);

  // ── CARRITO: quitar producto
  const quitarDelCarrito = useCallback((productoId) => {
    setCarrito((prev) => prev.filter((item) => item.id !== productoId));
  }, []);

  // ── CARRITO: vaciar
  const vaciarCarrito = useCallback(() => setCarrito([]), []);

  // ── CARRITO: totales
  const totalItems  = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrecio = carrito.reduce((acc, item) => acc + item.cantidad * item.precio, 0);

  // ── PEDIDO: confirmar
  const confirmarPedido = useCallback(async (totalFinal = totalPrecio, cuponId = null, departamentoId = null) => {
    const clienteToken = localStorage.getItem("cliente_token");
    const clienteId    = localStorage.getItem("cliente_id");

    if (!clienteToken) {
      navigate("/tienda/login", { state: { from: location.pathname } });
      return;
    }
    if (carrito.length === 0) return;
    if (!direccion.trim()) {
      setErrorPedido("Por favor ingresa una dirección de entrega.");
      return;
    }
    if (!metodoPagoId) {
      setErrorPedido("Por favor selecciona un método de pago.");
      return;
    }

    setLoadingPedido(true);
    setErrorPedido("");

    try {
      const payload = {
        empresa_id:        empresaId,
        metodo_pago_id:    metodoPagoId,
        direccion_entrega: direccion.trim(),
        notas:             notas.trim() || null,
        total:             totalFinal,
        cupon_id:          cuponId || null,
        departamento_id:   departamentoId,
        detalle: carrito.map((item) => ({
          producto_id:     item.id,
          cantidad:        item.cantidad,
        })),
      };

      const res = await crearPedidoOnline(payload, clienteToken);

      if (res.id) {
        localStorage.setItem("cliente_direccion", direccion);
        setPedidoExitoso({ id: res.id, total: res.total ?? totalFinal });
        vaciarCarrito();
        setCarritoAbierto(false);
        // Marcar carrito como convertido
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/carritos/limpiar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${clienteToken}` },
          body: JSON.stringify({ empresa_id: empresaId, cliente_id: Number(clienteId) }),
        }).catch(() => {});
      } else {
        setErrorPedido(res.error || "Error al crear el pedido. Intenta de nuevo.");
      }
    } catch {
      setErrorPedido("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoadingPedido(false);
    }
  }, [
    carrito, direccion, metodoPagoId,
    empresaId, totalPrecio,
    notas, navigate, location.pathname, vaciarCarrito,
  ]);

  const cerrarExito = useCallback(() => {
    setPedidoExitoso(null);
    navigate("/tienda/mis-pedidos");
  }, [navigate]);

  return {
    // Empresa
    empresaId,
    empresaData,
    loadingEmpresa,

    // Productos
    productos: productosFiltrados,
    loadingProds,
    busqueda,
    setBusqueda,

    // Carrito
    carrito,
    carritoAbierto,
    setCarritoAbierto,
    agregarAlCarrito,
    cambiarCantidad,
    quitarDelCarrito,
    vaciarCarrito,
    totalItems,
    totalPrecio,

    // Pedido
    metodosPago,
    metodoPagoId,
    setMetodoPagoId,
    direccion,
    setDireccion,
    notas,
    setNotas,
    loadingPedido,
    errorPedido,
    setErrorPedido,
    pedidoExitoso,
    confirmarPedido,
    cerrarExito,

    // Auth
    estaLogueado,
    clienteNombre,
  };
}