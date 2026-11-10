import { Router } from "express";
import {
  registrarEmpresa,
  getEmpresasPublicas,
  solicitarVinculacion,
  getSolicitudesVinculacion,
  responderSolicitud,
  getMiRed,
  getEmpresaPorSlug,
  crearTiendaAdicional,
} from "../controllers/empresa.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔓 PÚBLICAS
router.post("/registro",    registrarEmpresa);
router.get("/publicas",     getEmpresasPublicas);

// 🔐 PRIVADAS — requieren token de empresa
router.post("/vincular",           verificarToken, solicitarVinculacion);
router.get("/solicitudes",         verificarToken, getSolicitudesVinculacion);
router.patch("/solicitudes/:id",   verificarToken, responderSolicitud);
router.get("/mi-red",              verificarToken, getMiRed);
router.get("/slug/:slug",        getEmpresaPorSlug);
router.post("/crear-adicional",  verificarToken, crearTiendaAdicional);

export default router;

