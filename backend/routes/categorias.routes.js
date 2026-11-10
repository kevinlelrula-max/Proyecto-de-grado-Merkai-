import { Router } from "express";
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  toggleEstadoCategoria,
  eliminarCategoria
} from "../controllers/categorias.controller.js";
import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

// Cada empresa solo ve y modifica SUS categorías; escribir requiere acceso a Productos
router.get("/",           verificarToken, getCategorias);
router.post("/",          verificarToken, requierePermiso("productos"), crearCategoria);
router.put("/:id",        verificarToken, requierePermiso("productos"), actualizarCategoria);
router.patch("/:id/toggle", verificarToken, requierePermiso("productos"), toggleEstadoCategoria); // ✅ PATCH para toggle
router.delete("/:id",     verificarToken, requierePermiso("productos"), eliminarCategoria);

export default router;