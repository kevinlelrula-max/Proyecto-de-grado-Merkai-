import { useEffect, useState } from "react";
import { Lock, Unlock, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useCaja } from "../hooks/useCaja";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function fmtCOP(n) {
  return `$${Number(n || 0).toLocaleString("es-CO")}`;
}

// ── Modales ────────────────────────────────────────────────────────────────

function ModalApertura({ onCerrar, onConfirmar }) {
  const [monto,    setMonto]    = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    setCargando(true);
    const ok = await onConfirmar(Number(monto || 0));
    if (ok) onCerrar();
    setCargando(false);
  };

  return (
    <div style={overlay} onClick={onCerrar}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <ModalHeader icon={<Unlock size={18} />} color="#16a34a" bg="#f0fdf4"
          titulo="Abrir caja" subtitulo="Registra el efectivo inicial en caja" />
        <Field label="Monto de apertura">
          <input type="number" min="0" value={monto} autoFocus
            onChange={e => setMonto(e.target.value)} placeholder="0" style={inputStyle} />
        </Field>
        <BotonesFooter
          onCancelar={onCerrar}
          onConfirmar={handleSubmit}
          label={cargando ? "Abriendo..." : "Abrir caja"}
          colorConfirmar="#16a34a"
          disabled={cargando}
        />
      </div>
    </div>
  );
}

function FilaResumen({ label, valor, fuerte, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: fuerte ? "10px 0 0" : "6px 0", borderTop: fuerte ? "1px dashed #cbd5e1" : "none", marginTop: fuerte ? 4 : 0 }}>
      <span style={{ fontSize: fuerte ? 13 : 12, fontWeight: fuerte ? 700 : 600, color: fuerte ? "#0f172a" : "#64748b" }}>{label}</span>
      <span style={{ fontSize: fuerte ? 18 : 13, fontWeight: 800, color: color || "#0f172a" }}>{valor}</span>
    </div>
  );
}

// El efectivo de cierre se calcula solo: apertura + ventas en efectivo − devoluciones en efectivo.
function ModalCierre({ sesion, onCerrar, onConfirmar }) {
  const [obs,      setObs]      = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    if (cargando) return;
    setCargando(true);
    const ok = await onConfirmar(sesion.id, obs);
    if (ok) onCerrar();
    setCargando(false);
  };

  const ventasNoEfectivo = Number(sesion.ventas_total || 0) - Number(sesion.ventas_efectivo || 0);

  return (
    <div style={overlay} onClick={onCerrar}>
      <div style={{ ...modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <ModalHeader icon={<Lock size={18} />} color="#2563eb" bg="#eff6ff"
          titulo="Cerrar caja"
          subtitulo="El efectivo en caja se calcula automáticamente" />

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <FilaResumen label="Apertura" valor={fmtCOP(sesion.monto_apertura)} />
          <FilaResumen label={`Ventas en efectivo (${sesion.ventas_cantidad} ventas en total)`} valor={`+ ${fmtCOP(sesion.ventas_efectivo)}`} />
          {Number(sesion.devoluciones_efectivo) > 0 && (
            <FilaResumen label="Devoluciones en efectivo" valor={`− ${fmtCOP(sesion.devoluciones_efectivo)}`} color="#dc2626" />
          )}
          <FilaResumen label="Efectivo en caja al cerrar" valor={fmtCOP(sesion.efectivo_esperado)} fuerte color="#2563eb" />
        </div>

        {ventasNoEfectivo > 0 && (
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "-4px 0 14px" }}>
            Además hubo {fmtCOP(ventasNoEfectivo)} cobrados por transferencia, Nequi o tarjeta (no entran al efectivo de la caja).
          </p>
        )}

        <Field label="Observaciones (opcional)">
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
            placeholder="Ej: Todo cuadrado, sin diferencias."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", fontSize: 13 }} />
        </Field>
        <BotonesFooter
          onCancelar={onCerrar}
          onConfirmar={handleSubmit}
          label={cargando ? "Cerrando..." : "Confirmar cierre"}
          disabled={cargando}
          colorConfirmar="#2563eb"
        />
      </div>
    </div>
  );
}

// ── Sub-componentes de UI reutilizables ────────────────────────────────────

