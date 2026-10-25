import { Router } from "express";
import {
  getIntegraciones,
  guardarIntegracion,
  toggleIntegracion,
  eliminarIntegracion,
  getIntegracionesPublicas,
} from "../controllers/integraciones.controller.js";

import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

// 🌐 PÚBLICA — pasarelas activas de una empresa (para el checkout del cliente)
router.get("/publicas/:empresa_id", getIntegracionesPublicas);

// 🔐 PRIVADAS — solo el admin/cajero de la empresa
router.get("/",                       verificarToken, requierePermiso("integraciones"), getIntegraciones);
router.post("/",                      verificarToken, requierePermiso("integraciones"), guardarIntegracion);
router.patch("/:proveedor/toggle",    verificarToken, requierePermiso("integraciones"), toggleIntegracion);
router.delete("/:proveedor",          verificarToken, requierePermiso("integraciones"), eliminarIntegracion);

export default router;