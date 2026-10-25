import pool from "../config/db.js";
import bcrypt from "bcrypt";

// =========================
// GET USUARIOS (excluye clientes)
// =========================
export const getUsuarios = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, p.usuario, p.telefono, p.direccion,
              p.numero_documento, p.rol_id, p.id_municipio, p.fecha_registro,
              p.activo,
              r.nombre AS rol_nombre
       FROM persona p
       JOIN roles r ON r.id = p.rol_id
       WHERE p.empresa_id = $1 AND p.rol_id != 4
       ORDER BY p.fecha_registro DESC`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// =========================
// CREAR USUARIO
// =========================
export const crearUsuario = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    if (req.user.rol_id !== 1 && req.user.rol_id !== 2) {
      return res.status(403).json({ error: "No tienes permisos para crear usuarios" });
    }

    const {
      nombre, apellido, usuario, contrasena,
      telefono, direccion, numero_documento, rol_id, id_municipio
    } = req.body;

    if (!nombre || !usuario || !contrasena || !rol_id) {
      return res.status(400).json({ error: "Nombre, usuario, contraseña y rol son obligatorios" });
    }

    // No permitir crear SuperAdmin desde el panel
    if (Number(rol_id) === 1) {
      return res.status(403).json({ error: "No se puede crear un SuperAdmin desde el panel" });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const result = await pool.query(
      `INSERT INTO persona 
      (empresa_id, nombre, apellido, usuario, contrasena, telefono, direccion, numero_documento, rol_id, id_municipio)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, nombre, apellido, usuario, telefono, rol_id, fecha_registro`,
      [empresa_id, nombre, apellido, usuario, hashedPassword,
       telefono, direccion, numero_documento, rol_id, id_municipio || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "El nombre de usuario ya existe" });
    }
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

// =========================
// ACTUALIZAR USUARIO
// =========================
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    const { nombre, apellido, telefono, direccion, rol_id } = req.body;

    if (Number(rol_id) === 1) {
      return res.status(403).json({ error: "No se puede asignar el rol SuperAdmin" });
    }

    const result = await pool.query(
      `UPDATE persona
       SET nombre=$1, apellido=$2, telefono=$3, direccion=$4, rol_id=$5
       WHERE id=$6 AND empresa_id=$7 AND rol_id != 4
       RETURNING id, nombre, apellido, usuario, telefono, rol_id`,
      [nombre, apellido, telefono, direccion, rol_id, id, empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// =========================
// TOGGLE ACTIVO/INACTIVO
// =========================
export const toggleUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // No desactivar al propio usuario logueado
    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: "No puedes desactivarte a ti mismo" });
    }

    const result = await pool.query(
      `UPDATE persona
       SET activo = NOT COALESCE(activo, true)
       WHERE id = $1 AND empresa_id = $2 AND rol_id != 4
       RETURNING id, nombre, activo`,
      [id, empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar estado del usuario" });
  }
};

// =========================
// ELIMINAR USUARIO
// =========================
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
    }

    const { rows: [historial] } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM ventas        WHERE administrador_id = $1)::int AS ventas,
              (SELECT COUNT(*) FROM caja_sesiones WHERE usuario_id       = $1)::int AS cajas`,
      [id]
    );

    if (historial.ventas > 0 || historial.cajas > 0) {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: `No se puede eliminar: el usuario tiene ${historial.ventas} venta(s) y ` +
               `${historial.cajas} turno(s) de caja registrados. Desactívalo en su lugar.`,
      });
    }

    const result = await pool.query(
      `DELETE FROM persona WHERE id = $1 AND empresa_id = $2 AND rol_id != 4`,
      [id, empresa_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: "No se puede eliminar: el usuario tiene registros asociados. Desactívalo en su lugar.",
      });
    }
    console.error(error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

// =========================
// GET ROLES — para el selector del formulario (sin SuperAdmin ni Cliente)
// =========================
export const getRoles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre FROM roles WHERE id NOT IN (1, 4) ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener roles" });
  }
};

// =========================
// GET TODOS LOS ROLES — para la vista de gestión de roles (todos)
// =========================
export const getTodosRoles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre FROM roles ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener roles" });
  }
};

// =========================
// CREAR ROL — permitido para SuperAdmin y Administrador
// =========================
export const crearRol = async (req, res) => {
  try {
    // ✅ Ahora también el Administrador puede crear roles
    if (req.user.rol_id !== 1 && req.user.rol_id !== 2) {
      return res.status(403).json({ error: "No tienes permisos para crear roles" });
    }

    const { nombre } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: "El nombre del rol es obligatorio" });
    }

    const result = await pool.query(
      `INSERT INTO roles (nombre) VALUES ($1) RETURNING *`,
      [nombre.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ya existe un rol con ese nombre" });
    }
    res.status(500).json({ error: "Error al crear rol" });
  }
};

