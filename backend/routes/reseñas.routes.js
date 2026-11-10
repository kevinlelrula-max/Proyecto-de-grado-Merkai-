import { Router } from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import {
  crearReseña,
  getReseñasProducto,
  getReseñasDestacadas,
  getReseñasEmpresa,
  toggleReseña,
  eliminarReseña,
  getMiReseña,
} from "../controllers/reseñas.controller.js";

const router = Router();

// ── Públicas ──────────────────────────────────────────────
router.get("/producto/:producto_id", getReseñasProducto);
router.get("/destacadas/:empresa_id", getReseñasDestacadas);

// ── Cliente autenticado ───────────────────────────────────
router.post("/",                             verificarToken, crearReseña);
router.get("/mi-reseña/:producto_id",        verificarToken, getMiReseña);

// ── Empresa admin ─────────────────────────────────────────
router.get("/",                    verificarToken, getReseñasEmpresa);
router.patch("/:id/toggle",        verificarToken, toggleReseña);
router.delete("/:id",              verificarToken, eliminarReseña);

export default router;
