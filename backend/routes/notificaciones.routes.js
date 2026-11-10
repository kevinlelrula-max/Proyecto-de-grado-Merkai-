import { Router } from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  limpiarLeidas,
} from "../controllers/notificaciones.controller.js";

const router = Router();

router.get("/",                    verificarToken, getNotificaciones);
router.patch("/:id/leer",          verificarToken, marcarLeida);
router.patch("/leer-todas",        verificarToken, marcarTodasLeidas);
router.delete("/limpiar-leidas",   verificarToken, limpiarLeidas);

export default router;
