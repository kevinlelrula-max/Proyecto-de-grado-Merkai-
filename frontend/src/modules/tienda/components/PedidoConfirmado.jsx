import { useEffect } from "react";
import { Check, X, ShoppingBag, ClipboardList, MapPin, CreditCard, Receipt } from "lucide-react";

// Texto de "qué sigue" según el método de pago elegido
export function instruccionesPago(metodo) {
  const m = (metodo || "").toLowerCase();
  if (m === "nequi")
    return "Envía el monto exacto al número de Nequi del negocio. Activaremos tu pedido cuando confirmemos la transferencia.";
  if (m === "transferencia")
    return "Haz la transferencia a la cuenta del negocio y comparte el comprobante. Activaremos tu pedido cuando confirmemos el pago.";
  if (m === "tarjeta")
    return "Tu pago con tarjeta fue aprobado. El negocio ya está preparando tu pedido.";
  return "El negocio se pondrá en contacto contigo para coordinar la entrega y el cobro.";
}

const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");

/**
 * Aviso de compra exitosa de la tienda. Usa los colores de la empresa y NO redirige solo:
 * el cliente elige si sigue comprando o va a sus pedidos.
 *
 * pedido: { id, total, metodo?, direccion? }
 */
export default function PedidoConfirmado({
  pedido,
  empresaNombre,
  colorMarca = "#0F6E56",
  colorSecundario = "#0B1628",
  onSeguirComprando,
  onVerPedidos,
}) {
  // Esc = seguir comprando
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onSeguirComprando?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSeguirComprando]);

  if (!pedido) return null;

  const filas = [
    { icono: Receipt,    label: (pedido.metodo || "").toLowerCase() === "tarjeta" ? "Total pagado" : "Total del pedido", valor: `$${Number(pedido.total || 0).toLocaleString("es-CO")}`, fuerte: true },
    pedido.metodo    && { icono: CreditCard, label: "Método de pago", valor: capitalizar(pedido.metodo) },
    pedido.direccion && { icono: MapPin,     label: "Entrega en",     valor: pedido.direccion },
  ].filter(Boolean);

  return (
    <div style={s.overlay} onClick={onSeguirComprando} role="dialog" aria-modal="true" aria-label="Pedido confirmado">
      <style>{`
        @keyframes pc-pop   { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes pc-ring  { 0% { transform: scale(0.9); opacity: 0.55 } 100% { transform: scale(1.7); opacity: 0 } }
        @keyframes pc-rise  { from { transform: translateY(14px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pc-check { from { stroke-dashoffset: 30 } to { stroke-dashoffset: 0 } }
      `}</style>

      <div style={s.card} onClick={(e) => e.stopPropagation()}>

        {/* Franja superior con la marca de la tienda */}
        <div style={{ ...s.hero, background: `linear-gradient(135deg, ${colorSecundario} 0%, ${colorMarca} 130%)` }}>
          <button style={s.cerrar} onClick={onSeguirComprando} aria-label="Cerrar">
            <X size={16} />
          </button>

          <div style={s.checkWrap}>
            <span style={{ ...s.ring, borderColor: "rgba(255,255,255,0.55)" }} />
            <div style={s.checkCircle}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={colorMarca} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="30" style={{ animation: "pc-check 0.45s 0.25s ease-out both" }} />
              </svg>
            </div>
          </div>

          <h2 style={s.titulo}>¡Pedido recibido!</h2>
          <p style={s.subtitulo}>
            Gracias por comprar en {empresaNombre || "nuestra tienda"}
          </p>
          <span style={s.numero}>Pedido #{pedido.id}</span>
        </div>

        {/* Detalle */}
        <div style={s.cuerpo}>
          <div style={s.filas}>
            {filas.map((f) => {
              const Icono = f.icono;
              return (
                <div key={f.label} style={s.fila}>
                  <span style={{ ...s.filaIcono, backgroundColor: `${colorMarca}14`, color: colorMarca }}>
                    <Icono size={14} />
                  </span>
                  <span style={s.filaLabel}>{f.label}</span>
                  <span style={{ ...s.filaValor, ...(f.fuerte ? { fontSize: 18, fontWeight: 800, color: colorMarca } : {}) }}>
                    {f.valor}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ ...s.siguiente, backgroundColor: `${colorMarca}0f`, borderColor: `${colorMarca}33` }}>
            <p style={{ ...s.siguienteTitulo, color: colorMarca }}>¿Qué sigue?</p>
            <p style={s.siguienteTexto}>{instruccionesPago(pedido.metodo)}</p>
          </div>

          <div style={s.botones}>
            <button style={{ ...s.btnPrimario, backgroundColor: colorMarca }} onClick={onSeguirComprando}>
              <ShoppingBag size={16} />
              Seguir comprando
            </button>
            <button style={{ ...s.btnSecundario, color: colorMarca, borderColor: `${colorMarca}55` }} onClick={onVerPedidos}>
              <ClipboardList size={16} />
              Ver mis pedidos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 400,
    backgroundColor: "rgba(15,23,42,0.62)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    fontFamily: "inherit",
  },
  card: {
    width: "100%", maxWidth: "440px", maxHeight: "94vh", overflowY: "auto",
    backgroundColor: "#ffffff", borderRadius: "22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    animation: "pc-rise 0.35s ease-out both",
  },
  hero: {
    position: "relative", padding: "34px 24px 26px", textAlign: "center", color: "white",
    borderRadius: "22px 22px 0 0",
  },
  cerrar: {
    position: "absolute", top: "12px", right: "12px", width: "30px", height: "30px",
    borderRadius: "50%", border: "none", cursor: "pointer",
    backgroundColor: "rgba(255,255,255,0.16)", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  checkWrap: { position: "relative", width: "72px", height: "72px", margin: "0 auto 16px" },
  ring: {
    position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid",
    animation: "pc-ring 1.6s ease-out 0.3s infinite",
  },
  checkCircle: {
    position: "relative", width: "72px", height: "72px", borderRadius: "50%",
    backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
    animation: "pc-pop 0.5s ease-out both",
  },
  titulo: { fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 4px", color: "white" },
  subtitulo: { fontSize: "13px", margin: "0 0 14px", color: "rgba(255,255,255,0.8)" },
  numero: {
    display: "inline-block", padding: "5px 14px", borderRadius: "999px",
    backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)",
    fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em",
  },

  cuerpo: { padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: "16px" },
  filas: { display: "flex", flexDirection: "column", gap: "2px" },
  fila: { display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: "1px solid #f1f5f9" },
  filaIcono: { width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  filaLabel: { fontSize: "12px", color: "#64748b", fontWeight: 600, flexShrink: 0 },
  filaValor: { flex: 1, textAlign: "right", fontSize: "13px", color: "#0f172a", fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" },

  siguiente: { border: "1px solid", borderRadius: "12px", padding: "12px 14px" },
  siguienteTitulo: { fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" },
  siguienteTexto: { fontSize: "13px", color: "#334155", lineHeight: 1.55, margin: 0 },

  botones: { display: "flex", flexDirection: "column", gap: "9px" },
  btnPrimario: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    width: "100%", padding: "13px", border: "none", borderRadius: "12px",
    color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  btnSecundario: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    width: "100%", padding: "12px", backgroundColor: "white", border: "1.5px solid",
    borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
};
