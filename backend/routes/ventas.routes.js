import { Router } from "express";
import {
  crearVenta,
  listarVentasEmpresa,
  detalleVenta,
  historialCliente,
  reporteProductos
} from "../controllers/ventas.controller.js";
import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

// Crear venta en el punto de venta (requiere acceso al POS)
router.post("/", verificarToken, requierePermiso("pos", "ventas"), crearVenta);

// Ventas de la empresa logueada
router.get("/empresa", verificarToken, requierePermiso("ventas", "pos"), listarVentasEmpresa);

// Reportes
router.get("/reportes/productos", verificarToken, requierePermiso("reportes"), reporteProductos);

// ✅ Nuevas — van ANTES de /:id para que Express no las confunda con un id
router.get("/cliente/:cliente_id", verificarToken, historialCliente);
router.get("/:id",                 verificarToken, detalleVenta);

export default router;