import { useState } from "react";
import { Key, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function FormularioLlaves({ pasarela, guardando, exitoGuardado, onGuardar, onCancelar, llavePublicaActual, esEdicion }) {
  const [llavePublica, setLlavePublica] = useState(llavePublicaActual || "");
  const [llavePrivada, setLlavePrivada] = useState("");
  const [showPrivada, setShowPrivada]   = useState(false);

  const puedeGuardar = llavePublica.trim() && (esEdicion || llavePrivada.trim()) && !guardando;

  const handleGuardar = () => {
    if (!puedeGuardar) return;
    onGuardar(llavePublica.trim(), llavePrivada.trim());
    setLlavePublica("");
    setLlavePrivada("");
  };

  return (
    <div style={s.wrap}>

      {/* Aviso docs */}
      <div style={s.docsBox}>
        <span style={{ flexShrink: 0, color: "#92400e" }}>
          <Key size={15} />
        </span>
        <div>
          <p style={s.docsTitle}>¿Dónde encuentro mis llaves?</p>
          <p style={s.docsSub}>
            Ve al panel de {pasarela.nombre} →{" "}
            <a href={pasarela.docs} target="_blank" rel="noreferrer" style={s.docsLink}>
              Ver documentación ↗
            </a>
          </p>
        </div>
      </div>

      {/* Campos */}
      <div style={s.fields}>
        <div>
          <label style={s.label}>{pasarela.camposLlave.publica.label}</label>
          <input
            type="text"
            value={llavePublica}
            onChange={e => setLlavePublica(e.target.value)}
            placeholder={pasarela.camposLlave.publica.placeholder}
            style={s.input}
            autoComplete="off"
          />
        </div>
        <div>
          <label style={s.label}>
            {pasarela.camposLlave.privada.label}
            <span style={s.labelNote}> (se guarda encriptada)</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPrivada ? "text" : "password"}
              value={llavePrivada}
              onChange={e => setLlavePrivada(e.target.value)}
              placeholder={esEdicion ? "Dejar vacío para mantener la actual" : pasarela.camposLlave.privada.placeholder}
              style={{ ...s.input, paddingRight: 40 }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPrivada(v => !v)}
              style={s.eyeBtn}
            >
              {showPrivada ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={s.btnRow}>
        <button onClick={onCancelar} style={s.btnCancel}>Cancelar</button>
        <button
          onClick={handleGuardar}
          disabled={!puedeGuardar}
          style={{
            ...s.btnSave,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            backgroundColor: exitoGuardado ? "#10b981"
              : !puedeGuardar ? "#e2e8f0"
              : pasarela.colorBrand,
            color: !puedeGuardar ? "#94a3b8" : "white",
            cursor: !puedeGuardar ? "not-allowed" : "pointer",
          }}
        >
          {exitoGuardado && <CheckCircle size={13} />}
          {exitoGuardado ? "Guardado" : guardando ? "Guardando..." : esEdicion ? `Actualizar ${pasarela.nombre}` : `Conectar ${pasarela.nombre}`}
        </button>
      </div>

      <p style={s.sandboxNote}>Usa llaves de sandbox para testear sin cobros reales</p>
    </div>
  );
}

const s = {
  wrap:      { padding: "16px 20px 20px", borderTop: "1px solid #f1f5f9", backgroundColor: "#fafbfc" },
  docsBox:   { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 14 },
  docsTitle: { fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 2 },
  docsSub:   { fontSize: 12, color: "#b45309" },
  docsLink:  { color: "#b45309", fontWeight: 600 },
  fields:    { display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 },
  label:     { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 },
  labelNote: { fontSize: 10, fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0 },
  input:     { width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#0f172a", fontFamily: "monospace", backgroundColor: "white", outline: "none", boxSizing: "border-box" },
  eyeBtn:    { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" },
  btnRow:    { display: "flex", gap: 8 },
  btnCancel: { padding: "9px 16px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#64748b", backgroundColor: "white", cursor: "pointer", fontWeight: 500 },
  btnSave:   { flex: 1, padding: "9px 16px", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, transition: "all 0.2s" },
  sandboxNote: { textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 10 },
};
