import { Router } from "express";
import { getDepartamentos, getMunicipios } from "../controllers/ubicacion.controller.js";

const router = Router();


router.get("/departamentos", getDepartamentos);
router.get("/municipios/:id_departamento", getMunicipios);

export default router;
