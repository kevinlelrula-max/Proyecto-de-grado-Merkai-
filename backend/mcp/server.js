import express from "express";
import jwt from "jsonwebtoken";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import pool from "../config/db.js";

import { registerResumenTools } from "./tools/resumen.tool.js";
import { registerInventarioTools } from "./tools/inventario.tool.js";
import { registerVentasTools } from "./tools/ventas.tool.js";
import { registerClientesTools } from "./tools/clientes.tool.js";
import { renderLanding } from "./views/landing.js";

const CLAUDE_ORIGINS = [
  "https://claude.ai",
  "https://api.anthropic.com",
  /^https:\/\/.*\.claude\.ai$/,
];

const app = express();
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed =
    !origin ||
    CLAUDE_ORIGINS.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
  if (allowed && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transports = new Map();

app.get("/", (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.send(renderLanding({ frontendUrl }));
});


app.get("/sse", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Token requerido" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  const empresa_id = decoded.empresa_id;
  if (!empresa_id) return res.status(403).json({ error: "Token sin empresa asociada" });

  const mcpServer = new McpServer({ name: "merkai", version: "1.0.0" });

  registerResumenTools(mcpServer, pool, empresa_id);
  registerInventarioTools(mcpServer, pool, empresa_id);
  registerVentasTools(mcpServer, pool, empresa_id);
  registerClientesTools(mcpServer, pool, empresa_id);

  const transport = new SSEServerTransport("/messages", res);
  transports.set(transport.sessionId, transport);
  transport.onclose = () => transports.delete(transport.sessionId);

  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);

  if (!transport) return res.status(404).json({ error: "Sesión no encontrada" });

  await transport.handlePostMessage(req, res, req.body);
});

export default app;