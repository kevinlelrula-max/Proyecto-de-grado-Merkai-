import { Router } from "express";
import {
  getreporteEmpresa,
  getResumenInicio,
  getRentabilidad,
  getComparativa,
  getResumenDiario,
  getSegmentacionClientes,
  getPronosticoVentas,
  getPredictorAvanzado,
} from "../controllers/reporteEmpresa.controller.js";
import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/inicio",         verificarToken, getResumenInicio);
router.get("/resumen",        verificarToken, requierePermiso("reportes"), getreporteEmpresa);
router.get("/rentabilidad",   verificarToken, requierePermiso("reportes"), getRentabilidad);
router.get("/comparativa",    verificarToken, requierePermiso("reportes"), getComparativa);
router.get("/resumen-diario",         verificarToken, getResumenDiario);
router.get("/segmentacion-clientes",  verificarToken, getSegmentacionClientes);
router.get("/pronostico",             verificarToken, requierePermiso("reportes"), getPronosticoVentas);
router.get("/predictor-avanzado",     verificarToken, getPredictorAvanzado);

export default router;
