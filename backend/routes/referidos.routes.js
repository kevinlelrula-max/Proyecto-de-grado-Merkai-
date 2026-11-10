import { Router } from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import {
  getMiReferido,
  getMiDescuentoActivo,
  validarCodigo,
  getConfigReferidos,
  guardarConfigReferidos,
  getEstadisticasReferidos,
} from "../controllers/referidos.controller.js";

const router = Router();

// ── Cliente autenticado ───────────────────────────────────────────────────────
router.get("/mi-info",              verificarToken, getMiReferido);
router.get("/mi-descuento-activo",  verificarToken, getMiDescuentoActivo);

// ── Público (validar código antes de registrarse) ─────────────────────────────
router.get("/validar/:codigo",      validarCodigo);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get("/config",               verificarToken, getConfigReferidos);
router.post("/config",              verificarToken, guardarConfigReferidos);
router.get("/estadisticas",         verificarToken, getEstadisticasReferidos);

export default router;