// =========================
// ELIMINAR ROL
// =========================
export const eliminarRol = async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.rol_id !== 1 && req.user.rol_id !== 2) {
      return res.status(403).json({ error: "No tienes permisos para eliminar roles" });
    }

    const { rol_id } = req.params;

    if ([1, 2, 3, 4].includes(Number(rol_id))) {
      return res.status(403).json({ error: "No se pueden eliminar los roles base del sistema" });
    }

    // Verificar que no haya usuarios con este rol
    const usosResult = await client.query(
      `SELECT COUNT(*) FROM persona WHERE rol_id = $1`,
      [rol_id]
    );
    if (Number(usosResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: "No se puede eliminar — hay usuarios con este rol asignado. Cambia su rol primero.",
      });
    }

    await client.query("BEGIN");
    await client.query(`DELETE FROM rol_permisos WHERE rol_id = $1`, [rol_id]);
    await client.query(`DELETE FROM roles WHERE id = $1`, [rol_id]);
    await client.query("COMMIT");

    res.json({ message: "Rol eliminado" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error al eliminar rol" });
  } finally {
    client.release();
  }
};

// =========================
// GET PERMISOS DE UN ROL
// =========================
export const getPermisosRol = async (req, res) => {
  try {
    const { rol_id } = req.params;
    const result = await pool.query(
      `SELECT seccion FROM rol_permisos WHERE rol_id = $1`,
      [rol_id]
    );
    res.json(result.rows.map(r => r.seccion));
  } catch (error) {
    res.status(500).json({ error: "Error al obtener permisos" });
  }
};

// =========================
// ACTUALIZAR PERMISOS DE UN ROL
// =========================
export const actualizarPermisosRol = async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.rol_id !== 1 && req.user.rol_id !== 2) {
      return res.status(403).json({ error: "No tienes permisos para modificar roles" });
    }

    const { rol_id } = req.params;
    const { secciones } = req.body; // array de strings

    // No permitir modificar roles base
    if ([1, 2, 3, 4].includes(Number(rol_id))) {
      return res.status(403).json({ error: "No se pueden modificar los permisos de roles base" });
    }

    await client.query("BEGIN");

    // Borrar permisos actuales
    await client.query(`DELETE FROM rol_permisos WHERE rol_id = $1`, [rol_id]);

    // Insertar los nuevos
    if (secciones && secciones.length > 0) {
      for (const seccion of secciones) {
        await client.query(
          `INSERT INTO rol_permisos (rol_id, seccion) VALUES ($1, $2)`,
          [rol_id, seccion]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Permisos actualizados", secciones });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error al actualizar permisos" });
  } finally {
    client.release();
  }
};
export const getPerfil = async (req, res) => {
  try {
    const id = req.user.id;
    const result = await pool.query(
      `SELECT p.id, p.nombre, p.apellido, p.usuario, p.telefono, p.direccion,
              p.numero_documento, p.fecha_registro,
              r.nombre AS rol_nombre,
              e.nombre AS empresa_nombre
       FROM persona p
       JOIN roles r ON r.id = p.rol_id
       JOIN empresas e ON e.id = p.empresa_id
       WHERE p.id = $1`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

// =========================
// ACTUALIZAR PERFIL
// =========================
export const actualizarPerfil = async (req, res) => {
  try {
    const id = req.user.id;
    const { nombre, apellido, telefono, direccion, numero_documento } = req.body;

    const result = await pool.query(
      `UPDATE persona
       SET nombre=$1, apellido=$2, telefono=$3, direccion=$4, numero_documento=$5
       WHERE id=$6
       RETURNING *`,
      [nombre, apellido, telefono, direccion, numero_documento, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

// =========================
// CAMBIAR CONTRASEÑA — usuario admin/empleado
// =========================
export const cambiarContrasenaUsuario = async (req, res) => {
  try {
    const id = req.user.id;
    const { contrasena_actual, contrasena_nueva } = req.body;

    if (!contrasena_actual || !contrasena_nueva) {
      return res.status(400).json({ error: "Completa ambos campos" });
    }
    if (contrasena_nueva.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const result = await pool.query(
      "SELECT contrasena FROM persona WHERE id = $1",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const match = await bcrypt.compare(contrasena_actual, result.rows[0].contrasena);
    if (!match) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    const hashedNueva = await bcrypt.hash(contrasena_nueva, 10);
    await pool.query(
      "UPDATE persona SET contrasena=$1 WHERE id=$2",
      [hashedNueva, id]
    );

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};