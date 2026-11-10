import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import FormularioLlaves from "./FormularioLlaves";

function Logo({ pasarela }) {
  const estilos = {
    wompi:       { color: "#7B3FE4", fontSize: 22, fontWeight: 800, fontFamily: "sans-serif" },
    stripe:      { color: "#635BFF", fontSize: 22, fontWeight: 800, fontFamily: "sans-serif" },
    payu:        { color: "#00B1A5", fontSize: 22, fontWeight: 800, fontFamily: "sans-serif" },
    mercadopago: { color: "#009EE3", fontSize: 18, fontWeight: 800, fontFamily: "sans-serif" },
  };
  return (
    <span style={estilos[pasarela.key] || { fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
      {pasarela.nombre}
    </span>
  );
}

export default function PasarelaCard({
  pasarela, conectada, guardando, exitoGuardado,
  onGuardar, onToggle, onDesconectar,
  vista,
}) {
  const [expandida, setExpandida]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const estaConectada = !!conectada;
  const estaActiva    = conectada?.activo;

  const handleGuardar = (pub, priv) => {
    onGuardar(pub, priv);
    setExpandida(false);
  };

  // ── VISTA GRID ──
  if (vista === "grid") {
    return (
      <div style={{
        ...g.card,
        border: estaConectada ? `2px solid ${pasarela.colorBrand}40` : "1.5px solid #e2e8f0",
        boxShadow: estaConectada ? `0 4px 20px ${pasarela.colorBrand}15` : "0 1px 4px rgba(0,0,0,0.04)",
      }}>

        <div style={g.logoWrap}>
          <Logo pasarela={pasarela} />
        </div>

        <div style={g.body}>
          <div style={g.nameRow}>
            <span style={g.nombre}>{pasarela.nombre}</span>
            {estaConectada && (
              <span style={{
                ...g.estadoBadge,
                backgroundColor: estaActiva ? "#dcfce7" : "#f1f5f9",
                color: estaActiva ? "#16a34a" : "#64748b",
              }}>
                {estaActiva ? "● Conectada" : "○ Pausada"}
              </span>
            )}
          </div>
          <p style={g.desc}>{pasarela.descripcion}</p>
        </div>

        <div style={g.footer}>
          <span style={g.pais}>{pasarela.pais}</span>
        </div>

        <div style={g.actions}>
          {estaConectada ? (
            <div style={g.actionsConectada}>
              <span style={{ ...g.estadoTexto, color: "#16a34a" }}>● Conectada</span>
              <div style={g.accionesBtns}>
                <button onClick={onToggle} style={g.btnSecundario}>
                  {estaActiva ? "Pausar" : "Activar"}
                </button>
                <button onClick={() => setExpandida(v => !v)} style={g.btnSecundario}>
                  {expandida ? "Cancelar" : "Editar"}
                </button>
                {confirmDelete ? (
                  <span style={g.confirmRow}>
                    ¿Seguro?{" "}
                    <button onClick={() => { onDesconectar(); setConfirmDelete(false); }} style={g.btnSi}>Sí</button>
                    {" · "}
                    <button onClick={() => setConfirmDelete(false)} style={g.btnNo}>No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} style={g.btnEliminar}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={g.noConectadaRow}>
              <span style={g.noConectadaTexto}>No conectada</span>
              <button onClick={() => setExpandida(v => !v)} style={g.btnConectar}>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {expandida && (
          <FormularioLlaves
            pasarela={pasarela}
            guardando={guardando}
            exitoGuardado={exitoGuardado}
            onGuardar={handleGuardar}
            onCancelar={() => setExpandida(false)}
            llavePublicaActual={conectada?.llave_publica}
            esEdicion={estaConectada}
          />
        )}
      </div>
    );
  }

  // ── VISTA LISTA ──
  return (
    <div style={{
      ...l.card,
      border: estaConectada ? `1.5px solid ${pasarela.colorBrand}40` : "1.5px solid #e2e8f0",
    }}>
      <div style={l.row}>

        <div style={l.logoWrap}>
          <Logo pasarela={pasarela} />
        </div>

        <div style={l.info}>
          <div style={l.nameRow}>
            <span style={l.nombre}>{pasarela.nombre}</span>
            <span style={l.pais}>{pasarela.pais}</span>
            {estaConectada && (
              <span style={{
                ...l.badge,
                backgroundColor: estaActiva ? "#dcfce7" : "#f1f5f9",
                color: estaActiva ? "#16a34a" : "#64748b",
              }}>
                {estaActiva ? "● Conectada" : "○ Pausada"}
              </span>
            )}
          </div>
          <p style={l.desc}>{pasarela.descripcion}</p>
          <div style={l.metodos}>
            {pasarela.metodos.map(m => (
              <span key={m} style={l.metodo}>{m}</span>
            ))}
          </div>
        </div>

        <div style={l.actions}>
          {estaConectada ? (
            <>
              <button onClick={onToggle} style={l.btnSec}>
                {estaActiva ? "Pausar" : "Activar"}
              </button>
              <button onClick={() => setExpandida(v => !v)} style={l.btnSec}>
                {expandida ? "Cancelar" : "Editar"}
              </button>
              {confirmDelete ? (
                <span style={l.confirmRow}>
                  <button onClick={() => { onDesconectar(); setConfirmDelete(false); }} style={l.btnSi}>Sí</button>
                  <button onClick={() => setConfirmDelete(false)} style={l.btnNo}>No</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelete(true)} style={l.btnEliminar}>
                  <X size={13} />
                </button>
              )}
            </>
          ) : (
            <>
              <span style={l.noConectada}>No conectada</span>
              <button
                onClick={() => setExpandida(v => !v)}
                style={{ ...l.btnConectar, backgroundColor: pasarela.colorBrand, display: "flex", alignItems: "center", gap: 6 }}
              >
                {expandida ? "Cancelar" : <><ArrowRight size={13} /> Conectar</>}
              </button>
            </>
          )}
        </div>
      </div>

      {expandida && (
        <FormularioLlaves
          pasarela={pasarela}
          guardando={guardando}
          exitoGuardado={exitoGuardado}
          onGuardar={handleGuardar}
          onCancelar={() => setExpandida(false)}
          llavePublicaActual={conectada?.llave_publica}
          esEdicion={estaConectada}
        />
      )}
    </div>
  );
}

/* ── Estilos GRID ── */
const g = {
  card:           { backgroundColor: "white", borderRadius: 16, overflow: "hidden", transition: "all 0.2s", display: "flex", flexDirection: "column" },
  logoWrap:       { height: 90, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafbfc", borderBottom: "1px solid #f1f5f9", padding: "0 20px" },
  body:           { padding: "14px 16px 8px" },
  nameRow:        { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  nombre:         { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  estadoBadge:    { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999 },
  desc:           { fontSize: 12, color: "#64748b", lineHeight: 1.6 },
  footer:         { padding: "6px 16px", borderTop: "1px solid #f8fafc" },
  pais:           { fontSize: 12, color: "#94a3b8" },
  actions:        { padding: "10px 16px 14px", marginTop: "auto" },
  actionsConectada: { display: "flex", flexDirection: "column", gap: 6 },
  estadoTexto:    { fontSize: 12, fontWeight: 600 },
  accionesBtns:   { display: "flex", gap: 6, alignItems: "center" },
  btnSecundario:  { padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 11, color: "#64748b", backgroundColor: "white", cursor: "pointer", fontWeight: 500 },
  confirmRow:     { fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 },
  btnSi:          { background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 11 },
  btnNo:          { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11 },
  btnEliminar:    { background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: "auto" },
  noConectadaRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  noConectadaTexto: { fontSize: 12, color: "#94a3b8", fontWeight: 500 },
  btnConectar:    { width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e2e8f0", backgroundColor: "white", fontSize: 14, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
};

/* ── Estilos LISTA ── */
const l = {
  card:        { backgroundColor: "white", borderRadius: 12, overflow: "hidden", transition: "all 0.2s" },
  row:         { display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" },
  logoWrap:    { width: 120, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafbfc", borderRadius: 8, padding: "0 10px" },
  info:        { flex: 1, minWidth: 0 },
  nameRow:     { display: "flex", alignItems: "center", gap: 8, marginBottom: 3 },
  nombre:      { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  pais:        { fontSize: 12, color: "#94a3b8" },
  badge:       { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999 },
  desc:        { fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 6 },
  metodos:     { display: "flex", flexWrap: "wrap", gap: 4 },
  metodo:      { fontSize: 10, backgroundColor: "#f8fafc", color: "#64748b", padding: "2px 8px", borderRadius: 999, border: "1px solid #e2e8f0" },
  actions:     { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  btnSec:      { padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#64748b", backgroundColor: "white", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" },
  confirmRow:  { display: "flex", gap: 4, alignItems: "center" },
  btnSi:       { background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 12 },
  btnNo:       { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 },
  btnEliminar: { background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center" },
  noConectada: { fontSize: 12, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" },
  btnConectar: { padding: "6px 14px", border: "none", borderRadius: 8, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
};
