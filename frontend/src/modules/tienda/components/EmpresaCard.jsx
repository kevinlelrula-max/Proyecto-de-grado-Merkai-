import { useState } from "react";

const PALETA = [
  { acento: "#1D9E75", avBg: "#E1F5EE", avColor: "#0F6E56" }, // teal
  { acento: "#378ADD", avBg: "#E6F1FB", avColor: "#185FA5" }, // blue
  { acento: "#EF9F27", avBg: "#FAEEDA", avColor: "#854F0B" }, // amber
  { acento: "#D85A30", avBg: "#FAECE7", avColor: "#993C1D" }, // coral
  { acento: "#7F77DD", avBg: "#EEEDFE", avColor: "#534AB7" }, // purple
];

function colorPor(id) {
  return PALETA[id % PALETA.length];
}

function iniciales(nombre = "") {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function EmpresaCard({ empresa, onVerCatalogo }) {
  const { id, nombre, nit, telefono, email, logo_url } = empresa;
  const { acento, avBg, avColor } = colorPor(id);
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        ...s.card,
        borderColor: hover
          ? "rgba(0,0,0,0.25)"
          : "var(--color-border-tertiary)",
        transform: hover ? "translateY(-2px)" : "none",
      }}
      onClick={onVerCatalogo}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* franja de color */}
      <div style={{ ...s.acento, background: acento }} />

      {/* avatar o logo */}
      {logo_url ? (
        <img src={logo_url} alt={nombre} style={s.logo} />
      ) : (
        <div style={{ ...s.avatar, background: avBg, color: avColor }}>
          {iniciales(nombre)}
        </div>
      )}

      {/* info */}
      <div style={s.info}>
        <p style={s.nombre}>{nombre}</p>
        <p style={s.meta}>{telefono || email || "Sin contacto"}</p>
        {nit && <span style={s.tagNit}>NIT {nit}</span>}
      </div>

      {/* footer */}
      <div style={s.footer}>
        <span style={s.tagOnline}>Online</span>
        <button
          style={s.btn}
          onClick={(e) => {
            e.stopPropagation();
            onVerCatalogo();
          }}
        >
          Ver catálogo →
        </button>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "var(--color-background-primary, #fff)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: "1.25rem 1.25rem 1rem",
    cursor: "pointer",
    transition: "border-color 0.15s, transform 0.12s",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    position: "relative",
    overflow: "hidden",
  },
  acento: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 3,
  },
  avatar: {
    width: 44, height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  logo: {
    width: 44, height: 44,
    borderRadius: 10,
    objectFit: "cover",
  },
  info: { flex: 1 },
  nombre: {
    fontWeight: 700,
    fontSize: 14,
    color: "var(--color-text-primary)",
    margin: "0 0 3px",
    lineHeight: 1.3,
  },
  meta: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    margin: 0,
  },
  tagNit: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: "var(--color-background-secondary)",
    color: "var(--color-text-secondary)",
    marginTop: 4,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTop: "0.5px solid var(--color-border-tertiary)",
  },
  tagOnline: {
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#E1F5EE",
    color: "#0F6E56",
    fontWeight: 500,
  },
  btn: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: 6,
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.1s",
  },
};
