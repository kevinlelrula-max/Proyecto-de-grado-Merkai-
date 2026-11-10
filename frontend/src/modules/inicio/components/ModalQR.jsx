import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Código QR del enlace público de la tienda (para pósters, redes sociales o el mostrador)
export default function ModalQR({ url, onClose }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let vigente = true;
    QRCode.toString(url, { type: "svg", margin: 1, width: 220, color: { dark: "#0B1628", light: "#ffffff" } })
      .then((s) => { if (vigente) setSvg(s); })
      .catch(() => { if (vigente) setSvg(""); });
    return () => { vigente = false; };
  }, [url]);

  const descargar = (href, nombre) => {
    const a = Object.assign(document.createElement("a"), { href, download: nombre });
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSVG = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    descargar(href, "qr-tienda.svg");
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  // PNG grande (1024 px), mejor para imprimir o subir a redes
  const handlePNG = async () => {
    try {
      const png = await QRCode.toDataURL(url, { margin: 2, width: 1024, color: { dark: "#0B1628", light: "#ffffff" } });
      descargar(png, "qr-tienda.png");
    } catch { /* sin acción */ }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={(e) => e.stopPropagation()}>
        <h3 style={s.title}>QR de tu tienda</h3>
        <p style={s.sub}>Escanéalo con el celular o descárgalo para tus redes y pósters</p>
        <div style={s.qrWrap}>
          {svg ? (
            <div id="qr-tienda" style={s.qr} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div style={s.qrPlaceholder}>Generando…</div>
          )}
        </div>
        <p style={s.urlText}>{url}</p>
        <div style={s.btns}>
          <button style={s.btnDownload} onClick={handlePNG} disabled={!svg}>Descargar PNG</button>
          <button style={s.btnSecundario} onClick={handleSVG} disabled={!svg}>SVG</button>
          <button style={s.btnClose} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9000, padding: 20,
  },
  box: {
    background: "white", borderRadius: 18, padding: "28px 24px",
    maxWidth: 340, width: "100%", textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    display: "flex", flexDirection: "column", gap: 12,
  },
  title:   { fontSize: 18, fontWeight: 800, color: "#0B1628", margin: 0 },
  sub:     { fontSize: 13, color: "#64748b", margin: 0 },
  qrWrap:  { display: "flex", justifyContent: "center", padding: "8px 0" },
  qr:      { width: 220, height: 220, border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
  qrPlaceholder: {
    width: 220, height: 220, background: "#f1f5f9", borderRadius: 12, color: "#94a3b8", fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #cbd5e1",
  },
  urlText: {
    fontSize: 11, color: "#64748b", wordBreak: "break-all", margin: 0,
    background: "#f8fafc", borderRadius: 8, padding: "6px 10px",
  },
  btns:        { display: "flex", gap: 8 },
  btnDownload: {
    flex: 1, padding: "10px", background: "#2563eb", color: "white",
    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  btnSecundario: {
    padding: "10px 14px", background: "white", color: "#2563eb",
    border: "1.5px solid #bfdbfe", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  btnClose: {
    padding: "10px 14px", background: "#f1f5f9", color: "#64748b",
    border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};
