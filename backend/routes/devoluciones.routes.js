import { Router } from "express";
import {
  crearDevolucion,
  getDevoluciones,
  getDevolucionById,
} from "../controllers/devoluciones.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/",    verificarToken, getDevoluciones);
router.get("/:id", verificarToken, getDevolucionById);
router.post("/",   verificarToken, crearDevolucion);

export default router;
