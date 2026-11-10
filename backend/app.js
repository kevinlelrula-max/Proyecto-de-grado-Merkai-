import express from "express";
import cors from "cors";

// 🔹 RUTAS
import productosRoutes     from "./routes/productos.routes.js";
import authRoutes          from "./routes/auth.routes.js";
import usuariosRoutes      from "./routes/usuarios.routes.js";
import ventasRoutes        from "./routes/ventas.routes.js";
import clientesRoutes      from "./routes/clientes.routes.js";
import reportesRoutes      from "./routes/reporteEmpresa.routes.js";
import metodoPagoRoutes    from "./routes/metodoPago.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
import ubicacionRoutes     from "./routes/ubicacion.routes.js";
import categoriasRoutes    from "./routes/categorias.routes.js";
import empresaRoutes       from "./routes/empresa.routes.js";
import tiendaRoutes        from "./routes/tienda.routes.js";
import pedidosRoutes       from "./routes/pedidos.routes.js";
import contactoRoutes      from "./routes/contacto.routes.js";
import integracionesRoutes from "./routes/integraciones.routes.js";
import pagosRoutes         from "./routes/pagos.routes.js";
import envioRoutes    from "./routes/envio.routes.js";
import cuponesRoutes  from "./routes/cupones.routes.js";
import reseñasRoutes        from "./routes/reseñas.routes.js";
import notificacionesRoutes from "./routes/notificaciones.routes.js";
import referidosRoutes      from "./routes/referidos.routes.js";
import carritosRoutes       from "./routes/carritos.routes.js";
import mcpRoutes            from "./routes/mcp.routes.js";
import oauthRoutes          from "./routes/oauth.routes.js";
import insightRoutes        from "./routes/insight.routes.js";
import devolucionesRoutes   from "./routes/devoluciones.routes.js";
import cajaRoutes           from "./routes/caja.routes.js";
const app = express();

// =========================
// 🔹 MIDDLEWARES
// =========================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  /^https:\/\/proyecto-de-grado-fishware-kjsv.*\.vercel\.app$/,
  "http://localhost:5173",
  // Claude MCP connections
  "https://claude.ai",
  "https://api.anthropic.com",
  /^https:\/\/.*\.claude\.ai$/,
  // Propio servidor (OAuth authorize form submit)
  "https://merkai-backend.onrender.com",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    callback(allowed ? null : new Error("CORS not allowed"), allowed);
  },
  credentials: true,
}));

// ⚠️ El webhook de Stripe necesita raw body — va ANTES de express.json()
app.use("/api/pagos/webhook/stripe", express.raw({ type: "application/json" }));

// JSON parser para todas las demás rutas
app.use(express.json());
// Form-encoded para el token endpoint de OAuth
app.use(express.urlencoded({ extended: false }));

// =========================
// 🔹 TEST API
// =========================
app.get("/", (req, res) => {
  res.send("API Merkai funcionando 🚀");
});

// OAuth 2.0 metadata — requerido por Claude.ai para descubrir los endpoints
app.get("/.well-known/oauth-authorization-server", (req, res) => {
  const base = process.env.BACKEND_URL || "https://merkai-backend.onrender.com";
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
});

// =========================
// 🔹 RUTAS
// =========================
app.use("/api/productos",       productosRoutes);
app.use("/api/auth",            authRoutes);
app.use("/api/usuarios",        usuariosRoutes);
app.use("/api/ventas",          ventasRoutes);
app.use("/api/clientes",        clientesRoutes);
app.use("/api/empresa",         empresaRoutes);
app.use("/api/reportesEmpresa", reportesRoutes);
app.use("/api/metodo_pago",     metodoPagoRoutes);
app.use("/uploads",             express.static("uploads"));
app.use("/api/ubicacion",       ubicacionRoutes);
app.use("/api/configuracion",   configuracionRoutes);
app.use("/api/categorias",      categoriasRoutes);
app.use("/api/tienda",          tiendaRoutes);
app.use("/api/pedidos",         pedidosRoutes);
app.use("/api/envio",            envioRoutes);
app.use("/api/cupones",         cuponesRoutes);
app.use("/api/resenas",         reseñasRoutes);
app.use("/api/notificaciones",  notificacionesRoutes);
app.use("/api/contacto",        contactoRoutes);
app.use("/api/integraciones",   integracionesRoutes);
app.use("/api/pagos",           pagosRoutes);
app.use("/api/referidos",       referidosRoutes);
app.use("/api/carritos",        carritosRoutes);
app.use("/api/mcp",             mcpRoutes);
app.use("/oauth",               oauthRoutes);
app.use("/api/insight",         insightRoutes);
app.use("/api/devoluciones",    devolucionesRoutes);
app.use("/api/caja",            cajaRoutes);

// =========================
// 🔹 404 HANDLER
// =========================
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    ruta: req.originalUrl,
  });
});

export default app;