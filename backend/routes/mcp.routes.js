import { Router } from "express";
import jwt from "jsonwebtoken";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { generarTokenMcp } from "../controllers/mcp.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import pool from "../config/db.js";
import { registerResumenTools } from "../mcp/tools/resumen.tool.js";
import { registerInventarioTools } from "../mcp/tools/inventario.tool.js";
import { registerVentasTools } from "../mcp/tools/ventas.tool.js";
import { registerClientesTools } from "../mcp/tools/clientes.tool.js";

const router = Router();
const transports = new Map();

// ── GET / — Landing page con formulario de login ──────────────────────────
router.get("/", (req, res) => {
  const mcpUrl = process.env.MCP_URL || "https://merkai-backend.onrender.com/api/mcp/sse";

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Merkai MCP</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#0f172a;line-height:1.6}
    a{text-decoration:none;color:inherit}
    code,pre{font-family:'Courier New',Courier,monospace}

    /* Nav */
    nav{display:flex;align-items:center;justify-content:space-between;padding:16px 48px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;background:white;z-index:100}
    .logo{font-size:17px;font-weight:800;color:#0f172a;letter-spacing:-0.02em}
    .logo span{color:#2563eb}
    .nav-links{display:flex;gap:28px}
    .nav-links a{font-size:13px;color:#64748b;transition:color .15s}
    .nav-links a:hover{color:#0f172a}
    .btn-nav{padding:8px 18px;background:#2563eb;color:white;border-radius:8px;font-size:13px;font-weight:600;transition:background .15s}
    .btn-nav:hover{background:#1d4ed8}

    /* Hero */
    .hero{max-width:1100px;margin:0 auto;padding:72px 48px 60px;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
    .hero-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;padding:4px 12px;border-radius:999px;margin-bottom:18px;font-weight:600}
    .hero-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:#2563eb;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    .hero h1{font-size:36px;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1.18;margin-bottom:14px}
    .hero h1 em{color:#2563eb;font-style:normal}
    .hero p{font-size:15px;color:#64748b;margin-bottom:28px;line-height:1.7;max-width:440px}
    .hero-btns{display:flex;gap:10px;margin-bottom:28px}
    .btn-primary{padding:11px 22px;background:#2563eb;color:white;border-radius:9px;font-size:13px;font-weight:700;transition:background .15s}
    .btn-primary:hover{background:#1d4ed8}
    .btn-secondary{padding:11px 22px;background:white;color:#374151;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13px;font-weight:600;transition:border-color .15s}
    .btn-secondary:hover{border-color:#94a3b8}
    .hero-pills{display:flex;gap:16px;flex-wrap:wrap}
    .pill{font-size:12px;color:#64748b;background:white;border:1px solid #e2e8f0;padding:4px 12px;border-radius:999px}

    /* Terminal demo */
    .terminal{background:#0f172a;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.12)}
    .term-bar{display:flex;align-items:center;gap:6px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03)}
    .dot{width:10px;height:10px;border-radius:50%}
    .term-body{padding:20px}
    .tl{font-size:12px;margin-bottom:7px;line-height:1.5}
    .tc{color:#60a5fa}.tw{color:#e2e8f0}.td{color:#475569}.ts{color:#86efac}

    /* Sections */
    .section-wrap{border-top:1px solid #e2e8f0}
    .section-gray{background:#f8fafc}
    .section-white{background:white}
    .section{max-width:1100px;margin:0 auto;padding:64px 48px}
    .section-label{font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
    .section-title{font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px}
    .section-sub{font-size:14px;color:#64748b;margin-bottom:36px}

    /* Tools grid */
    .tools-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .tool-card{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:18px;transition:box-shadow .15s,border-color .15s}
    .tool-card:hover{box-shadow:0 4px 16px rgba(37,99,235,0.08);border-color:#bfdbfe}
    .tool-icon{width:32px;height:32px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
    .tool-name{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px;font-family:monospace}
    .tool-desc{font-size:12px;color:#64748b;line-height:1.5}

    /* How-it-works */
    .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
    .how-card{background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
    .how-header{padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;background:#f8fafc}
    .how-dots{display:flex;gap:5px}
    .how-dots span{width:8px;height:8px;border-radius:50%}
    .how-label{font-size:11px;color:#94a3b8}
    .how-body{padding:16px}
    .how-q{font-size:12px;color:#2563eb;margin-bottom:10px;font-weight:600;font-style:italic}
    .how-r{font-size:12px;color:#374151;line-height:1.7}
    .how-r b{color:#15803d}
    .how-tools{padding:10px 16px;border-top:1px solid #f1f5f9;display:flex;gap:6px;flex-wrap:wrap}
    .how-tool{font-size:10px;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;padding:2px 8px;border-radius:4px;font-family:monospace}

    /* Install */
    .install-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:0}
    .form-card{background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
    .form-head{padding:16px 20px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#0f172a;display:flex;align-items:center;justify-content:space-between}
    .form-head-badge{font-size:10px;font-weight:600;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;padding:2px 8px;border-radius:999px}
    .form-head-sub{font-size:11px;font-weight:400;color:#94a3b8}
    .form-body{padding:20px}
    .field{margin-bottom:14px}
    .f-label{display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}
    input[type=email],input[type=password]{width:100%;padding:10px 13px;background:white;border:1.5px solid #e2e8f0;border-radius:9px;font-size:14px;color:#0f172a;outline:none;transition:border-color .15s}
    input:focus{border-color:#2563eb}
    input::placeholder{color:#cbd5e1}
    .step-list{display:flex;flex-direction:column;gap:12px;margin-bottom:20px}
    .step-item{display:flex;gap:12px;align-items:flex-start}
    .step-num{width:22px;height:22px;border-radius:50%;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
    .step-txt{font-size:13px;color:#374151;line-height:1.55}
    .step-txt b{color:#0f172a}
    .form-btn{width:100%;padding:11px;background:#2563eb;color:white;border:none;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s}
    .form-btn:hover{background:#1d4ed8}
    .form-btn:disabled{opacity:.5;cursor:not-allowed}
    .form-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 13px;border-radius:8px;font-size:13px;margin-bottom:14px}
    .token-result{display:flex;flex-direction:column;gap:14px}
    .res-label{font-size:10px;font-weight:700;color:#64748b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
    .token-val{font-family:monospace;font-size:10px;color:#64748b;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;line-height:1.6}
    .cmd-block{position:relative;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:9px;padding:12px 80px 12px 14px}
    .cmd-text{font-family:monospace;font-size:11px;color:#1d4ed8;word-break:break-all;line-height:1.6}
    .copy-btn{position:absolute;top:10px;right:10px;background:white;border:1px solid #bfdbfe;color:#2563eb;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;cursor:pointer}
    .copy-btn:hover{background:#eff6ff}
    .res-note{font-size:11px;color:#94a3b8;text-align:center}

    /* Footer */
    footer{border-top:1px solid #e2e8f0;padding:24px 48px;display:flex;justify-content:space-between;align-items:center;max-width:1100px;margin:0 auto}
    .footer-logo{font-size:14px;font-weight:800;color:#0f172a}
    .footer-logo span{color:#2563eb}
    .footer-note{font-size:12px;color:#94a3b8}

    @media(max-width:768px){
      .hero,.install-grid,.tools-grid,.how-grid{grid-template-columns:1fr}
      nav,.section,footer{padding-left:20px;padding-right:20px}
      .hero{padding:48px 20px 40px}
      .nav-links{display:none}
    }
  </style>
</head>
<body>

<!-- Nav -->
<nav>
  <div class="logo">Merkai <span>MCP</span></div>
  <div class="nav-links">
    <a href="#herramientas">Herramientas</a>
    <a href="#como-funciona">Cómo funciona</a>
    <a href="#install">Instalación</a>
  </div>
  <a href="#install" class="btn-nav">Obtener token</a>
</nav>

<!-- Hero -->
<div class="hero">
  <div>
    <div class="hero-badge">Conector activo</div>
    <h1>Tu negocio conectado<br/>a un <em>agente AI</em></h1>
    <p>Consulta ventas, inventario y clientes con lenguaje natural. Como tener un analista disponible las 24 horas.</p>
    <div class="hero-btns">
      <a href="#install" class="btn-primary">Obtener token</a>
      <a href="#como-funciona" class="btn-secondary">Cómo funciona</a>
    </div>
    <div class="hero-pills">
      <span class="pill">9 herramientas</span>
      <span class="pill">Solo lectura</span>
      <span class="pill">Multi-empresa</span>
    </div>
  </div>
  <div class="terminal">
    <div class="term-bar">
      <div class="dot" style="background:#ff5f57"></div>
      <div class="dot" style="background:#febc2e"></div>
      <div class="dot" style="background:#28c840"></div>
    </div>
    <div class="term-body">
      <div class="tl"><span class="tc">merkai ~$</span> <span class="tw">¿Qué productos se van a agotar?</span></div>
      <div class="tl td">consultando get_stock_critico...</div>
      <div class="tl ts">3 productos bajo mínimo:</div>
      <div class="tl td">&nbsp;&nbsp;Trucha entera · 2 kg · ~1 día</div>
      <div class="tl td">&nbsp;&nbsp;Filete salmón · 4 kg · ~5 días</div>
      <div class="tl td">&nbsp;&nbsp;Camarón tigre · 1 kg · reorden urgente</div>
      <div class="tl" style="margin-top:12px"><span class="tc">merkai ~$</span> <span class="tw">¿Cuánto vendí esta semana?</span></div>
      <div class="tl td">consultando get_comparativa...</div>
      <div class="tl ts">+23% en ingresos · +8% en transacciones</div>
    </div>
  </div>
</div>

<!-- Herramientas -->
<div class="section-wrap section-gray">
  <div class="section" id="herramientas">
    <div class="section-label">Herramientas</div>
    <div class="section-title">9 herramientas disponibles</div>
    <div class="section-sub">Todas de solo lectura — tus datos nunca se modifican.</div>
    <div class="tools-grid">
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h8M8 16h5"/></svg></div>
        <div class="tool-name">get_resumen_hoy</div><div class="tool-desc">Ventas, pedidos pendientes y stock bajo del día</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div>
        <div class="tool-name">get_pedidos_pendientes</div><div class="tool-desc">Lista de pedidos online sin atender con detalle</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <div class="tool-name">get_stock_critico</div><div class="tool-desc">Productos bajo mínimo con días estimados de agotamiento</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        <div class="tool-name">buscar_producto</div><div class="tool-desc">Stock, precio y promedio diario de un producto</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
        <div class="tool-name">get_ventas_periodo</div><div class="tool-desc">Ingresos, transacciones y ticket promedio por rango</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
        <div class="tool-name">get_top_productos</div><div class="tool-desc">Productos más vendidos en un período</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div class="tool-name">get_comparativa</div><div class="tool-desc">Variación porcentual entre dos períodos</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
        <div class="tool-name">get_clientes_frecuentes</div><div class="tool-desc">Clientes con más compras y total acumulado</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        <div class="tool-name">get_historial_cliente</div><div class="tool-desc">Qué compró un cliente, cuándo y cuánto gastó</div>
      </div>
    </div>
  </div>
</div>

<!-- Cómo funciona -->
<div class="section-wrap section-white">
  <div class="section" id="como-funciona">
    <div class="section-label">Cómo funciona</div>
    <div class="section-title">Así se ve en la práctica</div>
    <div class="section-sub">Tres casos reales con respuestas reales.</div>
    <div class="how-grid">
      <div class="how-card">
        <div class="how-header"><div class="how-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span class="how-label">Claude — Merkai MCP</span></div>
        <div class="how-body">
          <div class="how-q">"¿Cuánto vendí esta semana?"</div>
          <div class="how-r"><b>Esta semana:</b> $2.340.000 COP<br/>14 transacciones · ticket prom. $167.000<br/>vs semana anterior: <b>+18%</b></div>
        </div>
        <div class="how-tools"><span class="how-tool">get_ventas_periodo</span><span class="how-tool">get_comparativa</span></div>
      </div>
      <div class="how-card">
        <div class="how-header"><div class="how-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span class="how-label">Claude — Merkai MCP</span></div>
        <div class="how-body">
          <div class="how-q">"¿Qué 5 productos vendí más este mes?"</div>
          <div class="how-r"><b>1.</b> Trucha entera · 48 kg · $960.000<br/><b>2.</b> Filete salmón · 32 kg · $1.280.000<br/><b>3.</b> Camarón tigre · 18 kg · $720.000<br/>+2 más...</div>
        </div>
        <div class="how-tools"><span class="how-tool">get_top_productos</span></div>
      </div>
      <div class="how-card">
        <div class="how-header"><div class="how-dots"><span style="background:#ff5f57"></span><span style="background:#febc2e"></span><span style="background:#28c840"></span></div><span class="how-label">Claude — Merkai MCP</span></div>
        <div class="how-body">
          <div class="how-q">"¿Cuáles clientes compraron más de 3 veces?"</div>
          <div class="how-r"><b>23 clientes frecuentes</b> (últimos 90 días):<br/>1. María G. · 8 compras · $890.000<br/>2. Luis R. · 6 compras · $670.000<br/>+21 más...</div>
        </div>
        <div class="how-tools"><span class="how-tool">get_clientes_frecuentes</span></div>
      </div>
    </div>
  </div>
</div>

<!-- Instalación -->
<div class="section-wrap section-gray">
  <div class="section" id="install">
    <div class="section-label">Instalación</div>
    <div class="section-title">Elige cómo conectarte</div>
    <div class="section-sub">Dos opciones. Ninguna requiere conocimientos técnicos.</div>
    <div class="install-grid">

      <!-- Claude.ai -->
      <div class="form-card">
        <div class="form-head">
          <span>Claude.ai <span class="form-head-badge">Recomendado</span></span>
          <span class="form-head-sub">Web · sin instalación</span>
        </div>
        <div class="form-body" style="display:flex;flex-direction:column;gap:16px">
          <p style="font-size:13px;color:#64748b;line-height:1.6">Funciona directamente en <b style="color:#0f172a">claude.ai</b>. Sin copiar tokens — OAuth maneja la autorización automáticamente.</p>
          <div>
            <div class="res-label">URL del servidor MCP</div>
            <div class="cmd-block">
              <div class="cmd-text" id="mcp-url">${mcpUrl}</div>
              <button class="copy-btn" onclick="copyUrl()">Copiar</button>
            </div>
          </div>
          <div class="step-list">
            <div class="step-item"><span class="step-num">1</span><span class="step-txt">Abre <b>claude.ai</b> → Settings → Conectores → Agregar</span></div>
            <div class="step-item"><span class="step-num">2</span><span class="step-txt">Pega la URL de arriba y haz clic en <b>Agregar</b></span></div>
            <div class="step-item"><span class="step-num">3</span><span class="step-txt">Inicia sesión con tus credenciales de Merkai y listo</span></div>
          </div>
        </div>
      </div>

      <!-- Claude Code terminal -->
      <div class="form-card">
        <div class="form-head">
          <span>Claude Code</span>
          <span class="form-head-sub">Terminal interactivo</span>
        </div>
        <div class="form-body" style="display:flex;flex-direction:column;gap:16px">
          <p style="font-size:13px;color:#64748b;line-height:1.6">Requiere <b style="color:#0f172a">Claude Code</b> instalado en tu computadora.</p>
          <div class="step-list">
            <div class="step-item"><span class="step-num">1</span><span class="step-txt">Inicia sesión con tus credenciales de Merkai en el formulario de abajo</span></div>
            <div class="step-item"><span class="step-num">2</span><span class="step-txt">Copia el comando generado</span></div>
            <div class="step-item"><span class="step-num">3</span><span class="step-txt">Abre una terminal → ejecuta <code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:12px;color:#2563eb">claude</code> → pega el comando</span></div>
            <div class="step-item"><span class="step-num">4</span><span class="step-txt">Pregunta en lenguaje natural</span></div>
          </div>
          <div style="border-top:1px solid #f1f5f9;padding-top:16px">
            <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:14px">Generar token</p>
            <form id="lf" onsubmit="return false" style="display:flex;flex-direction:column;gap:0">
              <div class="field"><label class="f-label">Correo electrónico</label><input type="email" id="em" placeholder="tu@email.com" autocomplete="email" required/></div>
              <div class="field" style="margin-bottom:16px"><label class="f-label">Contraseña</label><input type="password" id="pw" placeholder="••••••••" autocomplete="current-password" required/></div>
              <button onclick="doLogin()" class="form-btn" id="sb">Generar token</button>
            </form>
          </div>
          <div id="tr" class="token-result" style="display:none"></div>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- Footer -->
<div style="background:white;border-top:1px solid #e2e8f0">
  <footer>
    <div class="footer-logo">Merkai <span>MCP</span> <span style="color:#94a3b8;font-weight:400;font-size:12px;margin-left:4px">v1.0.0</span></div>
    <span class="footer-note">Impulsado por Model Context Protocol &middot; Anthropic</span>
  </footer>
</div>

<script>
var MCP_URL = '${mcpUrl}';
async function doLogin() {
  var btn = document.getElementById('sb');
  var ed = document.getElementById('ed');
  if (ed) ed.remove();
  btn.textContent = 'Conectando...';
  btn.disabled = true;
  var email = document.getElementById('em').value;
  var pass = document.getElementById('pw').value;
  try {
    var lr = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({usuario: email, contrasena: pass})
    });
    var ld = await lr.json();
    if (!lr.ok) throw new Error(ld.message || ld.error || 'Credenciales incorrectas');
    var mr = await fetch('/api/mcp/generar-token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ld.token}
    });
    var md = await mr.json();
    if (!mr.ok) throw new Error(md.error || 'Error al generar token MCP');
    var tk = md.token;
    var cmd = 'claude mcp add merkai --transport sse --header "Authorization: Bearer ' + tk + '" ' + MCP_URL;
    document.getElementById('lf').parentElement.style.display = 'none';
    var tr = document.getElementById('tr');
    tr.style.display = 'flex';
    tr.innerHTML =
      '<div><div class="res-label">Token MCP</div><div class="token-val" id="tkv">' + tk + '</div></div>' +
      '<div><div class="res-label">Comando para Claude Code</div>' +
        '<div class="cmd-block">' +
          '<div class="cmd-text" id="cd">' + cmd + '</div>' +
          '<button class="copy-btn" onclick="copyCmd()">Copiar</button>' +
        '</div>' +
      '</div>' +
      '<div class="res-note">Token v&aacute;lido 30 d&iacute;as &middot; Solo lectura &middot; Multi-empresa</div>';
  } catch(err) {
    btn.textContent = 'Generar token';
    btn.disabled = false;
    var div = document.createElement('div');
    div.id = 'ed';
    div.className = 'form-error';
    div.textContent = err.message;
    document.getElementById('lf').prepend(div);
  }
}
function copyCmd() {
  var txt = document.getElementById('cd').textContent;
  navigator.clipboard.writeText(txt).then(function() {
    var btn = document.querySelector('#tr .copy-btn');
    btn.textContent = 'Copiado';
    setTimeout(function() { btn.textContent = 'Copiar'; }, 1500);
  });
}
function copyUrl() {
  var txt = document.getElementById('mcp-url').textContent;
  navigator.clipboard.writeText(txt).then(function() {
    var btn = document.querySelector('.cmd-block .copy-btn');
    if (btn) { btn.textContent = 'Copiado'; setTimeout(function() { btn.textContent = 'Copiar'; }, 1500); }
  });
}
</script>
</body>
</html>`);
});

// ── GET /sse — Claude se conecta aquí ────────────────────────────────────
router.get("/sse", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ||
    req.query.token ||
    null;

  if (!token) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="Merkai MCP"');
    return res.status(401).json({ error: "Token requerido" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.setHeader("WWW-Authenticate", 'Bearer realm="Merkai MCP", error="invalid_token"');
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  const empresa_id = decoded.empresa_id;
  if (!empresa_id) return res.status(403).json({ error: "Token sin empresa asociada" });

  const mcpServer = new McpServer({ name: "merkai", version: "1.0.0" });

  registerResumenTools(mcpServer, pool, empresa_id);
  registerInventarioTools(mcpServer, pool, empresa_id);
  registerVentasTools(mcpServer, pool, empresa_id);
  registerClientesTools(mcpServer, pool, empresa_id);

  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const transport = new SSEServerTransport("/api/mcp/messages", res);
  transports.set(transport.sessionId, transport);

  const heartbeat = setInterval(() => {
    try {
      if (!res.writableEnded) {
        res.write(": ping\n\n");
      } else {
        clearInterval(heartbeat);
      }
    } catch {
      clearInterval(heartbeat);
    }
  }, 10000);

  transport.onclose = () => {
    clearInterval(heartbeat);
    transports.delete(transport.sessionId);
  };

  await mcpServer.connect(transport);
});

// ── POST /messages — mensajes entrantes de Claude ────────────────────────
router.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  console.log("[MCP] POST /messages sessionId:", sessionId, "found:", !!transport);

  if (!transport) return res.status(404).json({ error: "Sesión no encontrada" });

  await transport.handlePostMessage(req, res, req.body);
});

// ── POST /generar-token — genera token MCP para el usuario ───────────────
router.post("/generar-token", verificarToken, generarTokenMcp);

export default router;
