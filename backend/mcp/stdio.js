import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pool from "../config/db.js";
import { registerResumenTools } from "./tools/resumen.tool.js";
import { registerInventarioTools } from "./tools/inventario.tool.js";
import { registerVentasTools } from "./tools/ventas.tool.js";
import { registerClientesTools } from "./tools/clientes.tool.js";

const empresa_id = parseInt(process.env.MCP_EMPRESA_ID || "1");

const server = new McpServer({ name: "merkai", version: "1.0.0" });

registerResumenTools(server, pool, empresa_id);
registerInventarioTools(server, pool, empresa_id);
registerVentasTools(server, pool, empresa_id);
registerClientesTools(server, pool, empresa_id);

const transport = new StdioServerTransport();
await server.connect(transport);
