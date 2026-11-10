import { useState, useEffect } from "react";
import Estrellas from "./Estrellas";
import { getReseñasProducto, getMiReseña, crearReseña } from "../services/reseñasService";

export default function ModalReseñas({ producto, colorMarca = "#0F6E56", onCerrar }) {
  const [data,       setData]       = useState({ reseñas: [], stats: null });
  const [miReseña,   setMiReseña]   = useState(null);
  const [calificacion, setCalif]    = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading,    setLoading]    = useState(true);
  const [enviando,   setEnviando]   = useState(false);
  const [exito,      setExito]      = useState(false);
  const [error,      setError]      = useState("");

  const token         = localStorage.getItem("cliente_token");
  const estaLogueado  = !!token;

  useEffect(() => {
    cargar();
  }, [producto.id]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [res, mi] = await Promise.all([
        getReseñasProducto(producto.id),
        estaLogueado ? getMiReseña(producto.id, token) : Promise.resolve(null),
      ]);
      setData(res);
      if (mi) {
        setMiReseña(mi);
        setCalif(mi.calificacion);
        setComentario(mi.comentario || "");
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleEnviar = async () => {
    if (!calificacion) return setError("Selecciona una calificación");
    setEnviando(true);
    setError("");
    try {
      await crearReseña({ producto_id: producto.id, calificacion, comentario }, token);
      setExito(true);
      await cargar();
      setTimeout(() => setExito(false), 3000);
    } catch (e) {
      setError(e.response?.data?.error || "Error al enviar reseña");
    } finally {
      setEnviando(false);
    }
  };

  const stats = data.stats;
  const totalReseñas = Number(stats?.total || 0);
  const promedio = parseFloat(stats?.promedio || 0);

  return (
    <div style={s.overlay} onClick={onCerrar}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h3 style={s.titulo}>Reseñas de clientes</h3>
            <p style={s.productoNombre}>{producto.nombre}</p>
          </div>
          <button style={s.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {loading ? (
          <div style={s.loadingWrap}>Cargando reseñas...</div>
        ) : (
          <div style={s.body}>

            {/* Stats generales */}
            {totalReseñas > 0 && (
              <div style={s.statsWrap}>
                <div style={s.promedioWrap}>
                  <span style={{ ...s.promedioNum, color: colorMarca }}>
                    {promedio.toFixed(1)}
                  </span>
                  <Estrellas valor={Math.round(promedio)} tamaño="lg" color={colorMarca} />
                  <span style={s.totalLabel}>{totalReseñas} reseña{totalReseñas !== 1 ? "s" : ""}</span>
                </div>
                <div style={s.barrasWrap}>
                  {[5, 4, 3, 2, 1].map(n => {
                    const count = Number(stats?.[["", "uno","dos","tres","cuatro","cinco"][n]] || 0);
                    const pct   = totalReseñas > 0 ? (count / totalReseñas) * 100 : 0;
                    return (
                      <div key={n} style={s.barRow}>
                        <span style={s.barLabel}>{n}★</span>
                        <div style={s.barBg}>
                          <div style={{ ...s.barFill, width: `${pct}%`, backgroundColor: colorMarca }} />
                        </div>
                        <span style={s.barCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulario */}
            {estaLogueado ? (
              <div style={s.formWrap}>
                <h4 style={s.formTitulo}>
                  {miReseña ? "Editar tu reseña" : "Escribe una reseña"}
                </h4>
                <div style={s.califWrap}>
                  <span style={s.califLabel}>Tu calificación:</span>
                  <Estrellas valor={calificacion} onChange={setCalif} tamaño="lg" color={colorMarca} />
                </div>
                <textarea
                  style={s.textarea}
                  placeholder="¿Qué te pareció el producto? (opcional)"
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {comentario.length}/500
                  </span>
                  {exito && <span style={{ fontSize: "13px", color: colorMarca, fontWeight: 600 }}>✓ Reseña guardada</span>}
                </div>
                {error && <div style={s.errorBox}>{error}</div>}
                <button
                  style={{ ...s.btnEnviar, backgroundColor: colorMarca, opacity: enviando ? 0.7 : 1 }}
                  onClick={handleEnviar}
                  disabled={enviando}
                >
                  {enviando ? "Guardando..." : miReseña ? "Actualizar reseña" : "Publicar reseña"}
                </button>
              </div>
            ) : (
              <div style={s.loginHint}>
                <span>💬</span>
                <p>Inicia sesión para dejar tu reseña</p>
              </div>
            )}

            {/* Lista de reseñas */}
            {data.reseñas.length > 0 ? (
              <div style={s.lista}>
                <h4 style={s.listaTitulo}>
                  Opiniones ({data.reseñas.length})
                </h4>
                {data.reseñas.map(r => (
                  <div key={r.id} style={s.reseñaCard}>
                    <div style={s.reseñaTop}>
                      <div style={s.avatarWrap}>
                        <div style={{ ...s.avatar, backgroundColor: colorMarca }}>
                          {r.cliente_nombre?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <span style={s.clienteNombre}>{r.cliente_nombre}</span>
                          <span style={s.fechaReseña}>
                            {new Date(r.creado_en).toLocaleDateString("es-CO", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                      <Estrellas valor={r.calificacion} tamaño="sm" color={colorMarca} />
                    </div>
                    {r.comentario && (
                      <p style={s.comentario}>{r.comentario}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !estaLogueado && (
                <div style={s.sinReseñas}>
                  <span style={{ fontSize: "32px" }}>⭐</span>
                  <p>Sé el primero en reseñar este producto</p>
                </div>
              )
            )}

          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay:       { position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(4px)" },
  modal:         { backgroundColor: "white", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" },
  header:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" },
  titulo:        { fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 },
  productoNombre:{ fontSize: "13px", color: "#64748b", marginTop: "2px" },
  cerrarBtn:     { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8", padding: "4px" },
  body:          { overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" },
  loadingWrap:   { padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" },

  // Stats
  statsWrap:     { display: "flex", gap: "20px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" },
  promedioWrap:  { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "80px" },
  promedioNum:   { fontSize: "36px", fontWeight: "800", lineHeight: 1 },
  totalLabel:    { fontSize: "11px", color: "#94a3b8", textAlign: "center" },
  barrasWrap:    { flex: 1, display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center" },
  barRow:        { display: "flex", alignItems: "center", gap: "8px" },
  barLabel:      { fontSize: "11px", color: "#64748b", width: "20px", textAlign: "right", flexShrink: 0 },
  barBg:         { flex: 1, height: "6px", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" },
  barFill:       { height: "100%", borderRadius: "999px", transition: "width 0.3s" },
  barCount:      { fontSize: "11px", color: "#94a3b8", width: "16px", flexShrink: 0 },

  // Formulario
  formWrap:      { display: "flex", flexDirection: "column", gap: "12px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" },
  formTitulo:    { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: 0 },
  califWrap:     { display: "flex", alignItems: "center", gap: "10px" },
  califLabel:    { fontSize: "13px", color: "#64748b" },
  textarea:      { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", color: "#0f172a", resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  errorBox:      { padding: "8px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "12px", color: "#b91c1c" },
  btnEnviar:     { padding: "11px", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  loginHint:     { display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b" },

  // Lista
  lista:         { display: "flex", flexDirection: "column", gap: "12px" },
  listaTitulo:   { fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" },
  reseñaCard:    { padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" },
  reseñaTop:     { display: "flex", justifyContent: "space-between", alignItems: "center" },
  avatarWrap:    { display: "flex", alignItems: "center", gap: "10px" },
  avatar:        { width: "32px", height: "32px", borderRadius: "50%", color: "white", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  clienteNombre: { display: "block", fontSize: "13px", fontWeight: "600", color: "#0f172a" },
  fechaReseña:   { display: "block", fontSize: "11px", color: "#94a3b8" },
  comentario:    { fontSize: "13px", color: "#374151", lineHeight: "1.6", margin: 0 },

  sinReseñas:    { textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" },
};
