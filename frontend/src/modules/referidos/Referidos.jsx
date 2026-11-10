import { useState, useEffect, useCallback } from "react";
import { Users, CheckCircle, Clock, TrendingUp, BarChart2, Settings, Zap, Tag, Star, Gift, Truck, CreditCard, Pen } from "lucide-react";
import { getEstadisticasReferidos, getConfigReferidos, guardarConfigReferidos } from "./services/referidosService";
import { SkeletonTable } from "../../components/SkeletonLoader";

const token = () => localStorage.getItem("token");

// ── Colores ───────────────────────────────────────────────────────────────────
const C = { verde: "#00C9A7", azul: "#3B82F6", naranja: "#F59E0B", rojo: "#EF4444", violeta: "#8B5CF6" };

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

const estadoBadge = (estado) => {
  const map = {
    completado: { bg: "#dcfce7", color: "#166534", label: "Completado" },
    registrado: { bg: "#fef9c3", color: "#854d0e", label: "Pendiente" },
    cancelado:  { bg: "#fee2e2", color: "#991b1b", label: "Cancelado" },
  };
  const s = map[estado] || map.registrado;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TAB ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════════════════
function TabEstadisticas() {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    getEstadisticasReferidos(token())
      .then(d => { setData(d); setLoad(false); })
      .catch(() => setLoad(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}><SkeletonTable rows={4} /></div>;
  if (!data)   return <div style={{ padding: 32, color: "#334155", fontSize: 13 }}>Sin datos.</div>;

  const { general, top_referidores, recientes } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Registros totales", value: general.total_registrados, Icon: Users },
          { label: "Completados",       value: general.completados,        Icon: CheckCircle },
          { label: "Pendientes",        value: general.pendientes,         Icon: Clock },
          { label: "Tasa conversión",   value: `${general.tasa_conversion ?? 0}%`, Icon: TrendingUp },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#334155", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
              <span style={{ background: "#eff6ff", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}><k.Icon size={15} /></span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Top referidores */}
        <div style={sCard}>
          <h3 style={sTitle}>Top referidores</h3>
          <p style={sSub}>Clientes que más amigos han traído</p>
          {top_referidores.length === 0 ? (
            <p style={{ color: "#334155", fontSize: 13, marginTop: 12 }}>Sin referidos aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {top_referidores.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 6, background: i === 0 ? "#fef9c3" : "#f8fafc", color: i === 0 ? "#854d0e" : "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{r.nombre} {r.apellido}</div>
                      <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>{r.codigo_referido}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.verde, display: "flex", alignItems: "center", gap: 4 }}>{r.completados} <CheckCircle size={13} /></div>
                    <div style={{ fontSize: 11, color: "#334155" }}>{r.total} total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div style={sCard}>
          <h3 style={sTitle}>Actividad reciente</h3>
          <p style={sSub}>Últimos 20 movimientos</p>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {recientes.length === 0 ? (
              <p style={{ color: "#334155", fontSize: 13 }}>Sin actividad.</p>
            ) : recientes.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{r.referidor}</span>
                  {r.referido && <span style={{ fontSize: 12, color: "#334155" }}> → {r.referido}</span>}
                  <div style={{ fontSize: 11, color: "#334155" }}>{fmtFecha(r.creado_en)}</div>
                </div>
                {estadoBadge(r.estado)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Presets de premios para el referidor ──────────────────────────────────────
// tipo_premio: clave interna para lógica automática
// Los que tienen valor=true requieren número; los demás solo descripción
const PRESETS_PREMIO = [
  { tipo: "descuento_pct",   Icon: Tag,         label: "% Descuento",       needsValor: true,  placeholder: "ej: 5" },
  { tipo: "puntos",          Icon: Star,        label: "Puntos lealtad",    needsValor: true,  placeholder: "ej: 100" },
  { tipo: "producto_gratis", Icon: Gift,        label: "Producto gratis",   needsValor: false, placeholder: "" },
  { tipo: "envio_gratis",    Icon: Truck,       label: "Envío gratis",      needsValor: false, placeholder: "" },
  { tipo: "credito",         Icon: CreditCard,  label: "Crédito en cuenta", needsValor: true,  placeholder: "ej: 10000" },
  { tipo: "personalizado",   Icon: Pen,         label: "Personalizado",     needsValor: false, placeholder: "" },
];

const needsValor = (tipo) => PRESETS_PREMIO.find(p => p.tipo === tipo)?.needsValor ?? false;
const esAutomatico = (tipo) => ["descuento_pct", "puntos", "credito"].includes(tipo);

function EditorPremio({ entry, onChange }) {
  const preset = PRESETS_PREMIO.find(p => p.tipo === entry.tipo_premio);
  const tipoCustom = !PRESETS_PREMIO.find(p => p.tipo === entry.tipo_premio);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Chips de presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {PRESETS_PREMIO.map(p => {
          const activo = entry.tipo_premio === p.tipo;
          return (
            <button key={p.tipo} onClick={() => onChange("tipo_premio", p.tipo)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 20, border: "1.5px solid",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              borderColor: activo ? C.azul : "#e2e8f0",
              background:  activo ? `${C.azul}12` : "#fff",
              color:       activo ? C.azul : "#334155",
              transition:  "all 0.12s",
            }}>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Valor numérico (solo si aplica) */}
      {needsValor(entry.tipo_premio) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number" min="0"
            value={entry.valor ?? ""}
            placeholder={preset?.placeholder || "Valor"}
            onChange={ev => onChange("valor", parseFloat(ev.target.value) || 0)}
            style={{ ...sInput, width: 90 }}
          />
          <span style={{ fontSize: 12, color: "#334155" }}>
            {entry.tipo_premio === "descuento_pct" ? "%" :
             entry.tipo_premio === "puntos"        ? "pts" :
             entry.tipo_premio === "credito"       ? "COP" : ""}
          </span>
        </div>
      )}

      {/* Descripción libre — siempre visible, es el texto que ve el cliente */}
      <input
        type="text"
        value={entry.descripcion || ""}
        placeholder={
          entry.tipo_premio === "descuento_pct"   ? "ej: 5% de descuento en tu próxima compra" :
          entry.tipo_premio === "puntos"           ? "ej: 100 puntos para canjear en tu próxima compra" :
          entry.tipo_premio === "producto_gratis"  ? "ej: 1kg de salmón fresco gratis" :
          entry.tipo_premio === "envio_gratis"     ? "ej: Envío gratis en tu próxima compra" :
          entry.tipo_premio === "credito"          ? "ej: $10.000 de crédito en tu cuenta" :
          "Describe el premio que recibirá el referidor"
        }
        onChange={ev => onChange("descripcion", ev.target.value)}
        style={{ ...sInput, width: "100%", minWidth: 200 }}
      />

      {/* Indicador automático vs manual */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {esAutomatico(entry.tipo_premio) ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: C.verde, fontWeight: 600, background: `${C.verde}15`, padding: "2px 7px", borderRadius: 4 }}>
            <Zap size={9} /> Automático
          </span>
        ) : (
          <span style={{ fontSize: 10, color: "#334155", fontWeight: 600, background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>
            Tú lo gestionas y entregas
          </span>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB CONFIGURACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function TabConfiguracion() {
  const [loading, setLoad]      = useState(true);
  const [guardando, setGuardar] = useState(false);
  const [exito, setExito]       = useState("");
  const [error, setError]       = useState("");

  const [cfgAmigo, setCfgAmigo] = useState([]);
  const [cfgRef,   setCfgRef]   = useState([]);
  const [niveles,  setNiveles]  = useState([]);

  const cargar = useCallback(() => {
    setLoad(true);
    getConfigReferidos(token())
      .then(d => {
        if (d) {
          setNiveles(d.niveles || []);
          const nivelesConNull = [{ id: null, nombre: "Sin nivel", monto_minimo: -1 }, ...(d.niveles || [])];
          setCfgAmigo(nivelesConNull.map(n => {
            const existing = d.config_amigo.find(c => (c.nivel_id ?? null) === (n.id ?? null));
            return existing || {
              nivel_id: n.id, nivel_nombre: n.nombre,
              descuento_pct: n.id === null ? 5 : 10,
              envio_gratis: false, descripcion: "", nivel_heredado_id: null, activo: true,
            };
          }));
          setCfgRef(d.config_referidor.length > 0 ? d.config_referidor : [
            { rango_desde: 1,  rango_hasta: 4,   tipo_premio: "puntos",        valor: 50,   descripcion: "50 puntos de lealtad" },
            { rango_desde: 5,  rango_hasta: 14,  tipo_premio: "descuento_pct", valor: 5,    descripcion: "5% de descuento en tu próxima compra" },
            { rango_desde: 15, rango_hasta: 29,  tipo_premio: "descuento_pct", valor: 10,   descripcion: "10% de descuento en tu próxima compra" },
            { rango_desde: 30, rango_hasta: null, tipo_premio: "personalizado", valor: null, descripcion: "Premio especial, nos pondremos en contacto contigo" },
          ]);
        }
        setLoad(false);
      })
      .catch(() => setLoad(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    setGuardar(true); setError("");
    try {
      const res = await guardarConfigReferidos(token(), { config_amigo: cfgAmigo, config_referidor: cfgRef });
      if (res.ok) { setExito("Configuración guardada"); setTimeout(() => setExito(""), 2500); }
      else setError(res.error || "Error al guardar");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardar(false);
    }
  };

  const updateAmigo = (i, campo, val) =>
    setCfgAmigo(prev => prev.map((e, idx) => idx === i ? { ...e, [campo]: val } : e));

  const updateRef = (i, campo, val) =>
    setCfgRef(prev => prev.map((e, idx) => idx === i ? { ...e, [campo]: val } : e));

  const addFila = () => {
    const ultimo = cfgRef[cfgRef.length - 1];
    const desde  = ultimo ? (ultimo.rango_hasta ?? 30) + 1 : 1;
    setCfgRef(prev => [...prev, { rango_desde: desde, rango_hasta: null, tipo_premio: "personalizado", valor: null, descripcion: "" }]);
  };

  const removeFila = (i) => setCfgRef(prev => prev.filter((_, idx) => idx !== i));

  if (loading) return <div style={{ padding: 24 }}><SkeletonTable rows={4} /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {exito && <div style={{ padding: "10px 16px", background: "#dcfce7", color: "#166534", borderRadius: 9, fontSize: 13, fontWeight: 600 }}>✓ {exito}</div>}
      {error && <div style={{ padding: "10px 16px", background: "#fee2e2", color: "#991b1b", borderRadius: 9, fontSize: 13 }}>{error}</div>}

      {/* TABLA 1: Premio para el amigo */}
      <div style={sCard}>
        <h3 style={sTitle}>Premio para el amigo referido</h3>
        <p style={sSub}>Esto es lo que recibirá tu amigo en su primera compra. El beneficio varía según el nivel de fidelidad de quien lo invitó.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr>
              {["Nivel del referidor", "Descuento %", "Envío gratis", "Nivel heredado (1 mes)", "Beneficio extra (opcional)"].map(h => (
                <th key={h} style={sTh}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cfgAmigo.map((e, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={sTd}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    {e.nivel_id === null ? "Sin nivel" : e.nivel_nombre_real || e.nivel_nombre}
                  </span>
                  {e.nivel_id === null && <span style={{ fontSize: 10, color: "#334155", display: "block" }}>cliente sin nivel</span>}
                </td>
                <td style={sTd}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="number" min="0" max="100" value={e.descuento_pct}
                      onChange={ev => updateAmigo(i, "descuento_pct", parseFloat(ev.target.value))}
                      style={sInput} />
                    <span style={{ fontSize: 13, color: "#334155" }}>%</span>
                  </div>
                </td>
                <td style={sTd}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={e.envio_gratis}
                      onChange={ev => updateAmigo(i, "envio_gratis", ev.target.checked)} />
                    <span style={{ fontSize: 12, color: "#334155" }}>Incluir</span>
                  </label>
                </td>
                <td style={sTd}>
                  <select
                    value={e.nivel_heredado_id ?? ""}
                    onChange={ev => updateAmigo(i, "nivel_heredado_id", ev.target.value ? parseInt(ev.target.value) : null)}
                    style={{ ...sInput, width: 140, cursor: "pointer" }}
                  >
                    <option value="">Sin nivel</option>
                    {niveles.map(n => (
                      <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                    Tu amigo tendrá este nivel durante su primer mes
                  </div>
                </td>
                <td style={sTd}>
                  <input type="text" value={e.descripcion || ""}
                    placeholder="ej: producto de bienvenida, regalo sorpresa..."
                    onChange={ev => updateAmigo(i, "descripcion", ev.target.value)}
                    style={{ ...sInput, width: "100%", minWidth: 200 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TABLA 2: Premio para el referidor */}
      <div style={sCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h3 style={sTitle}>Premio para el referidor</h3>
            <p style={sSub}>Define qué recibes tú por cada amigo que traigas. Puedes personalizarlo según cuántos referidos lleves acumulados.</p>
          </div>
          <button onClick={addFila} style={{ ...sBtnSec, fontSize: 12 }}>+ Añadir nivel</button>
        </div>

        {/* Leyenda automático vs manual */}
        <div style={{ display: "flex", gap: 12, margin: "12px 0", fontSize: 11 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.verde, fontWeight: 600 }}><Zap size={11} /> Automático: el sistema lo aplica sin que hagas nada (descuento, puntos o crédito)</span>
          <span style={{ color: "#334155", fontWeight: 600 }}>Manual: tú lo gestionas y lo entregas directamente (producto, envío o algo personalizado)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {cfgRef.map((e, i) => (
            <div key={i} style={{
              border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px",
              background: "#fafafa", position: "relative",
            }}>
              {/* Eliminar */}
              <button onClick={() => removeFila(i)} style={{
                position: "absolute", top: 12, right: 12,
                background: "none", border: "none", color: "#cbd5e1",
                cursor: "pointer", fontSize: 16, lineHeight: 1,
              }}>✕</button>

              {/* Rango */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", background: "#f1f5f9", padding: "4px 10px", borderRadius: 6 }}>De</span>
                <input type="number" min="1" value={e.rango_desde}
                  onChange={ev => updateRef(i, "rango_desde", parseInt(ev.target.value))}
                  style={{ ...sInput, width: 70 }} />
                <span style={{ fontSize: 12, color: "#334155" }}>a</span>
                <input type="number" min="1" value={e.rango_hasta ?? ""}
                  placeholder="sin límite"
                  onChange={ev => updateRef(i, "rango_hasta", ev.target.value ? parseInt(ev.target.value) : null)}
                  style={{ ...sInput, width: 100 }} />
                <span style={{ fontSize: 12, color: "#334155" }}>referidos acumulados</span>
              </div>

              {/* Editor de premio libre */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
                  Premio
                </span>
                <EditorPremio
                  entry={e}
                  onChange={(campo, val) => updateRef(i, campo, val)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={guardar} disabled={guardando} style={{
          padding: "10px 28px", borderRadius: 10, border: "none",
          backgroundColor: "#2563eb",
          color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          opacity: guardando ? 0.7 : 1,
        }}>
          {guardando ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE RAÍZ
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: "estadisticas", label: "Estadísticas",  Icon: BarChart2 },
  { key: "config",       label: "Configuración", Icon: Settings },
];

export default function Referidos() {
  const [tab, setTab] = useState("estadisticas");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>Sistema de referidos</h2>
        <p style={{ fontSize: 13, color: "#334155", margin: "3px 0 0" }}>
          Cada cliente que refieras recibe una recompensa. El beneficio varía según tu nivel de fidelidad.
        </p>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #f1f5f9" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "10px 20px", border: "none", background: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: tab === t.key ? "#0f172a" : "#334155",
            borderBottom: `2px solid ${tab === t.key ? "#3B82F6" : "transparent"}`,
            marginBottom: -2, transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "estadisticas" && <TabEstadisticas />}
      {tab === "config"       && <TabConfiguracion />}
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const sCard  = { background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: "22px 26px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };
const sTitle = { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 };
const sSub   = { fontSize: 13, color: "#334155", margin: "4px 0 0", lineHeight: 1.5 };
const sTh    = { padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" };
const sTd    = { padding: "12px 14px", fontSize: 13, color: "#334155", verticalAlign: "middle" };
const sInput = { padding: "7px 11px", borderRadius: 8, border: "1.5px solid #e8edf2", fontSize: 13, color: "#0f172a", outline: "none", width: 80, backgroundColor: "white" };
const sBtnSec = { padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13 };
