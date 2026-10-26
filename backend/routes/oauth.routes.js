import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const router = Router();

// Códigos temporales: code -> { userId, empresaId, rolId, codeChallenge, redirectUri, expiresAt }
const authCodes = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes) {
    if (data.expiresAt < now) authCodes.delete(code);
  }
}, 5 * 60 * 1000);

function loginPage(params, error = null) {
  const safe = (v) =>
    String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Merkai — Conectar con Claude</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:radial-gradient(900px 500px at 50% -10%,rgba(0,201,167,0.14),transparent 60%),#080f1e;color:#cbd5e1;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .card{background:#0e1929;border:1px solid rgba(255,255,255,0.08);border-radius:16px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.45)}
    .head{padding:28px 28px 22px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07)}
    .link{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:18px}
    .badge{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800}
    .badge.merkai{background:linear-gradient(135deg,#00C9A7,#0a8f7a);color:#06241f}
    .badge.claude{background:#d97757;color:#fff}
    .dots{color:#334155;letter-spacing:3px;font-size:18px}
    h1{font-size:19px;font-weight:700;color:#fff;margin-bottom:6px}
    .subtitle{font-size:13px;color:#7b8ba3;line-height:1.55}
    .subtitle b{color:#cbd5e1}
    .body{padding:24px 28px 26px}
    .perms{list-style:none;background:rgba(0,201,167,0.05);border:1px solid rgba(0,201,167,0.16);border-radius:10px;padding:14px 16px;margin-bottom:20px}
    .perms-title{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#00C9A7;margin-bottom:10px}
    .perms li{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#aab7c8;line-height:1.45;padding:4px 0}
    .perms li svg{flex:none;margin-top:2px}
    .perms .no{color:#7b8ba3;border-top:1px solid rgba(255,255,255,0.06);margin-top:6px;padding-top:10px}
    label{display:block;font-size:11px;font-weight:700;color:#7b8ba3;margin-bottom:7px;letter-spacing:.05em;text-transform:uppercase}
    .field{position:relative;margin-bottom:16px}
    input[type=text],input[type=password]{width:100%;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:9px;font-size:14px;color:#fff;outline:none;transition:border-color .15s,box-shadow .15s}
    input::placeholder{color:#475569}
    input:focus{border-color:#00C9A7;box-shadow:0 0 0 3px rgba(0,201,167,0.18)}
    .field input.pw{padding-right:76px}
    .toggle{position:absolute;right:8px;bottom:6px;background:none;border:none;color:#7b8ba3;font-size:12px;font-weight:600;cursor:pointer;padding:6px 8px;border-radius:6px}
    .toggle:hover{color:#fff;background:rgba(255,255,255,0.06)}
    .btn{width:100%;padding:13px;background:#00C9A7;color:#06241f;border:none;border-radius:9px;font-size:14.5px;font-weight:700;cursor:pointer;margin-top:4px;transition:filter .15s,transform .05s}
    .btn:hover{filter:brightness(1.08)}
    .btn:active{transform:translateY(1px)}
    .btn[disabled]{opacity:.7;cursor:wait}
    .error{display:flex;gap:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.28);color:#fca5a5;padding:11px 14px;border-radius:9px;font-size:13px;margin-bottom:18px;line-height:1.45}
    .note{display:flex;align-items:center;justify-content:center;gap:6px;font-size:11.5px;color:#64748b;text-align:center;margin-top:18px;line-height:1.5}
    @media (max-width:420px){.head{padding:22px 20px 18px}.body{padding:20px}}
  </style>
</head>
<body>
  <main class="card">
    <div class="head">
      <div class="link" aria-hidden="true">
        <div class="badge merkai">M</div>
        <div class="dots">• • •</div>
        <div class="badge claude">✳</div>
      </div>
      <h1>Conecta Merkai con Claude</h1>
      <p class="subtitle"><b>Claude</b> solicita acceso para responder preguntas sobre tu negocio. Inicia sesión con tu cuenta de Merkai para autorizarlo.</p>
    </div>
    <div class="body">
      <ul class="perms" aria-label="Permisos solicitados">
        <div class="perms-title">Claude podrá consultar</div>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Ventas, comparativas y productos más vendidos</li>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Inventario y stock crítico</li>
        <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C9A7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Pedidos pendientes y clientes frecuentes</li>
        <li class="no"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b8ba3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/></svg>Solo lectura: no puede modificar, borrar ni cobrar nada</li>
      </ul>
      ${error ? `<div class="error" role="alert"><span>⚠</span><span>${error}</span></div>` : ""}
      <form method="POST" action="/oauth/authorize" id="f">
        <input type="hidden" name="redirect_uri" value="${safe(params.redirect_uri)}"/>
        <input type="hidden" name="state" value="${safe(params.state)}"/>
        <input type="hidden" name="code_challenge" value="${safe(params.code_challenge)}"/>
        <input type="hidden" name="code_challenge_method" value="${safe(params.code_challenge_method)}"/>
        <input type="hidden" name="client_id" value="${safe(params.client_id)}"/>
        <div class="field">
          <label for="usuario">Usuario de Merkai</label>
          <input type="text" id="usuario" name="usuario" placeholder="Tu usuario o correo de Merkai" required autocomplete="username" autocapitalize="none" spellcheck="false" autofocus/>
        </div>
        <div class="field">
          <label for="contrasena">Contraseña</label>
          <input type="password" id="contrasena" name="contrasena" class="pw" placeholder="Tu contraseña" required autocomplete="current-password"/>
          <button type="button" class="toggle" id="t" aria-label="Mostrar contraseña">Mostrar</button>
        </div>
        <button type="submit" class="btn" id="b">Autorizar acceso</button>
      </form>
      <div class="note">🔒 Puedes revocar este acceso cuando quieras desde Claude</div>
    </div>
  </main>
  <script>
    var p=document.getElementById("contrasena"),t=document.getElementById("t");
    t.onclick=function(){var s=p.type==="password";p.type=s?"text":"password";t.textContent=s?"Ocultar":"Mostrar";t.setAttribute("aria-label",s?"Ocultar contraseña":"Mostrar contraseña");};
    document.getElementById("f").onsubmit=function(){var b=document.getElementById("b");b.disabled=true;b.textContent="Verificando…";};
  </script>
</body>
</html>`;
}

// POST /oauth/register — registro dinámico de clientes (RFC 7591)
// Claude.ai llama esto automáticamente para obtener un client_id
router.post("/register", (req, res) => {
  const { redirect_uris, client_name } = req.body;

  // Generamos un client_id único por sesión de registro
  const clientId = `claude-${crypto.randomBytes(8).toString("hex")}`;

  res.status(201).json({
    client_id: clientId,
    client_name: client_name || "Claude AI",
    redirect_uris: redirect_uris || [],
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  });
});

// GET /oauth/authorize — muestra formulario de login
router.get("/authorize", (req, res) => {
  const { response_type, redirect_uri } = req.query;

  if (response_type !== "code") {
    return res.status(400).send("response_type inválido");
  }
  if (!redirect_uri) {
    return res.status(400).send("redirect_uri requerido");
  }

  res.send(loginPage(req.query));
});

// POST /oauth/authorize — procesa login y redirige con code
router.post("/authorize", async (req, res) => {
  try {
    const { usuario, contrasena, redirect_uri, state, code_challenge, code_challenge_method, client_id } = req.body || {};

    if (!redirect_uri) return res.status(400).send("redirect_uri requerido");

    const params = { redirect_uri, state, code_challenge, code_challenge_method, client_id };

    const result = await pool.query(
      `SELECT p.id, p.empresa_id, p.rol_id, p.contrasena
       FROM persona p
       WHERE p.usuario = $1`,
      [usuario]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(contrasena, user.contrasena))) {
      return res.send(loginPage(params, "Credenciales incorrectas"));
    }

    if (user.rol_id === 4) {
      return res.send(loginPage(params, "Este usuario no tiene acceso a la plataforma"));
    }

    const code = crypto.randomBytes(32).toString("hex");
    authCodes.set(code, {
      userId: user.id,
      empresaId: user.empresa_id,
      rolId: user.rol_id,
      codeChallenge: code_challenge || null,
      codeChallengeMethod: code_challenge_method || "S256",
      redirectUri: redirect_uri,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const url = new URL(redirect_uri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);

    res.redirect(url.toString());
  } catch (err) {
    console.error("[OAuth] Error en /authorize:", err.message);
    res.status(500).send("Error interno del servidor");
  }
});

// POST /oauth/token — intercambia code por access_token
router.post("/token", async (req, res) => {
  const { grant_type, code, code_verifier } = req.body;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }
  if (!code) {
    return res.status(400).json({ error: "invalid_request", error_description: "code requerido" });
  }

  const codeData = authCodes.get(code);
  if (!codeData || codeData.expiresAt < Date.now()) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  // Verificación PKCE (S256)
  if (codeData.codeChallenge && code_verifier) {
    const hash = crypto.createHash("sha256").update(code_verifier).digest("base64url");
    if (hash !== codeData.codeChallenge) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE inválido" });
    }
  }

  authCodes.delete(code);

  const token = jwt.sign(
    { id: codeData.userId, empresa_id: codeData.empresaId, rol_id: codeData.rolId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 30 * 24 * 60 * 60,
  });
});

export default router;
