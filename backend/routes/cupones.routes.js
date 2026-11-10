import { Router } from "express";
import {
  getCupones,
  crearCupon,
  actualizarCupon,
  toggleCupon,
  eliminarCupon,
  getUsosCupon,
  validarCupon,
  getCuponesActivos,
} from "../controllers/cupones.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// 🎫 PÚBLICO
router.post("/validar", validarCupon);
router.get("/activos/:empresa_id", getCuponesActivos);

// 🔒 EMPRESA — gestión de cupones (requieren autenticación)
router.get("/",           verificarToken, getCupones);
router.post("/",          verificarToken, crearCupon);
router.put("/:id",        verificarToken, actualizarCupon);
router.patch("/:id/toggle", verificarToken, toggleCupon);
router.delete("/:id",     verificarToken, eliminarCupon);
router.get("/:id/usos",   verificarToken, getUsosCupon);

export default router;
