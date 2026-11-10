export function renderLanding({ tokenResult, frontendUrl }) {
  const configUrl = `${frontendUrl}/configuracion`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Merkai MCP</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{--teal:#00C9A7;--teal-dim:#00967D;--navy:#080f1e;--card:#0e1929;--border:rgba(255,255,255,0.07);--muted:#4e6280}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--navy);color:#cbd5e1;line-height:1.6}
    a{text-decoration:none;color:inherit}
    code,pre,.mono{font-family:'Courier New',Courier,monospace}

    /* NAV */
    nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(8,15,30,0.93);backdrop-filter:blur(12px);z-index:100}
    .nav-left{display:flex;align-items:center;gap:40px}
    .logo{font-size:17px;font-weight:800;color:white;letter-spacing:-0.02em}
    .logo span{color:var(--teal)}
    .nav-links{display:flex;gap:28px}
    .nav-links a{font-size:13px;color:var(--muted);transition:color .15s}
    .nav-links a:hover{color:#cbd5e1}
    .nav-right{display:flex;align-items:center;gap:12px}
    .btn-token{padding:8px 18px;background:white;color:#080f1e;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s}
    .btn-token:hover{background:#e2e8f0}

    /* HERO */
    .hero{max-width:1100px;margin:0 auto;padding:80px 48px 60px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
    .hero-tag{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--teal);background:rgba(0,201,167,0.07);border:1px solid rgba(0,201,167,0.15);padding:5px 14px;border-radius:999px;margin-bottom:20px;letter-spacing:.04em}
    .hero-tag::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .hero h1{font-size:38px;font-weight:800;color:white;letter-spacing:-.03em;line-height:1.15;margin-bottom:16px}
    .hero h1 em{color:var(--teal);font-style:normal}
    .hero p{font-size:15px;color:var(--muted);margin-bottom:28px;line-height:1.7}
    .hero-btns{display:flex;gap:12px;margin-bottom:32px}
    .btn-primary{padding:11px 22px;background:white;color:#080f1e;border-radius:8px;font-size:13px;font-weight:700;transition:background .15s}
    .btn-primary:hover{background:#e2e8f0}
    .btn-secondary{padding:11px 22px;background:rgba(255,255,255,0.04);color:#94a3b8;border:1px solid var(--border);border-radius:8px;font-size:13px;font-weight:600;transition:background .15s}
    .btn-secondary:hover{background:rgba(255,255,255,0.07)}
    .hero-badges{display:flex;gap:20px}
    .badge{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px}
    .badge::before{content:'●';font-size:8px;color:var(--teal-dim)}

    /* TERMINAL */
    .terminal{background:#07111f;border:1px solid var(--border);border-radius:12px;overflow:hidden}
    .term-bar{display:flex;align-items:center;gap:6px;padding:12px 16px;border-bottom:1px solid var(--border);background:rgba(255,255,255,0.02)}
    .dot{width:10px;height:10px;border-radius:50%}
    .term-body{padding:20px}
    .tl{font-size:12px;margin-bottom:7px;line-height:1.5}
    .tc{color:var(--teal)}.tw{color:#e2e8f0}.td{color:var(--muted)}.ts{color:#86efac}

    /* DIVIDER */
    .section-divider{border:none;border-top:1px solid var(--border);margin:0}

    /* TOOLS */
    .section{max-width:1100px;margin:0 auto;padding:64px 48px}
    .section-tag{font-size:15px;font-weight:700;color:var(--muted);margin-bottom:6px}
    .section-title{font-size:22px;font-weight:800;color:white;margin-bottom:8px}
    .section-sub{font-size:13px;color:var(--muted);margin-bottom:36px}
    .tools-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .tool-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px;transition:border-color .15s}
    .tool-card:hover{border-color:rgba(0,201,167,0.3)}
    .tool-name{font-size:13px;font-weight:700;color:white;margin-bottom:4px}
    .tool-desc{font-size:12px;color:var(--muted)}

    /* COMO FUNCIONA */
    .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .how-card{background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden}
    .how-header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
    .how-dots{display:flex;gap:5px}
    .how-dots span{width:8px;height:8px;border-radius:50%}
    .how-label{font-size:11px;color:var(--muted)}
    .how-body{padding:16px}
    .how-q{font-size:12px;color:#94a3b8;margin-bottom:10px;font-style:italic}
    .how-r{font-size:11px;color:var(--muted);line-height:1.7}
    .how-r b{color:#86efac}
    .how-tools{padding:10px 16px;border-top:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap}
    .how-tool{font-size:10px;color:var(--teal);background:rgba(0,201,167,0.08);border:1px solid rgba(0,201,167,0.15);padding:2px 8px;border-radius:4px}

    /* INSTALL */
    .install-wrap{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
    .install-steps{display:flex;flex-direction:column;gap:24px}
    .step{display:flex;gap:16px}
    .step-num{font-size:11px;font-weight:700;color:var(--teal);background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.2);padding:3px 10px;border-radius:4px;flex-shrink:0;margin-top:2px;height:fit-content}
    .step-content h4{font-size:14px;font-weight:700;color:white;margin-bottom:4px}
    .step-content p{font-size:13px;color:var(--muted)}

    /* FORM */
    .form-card{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden}
    .form-head{padding:16px 20px;border-bottom:1px solid var(--border);font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px}
    .form-head::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--teal)}
    .form-body{padding:24px 20px}
    .field{margin-bottom:16px}
    label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:7px;letter-spacing:.05em;text-transform:uppercase}
    input{width:100%;padding:11px 13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:7px;font-size:14px;color:white;outline:none;transition:border-color .15s}
    input::placeholder{color:#1e3050}
    input:focus{border-color:var(--teal)}
    .form-btn{width:100%;padding:12px;background:white;color:#080f1e;border:none;border-radius:7px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s}
    .form-btn:hover{background:#e2e8f0}
    .form-error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#f87171;padding:10px 14px;border-radius:7px;font-size:13px;margin-bottom:16px}

    /* TOKEN RESULT */
    .token-result{display:flex;flex-direction:column;gap:14px}
    .res-label{font-size:11px;font-weight:700;color:var(--teal);letter-spacing:.05em}
    .token-val{font-family:monospace;font-size:10px;color:#64748b;word-break:break-all;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:12px;line-height:1.6}
    .cmd-block{position:relative;background:rgba(0,201,167,0.05);border:1px solid rgba(0,201,167,0.15);border-radius:7px;padding:13px 90px 13px 13px}
    .cmd-text{font-family:monospace;font-size:11px;color:var(--teal);word-break:break-all;line-height:1.6}
    .copy-btn{position:absolute;top:10px;right:10px;background:rgba(0,201,167,0.15);border:1px solid rgba(0,201,167,0.3);color:var(--teal);font-size:11px;font-weight:700;padding:4px 10px;border-radius:5px;cursor:pointer}
    .copy-btn:hover{background:rgba(0,201,167,0.25)}
    .res-note{font-size:11px;color:#334155;text-align:center}

    /* FOOTER */
    footer{border-top:1px solid var(--border);padding:24px 48px;display:flex;justify-content:space-between;align-items:center;max-width:1100px;margin:0 auto}
    .footer-logo{font-size:14px;font-weight:800;color:white}
    .footer-logo span{color:var(--teal)}
    .footer-note{font-size:12px;color:var(--muted)}

    @media(max-width:768px){
      .hero,.install-wrap,.tools-grid,.how-grid{grid-template-columns:1fr}
      nav,.section,footer{padding-left:20px;padding-right:20px}
      .hero{padding:48px 20px 40px}
      .nav-links{display:none}
    }
  </style>
</head>
<body>

<nav>
  <div class="nav-left">
    <div class="logo">Merkai <span>MCP</span></div>
    <div class="nav-links">
      <a href="#herramientas">herramientas</a>
      <a href="#como-funciona">cómo funciona</a>
      <a href="#install">instalación</a>
    </div>
  </div>
  <div class="nav-right">
    <a href="#install" class="btn-token">token →</a>
  </div>
</nav>

<div class="hero">
  <div>
    <div class="hero-tag">./mcp.connect</div>
    <h1>Tu negocio conectado<br/>a un <em>agente AI</em></h1>
    <p>Conecta Merkai con Claude y consulta ventas, inventario y clientes como si le preguntaras a tu mejor analista. Respuestas reales, en segundos.</p>
    <div class="hero-btns">
      <a href="#install" class="btn-primary">obtener_token →</a>
      <a href="#como-funciona" class="btn-secondary">cómo_funciona</a>
    </div>
    <div class="hero-badges">
      <span class="badge">9 herramientas</span>
      <span class="badge">Solo lectura</span>
      <span class="badge">Multi-empresa</span>
    </div>
  </div>
  <div class="terminal">
    <div class="term-bar">
      <div class="dot" style="background:#ff5f57"></div>
      <div class="dot" style="background:#febc2e"></div>
      <div class="dot" style="background:#28c840"></div>
    </div>
    <div class="term-body">
      <div class="tl"><span class="tc">user@merkai ~$</span> <span class="tw">¿Qué productos se van a agotar?</span></div>
      <div class="tl td">→ llamando get_stock_critico...</div>
      <div class="tl ts">⚠ 3 productos críticos:</div>
      <div class="tl td">&nbsp;&nbsp;Trucha entera · 2kg · ~1 día</div>
      <div class="tl td">&nbsp;&nbsp;Filete salmón · 4kg · ~5 días</div>
      <div class="tl td">&nbsp;&nbsp;Camarón tigre · 1kg · reorden ya</div>
      <div class="tl" style="margin-top:12px"><span class="tc">user@merkai ~$</span> <span class="tw">¿Cuánto vendí esta semana vs la anterior?</span></div>
      <div class="tl td">→ llamando get_comparativa...</div>
      <div class="tl ts">↑ 23% en ingresos · ↑ 8% en transacciones</div>
    </div>
  </div>
</div>

<hr class="section-divider"/>

<div class="section" id="herramientas">
  <div class="section-tag">> herramientas</div>
  <div class="section-title">9 herramientas MCP</div>
  <div class="section-sub">Todas de solo lectura. Tus datos nunca se modifican.</div>
  <div class="tools-grid">
    <div class="tool-card"><div class="tool-name">get_resumen_hoy</div><div class="tool-desc">ventas, pedidos pendientes y stock bajo del día</div></div>
    <div class="tool-card"><div class="tool-name">get_pedidos_pendientes</div><div class="tool-desc">lista de pedidos online sin atender con detalle</div></div>
    <div class="tool-card"><div class="tool-name">get_stock_critico</div><div class="tool-desc">productos bajo mínimo con días estimados de agotamiento</div></div>
    <div class="tool-card"><div class="tool-name">buscar_producto</div><div class="tool-desc">stock, precio y promedio diario de un producto</div></div>
    <div class="tool-card"><div class="tool-name">get_ventas_periodo</div><div class="tool-desc">ingresos, transacciones y ticket promedio por rango</div></div>
    <div class="tool-card"><div class="tool-name">get_top_productos</div><div class="tool-desc">productos más vendidos en un período</div></div>
    <div class="tool-card"><div class="tool-name">get_comparativa</div><div class="tool-desc">variación porcentual entre dos períodos</div></div>
    <div class="tool-card"><div class="tool-name">get_clientes_frecuentes</div><div class="tool-desc">clientes con más compras y total acumulado</div></div>
    <div class="tool-card"><div class="tool-name">get_historial_cliente</div><div class="tool-desc">qué compró un cliente, cuándo y cuánto gastó</div></div>
  </div>
</div>

<hr class="section-divider"/>

<div class="section" id="como-funciona">
  <div class="section-tag">> cómo funciona</div>
  <div class="section-title">Así se ve en la práctica</div>
  <div class="section-sub">3 casos reales con datos reales.</div>
  <div class="how-grid">
    <div class="how-card">
      <div class="how-header"><div class="how-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span class="how-label">claude · merkai/mcp</span></div>
      <div class="how-body">
        <div class="how-q">"¿Cuánto vendí esta semana?"</div>
        <div class="how-r"><b>Esta semana:</b> $2.340.000 COP<br/>14 transacciones · ticket prom. $167.000<br/>vs semana anterior: <b>↑ 18%</b></div>
      </div>
      <div class="how-tools"><span class="how-tool">get_ventas_periodo</span><span class="how-tool">get_comparativa</span></div>
    </div>
    <div class="how-card">
      <div class="how-header"><div class="how-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span class="how-label">claude · merkai/mcp</span></div>
      <div class="how-body">
        <div class="how-q">"¿Qué 5 productos vendí más este mes?"</div>
        <div class="how-r">
          <b>1.</b> Trucha entera · 48 kg · $960.000<br/>
          <b>2.</b> Filete salmón · 32 kg · $1.280.000<br/>
          <b>3.</b> Camarón tigre · 18 kg · $720.000<br/>
          +2 más...
        </div>
      </div>
      <div class="how-tools"><span class="how-tool">get_top_productos</span></div>
    </div>
    <div class="how-card">
      <div class="how-header"><div class="how-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span class="how-label">claude · merkai/mcp</span></div>
      <div class="how-body">
        <div class="how-q">"¿Cuáles clientes compraron más de 3 veces?"</div>
        <div class="how-r">
          <b>23 clientes frecuentes</b> (últimos 90 días):<br/>
          1. María G. · 8 compras · $890.000<br/>
          2. Luis R. · 6 compras · $670.000<br/>
          +21 más...
        </div>
      </div>
      <div class="how-tools"><span class="how-tool">get_clientes_frecuentes</span></div>
    </div>
  </div>
</div>

<hr class="section-divider"/>

<div class="section" id="install">
  <div class="section-tag">> instalación</div>
  <div class="section-title">Tres pasos. Cinco minutos.</div>
  <div class="section-sub">Sin conocimientos técnicos requeridos.</div>
  <div class="install-wrap">
    <div class="install-steps">
      <div class="step">
        <span class="step-num">[01]</span>
        <div class="step-content">
          <h4>get_token</h4>
          <p>Inicia sesión con tus credenciales de Merkai. Token de solo lectura, válido 30 días.</p>
        </div>
      </div>
      <div class="step">
        <span class="step-num">[02]</span>
        <div class="step-content">
          <h4>connect_claude</h4>
          <p>Copia el comando generado y pégalo en tu terminal con Claude Code instalado.</p>
        </div>
      </div>
      <div class="step">
        <span class="step-num">[03]</span>
        <div class="step-content">
          <h4>ask_anything</h4>
          <p>Abre Claude y pregunta en lenguaje natural sobre las ventas, stock o clientes de tu negocio.</p>
        </div>
      </div>
    </div>
    <div class="form-card">
      <div class="form-head">./get_token</div>
      <div class="form-body">
        <div style="display:flex;flex-direction:column;gap:16px;text-align:center">
          <p style="font-size:13px;color:var(--muted);line-height:1.7">
            Para generar tu token de conexión,<br/>
            ingresa a tu panel de Merkai.
          </p>
          <a href="${configUrl}" class="form-btn" style="display:block;text-decoration:none;text-align:center">
            Ir a Configuración → Claude AI →
          </a>
          <p style="font-size:11px;color:#1e3050">
            Panel de Merkai · Configuración · Claude AI
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<hr class="section-divider"/>

<footer>
  <div class="footer-logo">Merkai <span>MCP</span> <span style="color:var(--muted);font-weight:400;font-size:12px">v1.0.0</span></div>
  <span class="footer-note">Impulsado por Model Context Protocol · Anthropic</span>
</footer>

</body>
</html>`;
}
