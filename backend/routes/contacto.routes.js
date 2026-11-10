import { Router } from "express";
import {
  enviarMensaje,
  getMensajes,
  marcarLeido,
  getMensajesNoLeidos,
} from "../controllers/contacto.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔓 Pública — cliente envía mensaje
router.post("/:empresaId", enviarMensaje);

// 🔐 Privadas — empresa gestiona mensajes
router.get("/", verificarToken, getMensajes);
router.get("/no-leidos", verificarToken, getMensajesNoLeidos);
router.put("/:id/leido", verificarToken, marcarLeido);

export default router;