function ModalHeader({ icon, color, bg, titulo, subtitulo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>{titulo}</h3>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{subtitulo}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function BotonesFooter({ onCancelar, onConfirmar, label, disabled, colorConfirmar }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      <button onClick={onCancelar} style={btnSecundario}>Cancelar</button>
      <button onClick={onConfirmar} disabled={disabled}
        style={{ ...btnPrimario, flex: 2, background: colorConfirmar, cursor: disabled ? "not-allowed" : "pointer" }}>
        {label}
      </button>
    </div>
  );
}

function Alerta({ msg, onCerrar }) {
  if (!msg) return null;
  const ok = msg.tipo === "ok";
  return (
    <div style={{ background: ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      {ok ? <CheckCircle size={15} color="#16a34a" /> : <AlertTriangle size={15} color="#dc2626" />}
      <span style={{ color: ok ? "#15803d" : "#dc2626", fontWeight: 600, flex: 1 }}>{msg.texto}</span>
      <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: "0 4px" }}>×</button>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function Caja({ token }) {
  const [modal, setModal] = useState(null); // 'abrir' | 'cerrar' | null

  const {
    cargando, sesion, historial,
    totalSesion, totalVentas, promedio, porMetodo,
    msg, limpiarMsg,
    cargar, handleAbrir, handleCerrar,
  } = useCaja();

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando) {
    return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Cargando caja...</div>;
  }

  return (
    <div className="caja-wrap">

      {/* Estado de sesión */}
      <div style={{ background: sesion ? "#f0fdf4" : "#fef2f2", border: `1.5px solid ${sesion ? "#bbf7d0" : "#fecaca"}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: sesion ? "#dcfce7" : "#fee2e2", color: sesion ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {sesion ? <Unlock size={16} /> : <Lock size={16} />}
          </span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: sesion ? "#15803d" : "#dc2626", margin: 0 }}>
              {sesion ? "Caja abierta" : "Caja cerrada"}
            </p>
            {sesion && (
              <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>
                Apertura: {fmtCOP(sesion.monto_apertura)} · {sesion.usuario_nombre}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setModal(sesion ? "cerrar" : "abrir")}
          style={{ padding: "8px 18px", background: sesion ? "#dc2626" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
        >
          {sesion ? "Cerrar caja" : "Abrir caja"}
        </button>
      </div>

      <Alerta msg={msg} onCerrar={limpiarMsg} />

      {!sesion && (
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
          Abre la caja para empezar a registrar ventas. Mientras esté cerrada, el punto de venta no permite cobrar.
        </p>
      )}

      {/* Resumen de la sesión abierta (solo ventas del punto de venta desde la apertura) */}
      {sesion && (
        <>
          <div className="caja-stats">
            <div className="caja-stat">
              <div className="caja-stat-label">Ventas de esta caja</div>
              <div className="caja-stat-val">{fmtCOP(totalSesion)}</div>
            </div>
            <div className="caja-stat">
              <div className="caja-stat-label">Transacciones</div>
              <div className="caja-stat-val">{totalVentas}</div>
            </div>
            <div className="caja-stat">
              <div className="caja-stat-label">Promedio</div>
              <div className="caja-stat-val verde">{fmtCOP(promedio)}</div>
            </div>
          </div>

          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px", margin: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>Efectivo que debe haber en caja</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Apertura {fmtCOP(sesion.monto_apertura)} + efectivo vendido {fmtCOP(sesion.ventas_efectivo)}
                {Number(sesion.devoluciones_efectivo) > 0 ? ` − devoluciones ${fmtCOP(sesion.devoluciones_efectivo)}` : ""}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1d4ed8" }}>{fmtCOP(sesion.efectivo_esperado)}</div>
          </div>
        </>
      )}

      {/* Métodos de pago */}
      <div className="caja-metodos">
        <h3>Métodos de pago</h3>
        {Object.entries(porMetodo).length === 0 ? (
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "8px 0 0" }}>
            {sesion ? "Sin ventas en esta caja todavía" : "No hay una caja abierta"}
          </p>
        ) : (
          Object.entries(porMetodo).map(([metodo, valor]) => (
            <div key={metodo} className="metodo-row">
              <div className="metodo-row-label">{metodo}</div>
              <div className="metodo-row-val">{fmtCOP(valor)}</div>
            </div>
          ))
        )}
      </div>

      {/* Historial de sesiones */}
      {historial.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
            Sesiones recientes
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {historial.map(s => (
              <div key={s.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {new Date(s.fecha_apertura).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{s.usuario_nombre}</p>
                </div>
                <div style={{ textAlign: "right", fontSize: 12 }}>
                  <span style={{ padding: "2px 10px", borderRadius: 6, fontWeight: 700, fontSize: 11, background: s.estado === "abierta" ? "#dcfce7" : "#f1f5f9", color: s.estado === "abierta" ? "#15803d" : "#64748b" }}>
                    {s.estado}
                  </span>
                  <p style={{ color: "#64748b", margin: "4px 0 0" }}>
                    {s.ventas_cantidad} ventas · {fmtCOP(s.ventas_total)}
                  </p>
                  {s.monto_cierre != null && (
                    <p style={{ color: "#0f172a", fontWeight: 700, margin: "2px 0 0" }}>Efectivo al cierre: {fmtCOP(s.monto_cierre)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal === "abrir"  && <ModalApertura onCerrar={() => setModal(null)} onConfirmar={handleAbrir} />}
      {modal === "cerrar" && sesion && (
        <ModalCierre sesion={sesion} onCerrar={() => setModal(null)} onConfirmar={handleCerrar} />
      )}
    </div>
  );
}

// ── Estilos locales ────────────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0, zIndex: 9999,
  backgroundColor: "rgba(15,23,42,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
};

const modal = {
  background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0",
  boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  width: "100%", maxWidth: 380, padding: 28,
};

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 10,
  fontSize: 15, fontWeight: 700, color: "#0f172a",
  outline: "none", boxSizing: "border-box",
};

const btnSecundario = {
  flex: 1, padding: "10px", background: "#f1f5f9",
  border: "none", borderRadius: 10, fontSize: 13,
  color: "#64748b", fontWeight: 600, cursor: "pointer",
};

const btnPrimario = {
  padding: "10px", border: "none",
  borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff",
};
