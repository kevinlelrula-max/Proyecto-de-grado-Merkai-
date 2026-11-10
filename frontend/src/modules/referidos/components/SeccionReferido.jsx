import { useEffect, useState } from "react";
import { Trophy, Link2, Users, CheckCircle, Clock, Gift, Lightbulb } from "lucide-react";
import { getMiReferido } from "../services/referidosService";

export default function SeccionReferido({ token, empresaId, empresaSlug, colorMarca = "#00C9A7" }) {
  const [data, setData]       = useState(null);
  const [loading, setLoad]    = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!token || !empresaId) { setLoad(false); return; }
    getMiReferido(token, empresaId)
      .then(d => { setData(d); setLoad(false); })
      .catch(() => setLoad(false));
  }, [token, empresaId]);

  if (!token) return null;
  if (loading) return (
    <div style={{ padding: "20px 0", color: "#334155", fontSize: 13 }}>Cargando referidos...</div>
  );
  if (!data) return null;

  const { codigo, nivel_actual, nivel_heredado, config_amigo_actual, todas_configs, stats, proximo_premio, historial } = data;
  const enlace = `${window.location.origin}/tienda/${empresaSlug}?ref=${codigo}`;

  const copiar = () => {
    navigator.clipboard.writeText(enlace);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const nivelHeredadoAmigo = todas_configs.find(
    c => (c.nivel_id === nivel_actual?.id || (nivel_actual === null && c.nivel_id === null))
  )?.nivel_heredado_nombre ?? null;

  const compartirWhatsApp = () => {
    const heredadoMsg = nivelHeredadoAmigo
      ? ` Además llegarás con nivel ${nivelHeredadoAmigo} durante tu primer mes.`
      : "";
    const msg = encodeURIComponent(
      `¡Te recomiendo esta tienda! Regístrate con mi enlace y obtén ${config_amigo_actual?.descuento_pct ?? 5}% de descuento en tu primera compra.${heredadoMsg} Úsalo aquí: ${enlace}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Tu código + enlace */}
      <div style={{ background: `linear-gradient(135deg, ${colorMarca}18, ${colorMarca}08)`, border: `1px solid ${colorMarca}30`, borderRadius: 14, padding: "20px 22px" }}>

        {/* Badge nivel heredado activo */}
        {nivel_heredado?.activo && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${colorMarca}15`, border: `1px solid ${colorMarca}40`, borderRadius: 9, padding: "8px 14px", marginBottom: 12 }}>
            <Trophy size={16} color={colorMarca} style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: colorMarca }}>
                Tienes nivel heredado activo
              </span>
              <span style={{ fontSize: 11, color: "#334155", display: "block" }}>
                Válido hasta el {new Date(nivel_heredado.hasta).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}. ¡Compra para mantenerlo!
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: `${colorMarca}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Link2 size={18} color={colorMarca} />
          </span>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Tu enlace de referido</h3>
            <p style={{ fontSize: 12, color: "#334155", margin: "2px 0 0" }}>
              Como eres cliente{nivel_actual ? ` ${nivel_actual.nombre}` : ""}, tu amigo recibirá{" "}
              <strong style={{ color: colorMarca }}>{config_amigo_actual?.descuento_pct ?? 5}% de descuento</strong>
              {config_amigo_actual?.envio_gratis && " + envío gratis"}
              {nivelHeredadoAmigo && (
                <> + <strong style={{ color: colorMarca }}>nivel {nivelHeredadoAmigo} por 1 mes</strong></>
              )}
              {" "}en su primera compra.
            </p>
          </div>
        </div>

        {/* Link */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, padding: "9px 14px", fontSize: 12, color: "#475569", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {enlace}
          </div>
          <button onClick={copiar} style={{
            padding: "9px 16px", borderRadius: 9, border: "none",
            background: copiado ? "#dcfce7" : colorMarca,
            color: copiado ? "#166534" : "#fff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
            whiteSpace: "nowrap", transition: "all 0.2s",
          }}>
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>

        {/* Código corto + WhatsApp */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 14px" }}>
            <span style={{ fontSize: 11, color: "#334155" }}>Tu código:</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "monospace", letterSpacing: 2 }}>{codigo}</span>
          </div>
          <button onClick={compartirWhatsApp} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: "#25D366", color: "#fff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartir por WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Amigos referidos", value: stats.total       },
          { label: "Completados",      value: stats.completados },
          { label: "Pendientes",       value: stats.pendientes  },
        ].map(k => (
          <div key={k.label} style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#334155" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Siguiente premio */}
      {proximo_premio && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Gift size={18} color="#d97706" />
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
              Por tu próximo referido exitoso recibirás:
            </div>
            <div style={{ fontSize: 13, color: "#15803d", fontWeight: 500 }}>
              {proximo_premio.descripcion || `${proximo_premio.valor} ${proximo_premio.tipo_premio === "puntos" ? "puntos" : "% de descuento"}`}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de beneficios por nivel */}
      {todas_configs.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
            Cuánto más leal seas, más valioso es tu referido
          </h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Tu nivel", "Tu amigo recibe", "Envío gratis", "Nivel inicial"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#334155", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todas_configs.map((c, i) => {
                const esActual = nivel_actual
                  ? c.nivel_id === nivel_actual.id
                  : c.nivel_id === null;
                return (
                  <tr key={i} style={{
                    borderBottom: "1px solid #f8fafc",
                    background: esActual ? `${colorMarca}08` : "transparent",
                  }}>
                    <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: esActual ? 700 : 400, color: esActual ? colorMarca : "#0f172a" }}>
                      {esActual && "→ "}{c.nivel_id === null ? "Sin nivel" : c.nivel_nombre_real || c.nivel_nombre}
                      {esActual && <span style={{ fontSize: 10, marginLeft: 6, background: `${colorMarca}20`, color: colorMarca, padding: "1px 6px", borderRadius: 4 }}>Tu nivel</span>}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                      {c.descuento_pct}% descuento
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 13, color: c.envio_gratis ? "#15803d" : "#334155" }}>
                      {c.envio_gratis ? "Sí" : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 13 }}>
                      {c.nivel_heredado_nombre
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: colorMarca, fontWeight: 600 }}><Trophy size={11} /> {c.nivel_heredado_nombre}</span>
                        : <span style={{ color: "#334155" }}>—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 20px" }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>Historial de referidos</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {historial.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                    {h.referido_nombre ? `${h.referido_nombre} ${h.referido_apellido || ""}` : "Amigo pendiente de registro"}
                  </span>
                  <div style={{ fontSize: 11, color: "#334155" }}>
                    {new Date(h.creado_en).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: h.estado === "completado" ? "#dcfce7" : "#fef9c3",
                  color:      h.estado === "completado" ? "#166534" : "#854d0e",
                }}>
                  {h.estado === "completado"
                    ? <><CheckCircle size={10} /> Completado</>
                    : <><Clock size={10} /> Pendiente</>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
