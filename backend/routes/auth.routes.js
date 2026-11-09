import express from "express";
import { login, loginGoogle, misEmpresas, seleccionarEmpresa, solicitarRecuperacionEmpresa } from "../controllers/auth.controller.js";
import { resetearContrasena } from "../controllers/clientes.controller.js";
import { registrarEmpresa } from "../controllers/empresa.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login",               login);
router.post("/login/google",        loginGoogle);
router.post("/registro",            registrarEmpresa);
router.post("/recuperar-contrasena", solicitarRecuperacionEmpresa);
router.post("/resetear-contrasena",  resetearContrasena);
router.get("/mis-empresas",         verificarToken, misEmpresas);
router.post("/seleccionar-empresa", verificarToken, seleccionarEmpresa);

export default router;