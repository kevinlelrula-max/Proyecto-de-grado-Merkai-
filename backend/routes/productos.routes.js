import { Router } from "express";
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  toggleProducto,
  eliminarImagenProducto,
  upload,
  getProductosPorEmpresaPublico,
  // Lealtad
  getNivelesLealtad,
  crearNivelLealtad,
  actualizarNivelLealtad,
  eliminarNivelLealtad,
  getNivelCliente,
} from "../controllers/productos.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// =========================
// 🔓 PÚBLICAS
// =========================
router.get("/empresa/:id",                          getProductosPorEmpresaPublico);

// ✅ Calcular nivel del cliente — público para que la vitrina lo consulte
router.get("/lealtad/cliente/:clienteId/empresa/:empresaId", getNivelCliente);

// =========================
// 🔒 PRIVADAS — requieren token
// =========================

// Productos
router.get("/",                          verificarToken, getProductos);
router.post("/",                         verificarToken, upload.array("imagenes", 8), crearProducto);
router.put("/:id",                       verificarToken, upload.array("imagenes", 8), actualizarProducto);
router.delete("/:id",                    verificarToken, eliminarProducto);
router.patch("/:id/estado",               verificarToken, toggleProducto);
router.delete("/:id/imagen/:imgId",      verificarToken, eliminarImagenProducto);

// Niveles de lealtad
router.get("/lealtad",          verificarToken, getNivelesLealtad);
router.post("/lealtad",         verificarToken, crearNivelLealtad);
router.put("/lealtad/:id",      verificarToken, actualizarNivelLealtad);
router.delete("/lealtad/:id",   verificarToken, eliminarNivelLealtad);

export default router;