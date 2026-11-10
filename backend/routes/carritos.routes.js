import express from "express";
import { verificarToken } from "../middlewares/auth.middleware.js";
import {
  guardarCarrito,
  limpiarCarrito,
  getCarritosAbandonados,
  getResumenCarritos,
} from "../controllers/carritos.controller.js";

const router = express.Router();

// Tienda (cliente autenticado con su token)
router.post("/guardar",  verificarToken, guardarCarrito);
router.post("/limpiar",  verificarToken, limpiarCarrito);

// Admin (empresa autenticada)
router.get("/abandonados", verificarToken, getCarritosAbandonados);
router.get("/resumen",     verificarToken, getResumenCarritos);

export default router;
