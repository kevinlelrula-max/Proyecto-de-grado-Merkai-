import { useParams, useNavigate } from "react-router-dom";
import { User, Users, ArrowLeft } from "lucide-react";
import { usePerfilCliente } from "./hooks/usePerfilCliente";
import DatosPersonales from "./components/DatosPersonales";
import CambiarContrasena from "./components/CambiarContrasena";
import NivelLealtad from "./components/NivelLealtad";
import SeccionReferido from "../referidos/components/SeccionReferido";
import { useEsMovil } from "../tienda/hooks/useEsMovil";

export default function PerfilCliente() {
  const { empresaSlug: slugParam } = useParams();
  const navigate = useNavigate();
  const esMovil = useEsMovil();
  const empresaSlug = slugParam || localStorage.getItem("ultima_empresa_slug");
  const rutaTienda = empresaSlug ? `/tienda/${empresaSlug}` : "/";

  const ultimaEmpresa = (() => {
    try { return JSON.parse(localStorage.getItem("ultima_empresa") || "null"); }
    catch { return null; }
  })();
  const empresaId = ultimaEmpresa?.id || null;
  const token = localStorage.getItem("cliente_token");

  const {
    perfil, loading, error,
    form, guardando, exitoDatos,
    formPass, guardandoPass, exitoPass, errorPass,
    nivelLealtad,
    handleChange, guardarDatos,
    handleChangePass, cambiarContrasena,
  } = usePerfilCliente(empresaId);

  if (loading) {
    return (
      <div style={s.loading}>
        <div style={s.loadingIconWrap}>
          <User size={28} color="#2563eb" />
        </div>
        <p style={s.loadingText}>Cargando perfil...</p>
      </div>
    );
  }

  const inicialNombre = perfil?.nombre?.charAt(0).toUpperCase() ?? "C";

  return (
    <div style={{ ...s.page, ...(esMovil ? { padding: "20px 16px 40px" } : {}) }}>

      {/* Back button */}
      <button style={s.backBtn} onClick={() => navigate(rutaTienda)}>
        <ArrowLeft size={15} />
        Volver a la tienda
      </button>

      {/* Profile hero */}
      <div style={{ ...s.hero, ...(esMovil ? { flexWrap: "wrap", padding: "18px 16px" } : {}) }}>
        <div style={s.heroLeft}>
          <div style={s.heroAvatar}>{inicialNombre}</div>
          <div>
            <h2 style={s.heroName}>{perfil?.nombre} {perfil?.apellido}</h2>
            <p style={s.heroEmail}>{perfil?.usuario}</p>
          </div>
        </div>
        <div style={s.heroBadge}>
          <User size={13} color="#2563eb" />
          Cliente registrado
        </div>
      </div>

      {/* Two-column content */}
      <div style={{ ...s.grid, ...(esMovil ? { gridTemplateColumns: "minmax(0, 1fr)" } : {}) }}>
        <div style={s.col}>
          <DatosPersonales
            perfil={perfil}
            form={form}
            guardando={guardando}
            exito={exitoDatos}
            error={error}
            onChange={handleChange}
            onGuardar={guardarDatos}
          />
          <CambiarContrasena
            formPass={formPass}
            guardando={guardandoPass}
            exito={exitoPass}
            error={errorPass}
            onChange={handleChangePass}
            onGuardar={cambiarContrasena}
          />
        </div>
        <div style={s.col}>
          <NivelLealtad nivelLealtad={nivelLealtad} />
          <div style={s.referidoCard}>
            <div style={s.referidoHeader}>
              <div style={s.referidoIconWrap}>
                <Users size={16} color="#2563eb" />
              </div>
              <div>
                <h3 style={s.referidoTitle}>Programa de referidos</h3>
                <p style={s.referidoSub}>Invita amigos y gana beneficios</p>
              </div>
            </div>
            <SeccionReferido
              token={token}
              empresaId={empresaId}
              empresaSlug={empresaSlug}
              colorMarca={ultimaEmpresa?.color_primario || "#00C9A7"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "28px 24px 48px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  loading: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "14px",
    padding: "100px 24px",
  },
  loadingIconWrap: {
    width: "64px", height: "64px", borderRadius: "18px",
    backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  loadingText: { fontSize: "14px", color: "#94a3b8" },
  backBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    background: "none", border: "none",
    color: "#64748b", fontSize: "13px", fontWeight: "500",
    cursor: "pointer", padding: "4px 0",
    alignSelf: "flex-start",
  },
  hero: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid #2563eb",
    borderRadius: "16px",
    padding: "24px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  heroLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  heroAvatar: {
    width: "68px", height: "68px",
    borderRadius: "18px",
    backgroundColor: "#2563eb",
    color: "white",
    fontSize: "26px", fontWeight: "800",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    letterSpacing: "-0.02em",
  },
  heroName: {
    fontSize: "22px", fontWeight: "800",
    color: "#0f172a", letterSpacing: "-0.02em",
    marginBottom: "5px",
  },
  heroEmail: { fontSize: "14px", color: "#64748b", margin: 0 },
  heroBadge: {
    display: "flex", alignItems: "center", gap: "6px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "12px", fontWeight: "600",
    padding: "7px 13px",
    borderRadius: "8px",
    flexShrink: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: "20px",
    alignItems: "start",
  },
  col: { display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 },
  referidoCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  referidoHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  referidoIconWrap: {
    width: "38px", height: "38px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  referidoTitle: {
    fontSize: "15px", fontWeight: "700",
    color: "#0f172a", margin: "0 0 2px",
  },
  referidoSub: { fontSize: "12px", color: "#64748b", margin: 0 },
};
