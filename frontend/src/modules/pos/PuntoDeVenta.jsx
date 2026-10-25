import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getProductos } from "../productos/services/productos.api";
import { crearVenta } from "./services/pos.api";
import { crearCliente } from "../clientes/services/clientes.api";
import { getDepartamentos, getMunicipios } from "../ubicacion/services/ubicacion.api";
import { decodeToken } from "../../utils/auth";

import { useCarrito } from "./hooks/useCarrito";
import { useClientes } from "./hooks/useClientes";

import ProductGrid from "./components/ProductGrid";
import Carrito from "./components/Carrito";
import ClienteSearch from "./components/ClienteSearch";
import MetodoPago from "./components/MetodoPago";
import ModalCliente from "./components/ModalCliente";
import Historial from "./components/Historial";
import Caja from "./components/Caja";

import "./styles/pos.css";

export default function PuntoDeVenta() {
  const token = localStorage.getItem("token");

  const [pestana, setPestana] = useState("venta");

  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState(1);
  const [ticketVenta, setTicketVenta] = useState(null);
  const [modalEfectivo, setModalEfectivo] = useState(false);
  const [pagoRecibido, setPagoRecibido] = useState("");

  const {
    carrito,
    agregarProducto,
    cambiarCantidad,
    eliminarProducto,
    setCarrito
  } = useCarrito(productos);

  // Descuento por nivel de lealtad del cliente (mismo criterio que calcula el servidor)
  const [nivelLealtad, setNivelLealtad] = useState(null);
  useEffect(() => {
    const empresaId = decodeToken(token)?.empresa_id;
    if (!clienteSeleccionado || !empresaId) { setNivelLealtad(null); return; }
    let vigente = true;
    const base = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${base}/api/productos/lealtad/cliente/${clienteSeleccionado.id}/empresa/${empresaId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vigente) setNivelLealtad(d?.nivel_actual || null); })
      .catch(() => { if (vigente) setNivelLealtad(null); });
    return () => { vigente = false; };
  }, [clienteSeleccionado, token]);

  const descuentoLealtad = nivelLealtad ? parseFloat(nivelLealtad.descuento_porcentaje) || 0 : 0;
  const precioFinal = (p) => {
    const precio = parseFloat(p.precio);
    const opciones = [precio];
    const mayoreo = parseFloat(p.precio_mayoreo);
    if (mayoreo > 0) opciones.push(mayoreo);
    if (descuentoLealtad > 0) opciones.push(precio * (1 - descuentoLealtad / 100));
    return Math.round(Math.min(...opciones) * 100) / 100;
  };
  const carritoVista = carrito.map((p) => ({ ...p, precio: precioFinal(p) }));
  const total = Math.round(carritoVista.reduce((acc, p) => acc + p.precio * p.cantidad, 0) * 100) / 100;

  const [busquedaProducto, setBusquedaProducto] = useState("");
  const { busqueda, setBusqueda, clientes, setClientes } =
    useClientes(token);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [creandoCliente, setCreandoCliente] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    tipo_documento: "Cédula de ciudadanía",
    numero_documento: "",
    id_departamento: "",
    id_municipio: ""
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  useEffect(() => {
    getProductos(token).then(data => setProductos(data.filter(p => p.activo !== false)));
    getDepartamentos().then(setDepartamentos);
  }, []);

  const handleDepartamentoChange = async (id) => {
    setNuevoCliente({
      ...nuevoCliente,
      id_departamento: id,
      id_municipio: ""
    });

    if (!id) return setMunicipios([]);

    const data = await getMunicipios(id);
    setMunicipios(data);
  };

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setCreandoCliente(true);

    try {
      const creado = await crearCliente(
        {
          nombre: nuevoCliente.nombre,
          apellido: nuevoCliente.apellido,
          telefono: nuevoCliente.telefono,
          direccion: nuevoCliente.direccion,
          tipo_documento: nuevoCliente.tipo_documento,
          numero_documento: nuevoCliente.numero_documento,
          id_municipio: nuevoCliente.id_municipio
            ? Number(nuevoCliente.id_municipio)
            : null
        },
        token
      );

      setClienteSeleccionado(creado);
      setBusqueda(`${creado.nombre} ${creado.apellido || ""}`);
      setClientes([]);
      setMostrarModal(false);

      setNuevoCliente({
        nombre: "",
        apellido: "",
        telefono: "",
        direccion: "",
        tipo_documento: "Cédula de ciudadanía",
        numero_documento: "",
        id_departamento: "",
        id_municipio: ""
      });

      setMunicipios([]);

    } catch (error) {
      toast.error(error.response?.data?.error || "Error al crear cliente");
    } finally {
      setCreandoCliente(false);
    }
  };

  const handleConfirmarClick = () => {
    if (metodoPago === 1) {
      setPagoRecibido("");
      setModalEfectivo(true);
    } else {
      confirmarVenta();
    }
  };

  const handleConfirmarEfectivo = () => {
    setModalEfectivo(false);
    setPagoRecibido("");
    confirmarVenta();
  };

  const confirmarVenta = async () => {
    if (!clienteSeleccionado) { toast.warning("Selecciona un cliente"); return; }
    if (!carrito.length) { toast.warning("El carrito está vacío"); return; }

    try {
      const res = await crearVenta(
        {
          cliente_id: clienteSeleccionado.id,
          metodo_pago_id: metodoPago,
          productos: carrito.map((p) => ({
            producto_id: p.id,
            cantidad: p.cantidad
          }))
        },
        token
      );

      // Guardar datos del ticket antes de limpiar el carrito
      setTicketVenta({
        cliente: clienteSeleccionado,
        items: [...carritoVista],
        total: res?.total ?? total,
        metodoPago,
        fecha: new Date(),
        id: res?.id || res?.venta_id || null,
      });

      toast.success("Venta realizada correctamente");

      setCarrito([]);
      setClienteSeleccionado(null);
      setBusqueda("");
      setClientes([]);
      setMetodoPago(1);
      setPestana("venta");

    } catch (error) {
      toast.error(error.response?.data?.error || "Error al registrar la venta");
    }
  };

  const fmt = (n) => Number(n).toLocaleString("es-CO");

  return (
    <div className="pos-wrap">

      {/* TABS */}
      <div className="pos-tabs">
        <div className={`pos-tab ${pestana === "venta" ? "active" : ""}`}
          onClick={() => setPestana("venta")}>
          Venta
        </div>

        <div className={`pos-tab ${pestana === "historial" ? "active" : ""}`}
          onClick={() => setPestana("historial")}>
          Historial
        </div>

        <div className={`pos-tab ${pestana === "caja" ? "active" : ""}`}
          onClick={() => setPestana("caja")}>
          Caja
        </div>
      </div>

      <div className="pos-body">

        {pestana === "venta" && (
          <div className="pos-root">

            <ProductGrid
              productos={productos}
              agregarProducto={agregarProducto}
              busqueda={busquedaProducto}
              setBusqueda={setBusquedaProducto}
            />

            <div className="pos-right">

              <div className="pos-right-header">

                <div className="pos-right-header-top">
                  <h2>Venta</h2>

                  {/* 🔥 BOTÓN RESTAURADO */}
                  <button
                    onClick={() => setMostrarModal(true)}
                    className="btn-nuevo-cliente"
                  >
                    Nuevo Cliente
                  </button>
                </div>

                <ClienteSearch
                  busqueda={busqueda}
                  setBusqueda={setBusqueda}
                  clientes={clientes}
                  setClientes={setClientes}
                  clienteSeleccionado={clienteSeleccionado}
                  setClienteSeleccionado={setClienteSeleccionado}
                />
              </div>

              <Carrito
                carrito={carritoVista}
                cambiarCantidad={cambiarCantidad}
                eliminarProducto={eliminarProducto}
                fmt={fmt}
              />

              <div className="pos-footer">

                <MetodoPago
                  metodoPago={metodoPago}
                  setMetodoPago={setMetodoPago}
                />

                {nivelLealtad && descuentoLealtad > 0 && (
                  <div className="total-row" style={{ fontSize: "13px", color: "#0f766e" }}>
                    <span>Nivel {nivelLealtad.nombre}</span>
                    <span>-{descuentoLealtad}%</span>
                  </div>
                )}

                <div className="total-row">
                  <span>Total</span>
                  <span>${fmt(total)}</span>
                </div>

                <button
                  className="btn-confirmar"
                  onClick={handleConfirmarClick}
                  disabled={!carrito.length || !clienteSeleccionado}
                >
                  Confirmar venta
                </button>

              </div>

            </div>
          </div>
        )}

        {pestana === "historial" && <Historial token={token} />}
        {pestana === "caja" && <Caja token={token} />}

      </div>

      <ModalCliente
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onCrear={handleCrearCliente}
        nuevoCliente={nuevoCliente}
        setNuevoCliente={setNuevoCliente}
        creandoCliente={creandoCliente}
        departamentos={departamentos}
        municipios={municipios}
        onDepartamentoChange={handleDepartamentoChange}
      />

      {modalEfectivo && (
        <div style={mEf.overlay}>
          <div style={mEf.box}>
            <h3 style={mEf.title}>Cobro en efectivo</h3>

            <div style={mEf.totalDisplay}>
              <span style={mEf.totalLabel}>Total a cobrar</span>
              <span style={mEf.totalValor}>${fmt(total)}</span>
            </div>

            <div style={mEf.inputWrap}>
              <label style={mEf.inputLabel}>Monto recibido</label>
              <input
                style={mEf.input}
                type="number"
                min="0"
                placeholder={String(total)}
                value={pagoRecibido}
                onChange={e => setPagoRecibido(e.target.value)}
                autoFocus
              />
            </div>

            {pagoRecibido !== "" && (
              <div style={mEf.vueltoWrap}>
                <span style={mEf.vueltoLabel}>
                  {Number(pagoRecibido) >= total ? "Vuelto" : "Falta"}
                </span>
                <span style={{
                  ...mEf.vueltoValor,
                  color: Number(pagoRecibido) >= total ? "#2563eb" : "#ef4444"
                }}>
                  ${fmt(Math.abs(Number(pagoRecibido) - total))}
                </span>
              </div>
            )}

            <div style={mEf.btns}>
              <button style={mEf.btnCancelar} onClick={() => setModalEfectivo(false)}>Cancelar</button>
              <button
                style={{ ...mEf.btnConfirmar, opacity: Number(pagoRecibido) >= total ? 1 : 0.4 }}
                onClick={handleConfirmarEfectivo}
                disabled={!pagoRecibido || Number(pagoRecibido) < total}
              >
                Confirmar venta
              </button>
            </div>
          </div>
        </div>
      )}

      {ticketVenta && (
        <ModalTicket
          venta={ticketVenta}
          empresa={localStorage.getItem("empresa_nombre") || "Pesquera Estrada"}
          onClose={() => setTicketVenta(null)}
          fmt={fmt}
        />
      )}

    </div>
  );
}

