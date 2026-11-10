import { Router } from "express";
import {
  getEmpresasPublicas,
  getEmpresaPublica,
  getProductosPublicos,
} from "../controllers/tienda.controller.js";

const router = Router();

// GET /api/tienda/empresas
router.get("/empresas", getEmpresasPublicas);

// GET /api/tienda/empresas/:id
router.get("/empresas/:id", getEmpresaPublica);

// GET /api/tienda/empresas/:id/productos
router.get("/empresas/:id/productos", getProductosPublicos);

export default router;
