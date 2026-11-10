export default function BtnSoporte() {
  return (
    <a
      href="https://wa.me/573001234567?text=Hola,%20necesito%20ayuda%20con%20Merkai"
      target="_blank"
      rel="noreferrer"
      style={s.btn}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,211,102,0.5)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,0.4)";
      }}
    >
      💬 Soporte
    </a>
  );
}

const s = {
  btn: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "12px 20px",
    backgroundColor: "#25D366",
    color: "white", borderRadius: "999px",
    fontSize: "14px", fontWeight: "700",
    textDecoration: "none",
    position: "fixed", bottom: "28px", right: "28px",
    zIndex: 999,
    boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
};