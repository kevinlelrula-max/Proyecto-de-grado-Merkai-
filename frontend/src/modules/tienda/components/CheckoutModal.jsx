import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import PedidoConfirmado from "./PedidoConfirmado";

// ── Formulario interno de Stripe ─────────────────────────────────────────────
function StripeForm({ totalPrecio, onExito, onError, colorMarca }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago]   = useState("");

  const handlePagar = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcesando(true);
    setErrorPago("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // No redirige — manejamos el resultado aquí mismo
        return_url: `${window.location.origin}/tienda/mis-pedidos`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorPago(error.message || "Error al procesar el pago.");
      setProcesando(false);
      onError?.(error.message);
    } else if (paymentIntent?.status === "succeeded") {
      onExito?.(paymentIntent.id);
    } else {
      setErrorPago("Estado de pago inesperado. Intenta de nuevo.");
      setProcesando(false);
    }
  };

  return (
    <form onSubmit={handlePagar} style={f.form}>
      <PaymentElement options={{ layout: "tabs" }} />

      {errorPago && (
        <div style={f.errorBox}>{errorPago}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || procesando}
        style={{
          ...f.btnPagar,
          backgroundColor: colorMarca || f.btnPagar.backgroundColor,
          opacity: procesando ? 0.75 : 1,
          cursor: procesando ? "not-allowed" : "pointer",
        }}
      >
        {procesando
          ? "Procesando pago..."
          : `Pagar $${totalPrecio.toLocaleString("es-CO")}`}
      </button>

      <p style={f.stripe}>
        Pago seguro procesado por <strong>Stripe</strong>
      </p>
    </form>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function CheckoutModal({
  abierto,
  onCerrar,
  stripePromise,
  clientSecret,
  loadingIntent,
  errorCheckout,
  totalPrecio,
  carrito,
  empresaNombre,
  pedidoId,
  onPagoExitoso,
  onVerPedidos,
  onCerrarCarrito,
  colorMarca = "#3674B5",
  colorSecundario = "#0B1628",
  direccion,
  metodo = "tarjeta",
}) {
  // Datos del pedido pagado: se guardan aquí porque el carrito se vacía apenas el pago es exitoso
  const [exito, setExito] = useState(null);

  if (!abierto) return null;

  const cerrarTodo = () => {
    setExito(null);
    onCerrar();
    onCerrarCarrito?.();
  };

  const handleExito = (paymentIntentId) => {
    setExito({ id: pedidoId, total: totalPrecio, metodo, direccion });
    // El servidor verifica el pago directamente con Stripe y confirma el pedido (no depende del webhook)
    if (pedidoId) {
      const base  = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("cliente_token");
      fetch(`${base}/api/pagos/confirmar-stripe`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ pedido_id: pedidoId, payment_intent_id: paymentIntentId }),
      }).catch(() => {});
    }
    // Se vacía el carrito ya, pero el cliente decide a dónde ir: no hay redirección automática
    onPagoExitoso?.();
  };

  if (exito) {
    return (
      <PedidoConfirmado
        pedido={exito}
        empresaNombre={empresaNombre}
        colorMarca={colorMarca}
        colorSecundario={colorSecundario}
        onSeguirComprando={cerrarTodo}
        onVerPedidos={() => { cerrarTodo(); onVerPedidos?.(); }}
      />
    );
  }

  return (
    <>
      {/* Overlay */}
      <div style={s.overlay} onClick={onCerrar} />

      {/* Modal */}
      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h3 style={s.headerTitle}>Checkout</h3>
            <p style={s.headerSub}>{empresaNombre}</p>
          </div>
          <button style={s.closeBtn} onClick={onCerrar}>✕</button>
        </div>

        {/* Contenido */}
        <div style={s.body}>

          {/* Resumen del pedido */}
          <div style={s.resumen}>
            <p style={s.resumenTitle}>Resumen del pedido</p>
            {carrito.map(item => (
              <div key={item.id} style={s.resumenItem}>
                <span style={s.resumenNombre}>{item.nombre} · {Number(item.cantidad).toFixed(1)} {item.unidad || "uds."}</span>
                <span style={s.resumenPrecio}>
                  ${(item.cantidad * item.precio).toLocaleString("es-CO")}
                </span>
              </div>
            ))}
            <div style={s.resumenTotal}>
              <span style={s.resumenTotalLabel}>Total</span>
              <span style={{ ...s.resumenTotalValor, color: colorMarca }}>
                ${totalPrecio.toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          {/* Error del checkout */}
          {errorCheckout && (
            <div style={s.errorBox}>{errorCheckout}</div>
          )}

          {/* Loading del PaymentIntent */}
          {loadingIntent && (
            <div style={s.loading}>
              <div style={{ ...s.spinner, borderTopColor: colorMarca }} />
              <span style={s.loadingText}>Iniciando pago seguro...</span>
            </div>
          )}

          {/* Stripe Elements */}
          {!loadingIntent && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary:    colorMarca,
                    colorBackground: "#ffffff",
                    colorText:       "#0f172a",
                    borderRadius:    "10px",
                    fontFamily:      "'Inter', sans-serif",
                  },
                },
              }}
            >
              <StripeForm
                totalPrecio={totalPrecio}
                colorMarca={colorMarca}
                onExito={handleExito}
                onError={(msg) => console.error("Pago fallido:", msg)}
              />
            </Elements>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Estilos ─── */
const s = {
  overlay: {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(15,23,42,0.6)",
    zIndex: 300, backdropFilter: "blur(3px)",
  },
  modal: {
    position: "fixed",
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%", maxWidth: "480px",
    backgroundColor: "white",
    borderRadius: "20px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
    zIndex: 301,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxHeight: "90vh",
    display: "flex", flexDirection: "column",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexShrink: 0,
  },
  headerTitle: { fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 },
  headerSub:   { fontSize: "13px", color: "#64748b", margin: "2px 0 0" },
  closeBtn: {
    background: "none", border: "none",
    fontSize: "16px", cursor: "pointer",
    color: "#94a3b8", padding: "4px 8px", borderRadius: "6px",
  },
  body: { padding: "20px 24px 24px", overflowY: "auto", flex: 1 },

  // Resumen
  resumen: {
    backgroundColor: "#f8fafc", borderRadius: "12px",
    padding: "14px 16px", marginBottom: "20px",
    border: "1px solid #e2e8f0",
  },
  resumenTitle: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" },
  resumenItem:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" },
  resumenNombre: { fontSize: "13px", color: "#374151" },
  resumenPrecio: { fontSize: "13px", fontWeight: "600", color: "#0f172a" },
  resumenTotal:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" },
  resumenTotalLabel: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  resumenTotalValor: { fontSize: "20px", fontWeight: "800" },

  // Error
  errorBox: { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c", marginBottom: "16px" },

  // Loading
  loading: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "40px 0" },
  spinner: { width: "20px", height: "20px", border: "2px solid #e2e8f0", borderTop: "2px solid #3674B5", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { fontSize: "14px", color: "#64748b" },
};

const f = {
  form:    { display: "flex", flexDirection: "column", gap: "16px", marginTop: "4px" },
  errorBox: { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#b91c1c" },
  btnPagar: {
    width: "100%", padding: "14px",
    backgroundColor: "#3674B5", color: "white",
    border: "none", borderRadius: "10px",
    fontSize: "15px", fontWeight: "700",
    transition: "opacity 0.2s",
  },
  stripe: { textAlign: "center", fontSize: "12px", color: "#94a3b8" },
};