// ── Modal de ticket de impresión ─────────────────────────────────────────────
const METODOS = { 1: "Efectivo", 2: "Tarjeta", 3: "Transferencia", 4: "Nequi / Daviplata" };

function ModalTicket({ venta, empresa, onClose, fmt }) {
  const handlePrint = () => window.print();
  const { cliente, items, total, metodoPago, fecha, id } = venta;

  return (
    <>
      <style>{`
        @media print {
          body > *:not(.pos-ticket-overlay) { display: none !important; }
          .pos-ticket-overlay { position: static !important; background: none !important; padding: 0 !important; }
          .pos-ticket-box { box-shadow: none !important; max-width: 100% !important; border: none !important; }
          .pos-ticket-no-print { display: none !important; }
          @page { margin: 10mm; size: 80mm auto; }
        }
        .pos-ticket-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 9000; padding: 20px;
        }
        .pos-ticket-box {
          background: white; border-radius: 16px; padding: 28px 24px;
          max-width: 380px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          font-family: 'Sora', 'Inter', monospace;
          display: flex; flex-direction: column; gap: 0;
        }
        .pos-ticket-head { text-align: center; padding-bottom: 14px; border-bottom: 1px dashed #e2e8f0; margin-bottom: 14px; }
        .pos-ticket-empresa { font-size: 16px; font-weight: 800; color: #0B1628; letter-spacing: -0.02em; }
        .pos-ticket-meta { font-size: 11px; color: #94a3b8; margin-top: 3px; }
        .pos-ticket-section { margin-bottom: 14px; }
        .pos-ticket-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .pos-ticket-cliente { font-size: 13px; font-weight: 600; color: #0f172a; }
        .pos-ticket-item { display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 3px 0; }
        .pos-ticket-item-name { flex: 1; }
        .pos-ticket-item-qty { color: #94a3b8; margin: 0 10px; }
        .pos-ticket-divider { border: none; border-top: 1px dashed #e2e8f0; margin: 14px 0; }
        .pos-ticket-total-row { display: flex; justify-content: space-between; align-items: center; }
        .pos-ticket-total-label { font-size: 13px; font-weight: 700; color: #0f172a; }
        .pos-ticket-total-val { font-size: 20px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em; }
        .pos-ticket-metodo { font-size: 11px; color: #64748b; margin-top: 4px; text-align: right; }
        .pos-ticket-footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e2e8f0; }
        .pos-ticket-btns { display: flex; gap: 8px; margin-top: 20px; }
        .pos-ticket-btn-print { flex: 1; padding: 11px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
        .pos-ticket-btn-close { padding: 11px 16px; background: #f1f5f9; color: #64748b; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div className="pos-ticket-overlay">
        <div className="pos-ticket-box">

          <div className="pos-ticket-head">
            <div className="pos-ticket-empresa">{empresa}</div>
            <div className="pos-ticket-meta">
              {fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
              {" · "}
              {fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              {id && ` · #${id}`}
            </div>
          </div>

          <div className="pos-ticket-section">
            <div className="pos-ticket-label">Cliente</div>
            <div className="pos-ticket-cliente">
              {cliente.nombre} {cliente.apellido || ""}
            </div>
          </div>

          <div className="pos-ticket-section">
            <div className="pos-ticket-label">Productos</div>
            {items.map(item => (
              <div key={item.id} className="pos-ticket-item">
                <span className="pos-ticket-item-name">{item.nombre}</span>
                <span className="pos-ticket-item-qty">×{item.cantidad}</span>
                <span>${fmt(item.precio * item.cantidad)}</span>
              </div>
            ))}
          </div>

          <hr className="pos-ticket-divider" />

          <div className="pos-ticket-total-row">
            <span className="pos-ticket-total-label">Total</span>
            <span className="pos-ticket-total-val">${fmt(total)}</span>
          </div>
          <div className="pos-ticket-metodo">{METODOS[metodoPago] || "Efectivo"}</div>

          <div className="pos-ticket-footer">¡Gracias por su compra!</div>

          <div className="pos-ticket-btns pos-ticket-no-print">
            <button className="pos-ticket-btn-print" onClick={handlePrint}>Imprimir ticket</button>
            <button className="pos-ticket-btn-close" onClick={onClose}>Cerrar</button>
          </div>

        </div>
      </div>
    </>
  );
}

const mEf = {
  overlay:      { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" },
  box:          { background: "white", borderRadius: "18px", padding: "28px 24px", width: "320px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: "18px" },
  title:        { fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 },
  totalDisplay: { backgroundColor: "#f8fafc", borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel:   { fontSize: "12px", color: "#64748b", fontWeight: "600" },
  totalValor:   { fontSize: "20px", fontWeight: "800", color: "#0f172a" },
  inputWrap:    { display: "flex", flexDirection: "column", gap: "6px" },
  inputLabel:   { fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" },
  input:        { padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "18px", fontWeight: "600", color: "#0f172a", outline: "none", width: "100%", boxSizing: "border-box" },
  vueltoWrap:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "10px" },
  vueltoLabel:  { fontSize: "13px", color: "#64748b", fontWeight: "600" },
  vueltoValor:  { fontSize: "18px", fontWeight: "800" },
  btns:         { display: "flex", gap: "10px" },
  btnCancelar:  { flex: 1, padding: "11px", background: "#f1f5f9", border: "none", borderRadius: "10px", fontSize: "13px", color: "#64748b", cursor: "pointer", fontWeight: "600" },
  btnConfirmar: { flex: 2, padding: "11px", background: "#2563eb", border: "none", borderRadius: "10px", fontSize: "13px", color: "white", fontWeight: "700", cursor: "pointer", transition: "opacity 0.15s" },
};