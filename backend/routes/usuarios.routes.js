import { Router } from "express";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  toggleUsuario,
  eliminarUsuario,
  getRoles,
  getTodosRoles,
  crearRol,
  eliminarRol,
  getPermisosRol,
  actualizarPermisosRol,
  getPerfil,
  actualizarPerfil,
  cambiarContrasenaUsuario
} from "../controllers/usuarios.controller.js";
import { verificarToken, requierePermiso } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Rutas específicas SIEMPRE antes de /:id
// Perfil
router.get("/perfil",             verificarToken, getPerfil);
router.put("/perfil",             verificarToken, actualizarPerfil);
router.put("/perfil/contrasena",  verificarToken, cambiarContrasenaUsuario);

// Roles
router.get("/roles",              verificarToken, getRoles);
router.get("/roles/todos",        verificarToken, getTodosRoles);
router.post("/roles",             verificarToken, requierePermiso("usuarios"), crearRol);
router.get("/roles/:rol_id/permisos",    verificarToken, getPermisosRol);
router.put("/roles/:rol_id/permisos",    verificarToken, requierePermiso("usuarios"), actualizarPermisosRol);
router.delete("/roles/:rol_id",          verificarToken, requierePermiso("usuarios"), eliminarRol);

// Usuarios — rutas generales
router.get("/",             verificarToken, requierePermiso("usuarios"), getUsuarios);
router.post("/",            verificarToken, requierePermiso("usuarios"), crearUsuario);

// Usuarios — rutas con parámetro AL FINAL
router.put("/:id",          verificarToken, requierePermiso("usuarios"), actualizarUsuario);
router.patch("/:id/toggle", verificarToken, requierePermiso("usuarios"), toggleUsuario);
router.delete("/:id",       verificarToken, requierePermiso("usuarios"), eliminarUsuario);

export default router;