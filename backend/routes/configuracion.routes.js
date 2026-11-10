import { Router } from "express";
import {
  getConfiguracion,
  updateDatosEmpresa,
  updateMetodosPago,
  subirLogo,
  uploadLogo,
  subirBanner,
  uploadBanner,
  getLayout,
  updateLayout,
} from "../controllers/configuracion.controller.js";
import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

// GET  /api/configuracion          → datos de empresa + métodos de pago
router.get("/",             verificarToken, getConfiguracion);

// PUT  /api/configuracion/empresa  → actualiza nombre, nit, email, teléfono, dirección
router.put("/empresa",      verificarToken, requierePermiso("configuracion"), updateDatosEmpresa);

// PUT  /api/configuracion/metodos  → activa/desactiva métodos de pago
router.put("/metodos",      verificarToken, requierePermiso("configuracion"), updateMetodosPago);

// POST /api/configuracion/logo     → sube o reemplaza el logo
router.post("/logo",        verificarToken, requierePermiso("configuracion"), uploadLogo.single("logo"),     subirLogo);

// POST /api/configuracion/banner   → sube o reemplaza el banner
router.post("/banner",      verificarToken, requierePermiso("configuracion"), uploadBanner.single("banner"), subirBanner);

// GET  /api/configuracion/layout   → obtiene layout de secciones
router.get("/layout",       verificarToken, getLayout);

// PUT  /api/configuracion/layout   → guarda layout de secciones
router.put("/layout",       verificarToken, requierePermiso("editor"), updateLayout);

export default router;