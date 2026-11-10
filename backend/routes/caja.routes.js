import { Router } from "express";
import {
  abrirCaja,
  cerrarCaja,
  getSesionActiva,
  getHistorialCaja,
} from "../controllers/caja.controller.js";
import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

// La caja pertenece al punto de venta: solo roles con acceso a "pos" (o administradores)
const puedeUsarCaja = requierePermiso("pos", "ventas");

router.get("/activa",   verificarToken, puedeUsarCaja, getSesionActiva);
router.get("/historial",verificarToken, puedeUsarCaja, getHistorialCaja);
router.post("/abrir",   verificarToken, puedeUsarCaja, abrirCaja);
router.post("/cerrar",  verificarToken, puedeUsarCaja, cerrarCaja);

export default router;
