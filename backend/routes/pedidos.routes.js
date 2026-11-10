import { Router } from "express";
import {
  crearPedido,
  getMisPedidos,
  getEstadoPedido,
  getPedidosEmpresa,
  actualizarEstadoPedido,
  getHistorialPedido,
} from "../controllers/pedidos.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// 🛒 CLIENTE — requiere token de cliente (rol 4)
router.post("/",                    verificarToken, crearPedido);
router.get("/mis-pedidos",          verificarToken, getMisPedidos);
router.get("/:id/estado",           verificarToken, getEstadoPedido);

// 🔥 CAJERO/EMPRESA — requiere token de empresa
router.get("/empresa",              verificarToken, getPedidosEmpresa);
router.patch("/:id/estado",         verificarToken, actualizarEstadoPedido);

// 📋 HISTORIAL — accesible para cliente y empresa
router.get("/:id/historial",        verificarToken, getHistorialPedido);

export default router;