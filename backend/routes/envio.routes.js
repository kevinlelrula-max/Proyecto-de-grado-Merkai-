import { Router } from "express";
import {
  getConfigEnvio,
  getConfigEnvioPublico,
  updateConfigEnvio,
} from "../controllers/envio.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Pública — el carrito la consulta sin token
router.get("/publico/:empresa_id", getConfigEnvioPublico);

// Privada — solo el admin
router.get("/",    verificarToken, getConfigEnvio);
router.put("/",    verificarToken, updateConfigEnvio);

export default router;