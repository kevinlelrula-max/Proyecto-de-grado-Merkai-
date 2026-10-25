import pool from "../config/db.js";
import { crearNotificacion } from "../utils/notificaciones.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generarCodigo(nombre = "") {
  const prefix = nombre.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(3, "X");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generarToken } from "../utils/jwt.js";
import { enviarEmailRecuperacion } from "../utils/email.js";
// Clientes

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clientes/:id/vista360  — Vista 360 del cliente
// ─────────────────────────────────────────────────────────────────────────────
export const getVista360 = async (req, res) => {
  try {
    const empresa_id  = req.user.empresa_id;
    const cliente_id  = parseInt(req.params.id);

    // 1. Datos básicos del cliente
    const { rows: [cliente] } = await pool.query(
      `SELECT id, nombre, apellido, usuario, telefono, direccion,
              tipo_documento, numero_documento, codigo_referido
       FROM persona WHERE id=$1 AND empresa_id=$2 AND rol_id=4`,
      [cliente_id, empresa_id]
    );
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });

    // 2. Compras POS
    const { rows: [pos] } = await pool.query(
      `SELECT
         COUNT(*)                          AS total_ventas,
         COALESCE(SUM(total), 0)           AS total_gastado_pos,
         COALESCE(AVG(total), 0)           AS ticket_promedio_pos,
         MAX(fecha)                        AS ultima_compra_pos
       FROM ventas
       WHERE cliente_id=$1 AND empresa_id=$2`,
      [cliente_id, empresa_id]
    );

    // 3. Pedidos online
    const { rows: [online] } = await pool.query(
      `SELECT
         COUNT(*)                          AS total_pedidos,
         COALESCE(SUM(total), 0)           AS total_gastado_online,
         COALESCE(AVG(total), 0)           AS ticket_promedio_online,
         MAX(fecha_pedido)                 AS ultimo_pedido
       FROM pedidos_online
       WHERE cliente_id=$1 AND empresa_id=$2 AND estado != 'cancelado'`,
      [cliente_id, empresa_id]
    );

    // 4. Productos más comprados (POS + online combinados)
    const { rows: topProductos } = await pool.query(
      `SELECT nombre, unidad,
              SUM(total_cantidad) AS total_cantidad,
              SUM(total_gastado)  AS total_gastado
       FROM (
         SELECT pr.nombre, pr.unidad,
                COALESCE(SUM(dv.cantidad), 0)                      AS total_cantidad,
                COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0)  AS total_gastado
         FROM detalle_venta dv
         JOIN ventas v     ON v.id  = dv.venta_id
         JOIN productos pr ON pr.id = dv.producto_id
         WHERE v.cliente_id=$1 AND v.empresa_id=$2
         GROUP BY pr.nombre, pr.unidad
         UNION ALL
         SELECT pr.nombre, pr.unidad,
                COALESCE(SUM(dp.cantidad), 0),
                COALESCE(SUM(dp.cantidad * dp.precio_unitario), 0)
         FROM detalle_pedido_online dp
         JOIN pedidos_online po ON po.id = dp.pedido_id
         JOIN productos pr       ON pr.id = dp.producto_id
         WHERE po.cliente_id=$1 AND po.empresa_id=$2
         GROUP BY pr.nombre, pr.unidad
       ) t
       GROUP BY nombre, unidad
       ORDER BY total_gastado DESC
       LIMIT 5`,
      [cliente_id, empresa_id]
    );

    // 5. Nivel de lealtad actual
    const totalMesPos = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS t FROM ventas
       WHERE cliente_id=$1 AND empresa_id=$2
       AND DATE_TRUNC('month',fecha)=DATE_TRUNC('month',NOW())`,
      [cliente_id, empresa_id]
    );
    const totalMesOnline = await pool.query(
      `SELECT COALESCE(SUM(total),0) AS t FROM pedidos_online
       WHERE cliente_id=$1 AND empresa_id=$2
       AND DATE_TRUNC('month',fecha_pedido)=DATE_TRUNC('month',NOW())
       AND estado!='cancelado'`,
      [cliente_id, empresa_id]
    );
    const totalMes = parseFloat(totalMesPos.rows[0].t) + parseFloat(totalMesOnline.rows[0].t);

    const { rows: [nivelActual] } = await pool.query(
      `SELECT nombre, descuento_porcentaje, monto_minimo FROM niveles_lealtad
       WHERE empresa_id=$1 AND activo=true AND monto_minimo<=$2
       ORDER BY monto_minimo DESC LIMIT 1`,
      [empresa_id, totalMes]
    );

    // Próximo nivel
    const { rows: [proximoNivel] } = await pool.query(
      `SELECT nombre, monto_minimo FROM niveles_lealtad
       WHERE empresa_id=$1 AND activo=true AND monto_minimo>$2
       ORDER BY monto_minimo ASC LIMIT 1`,
      [empresa_id, totalMes]
    );

    // 6. Referidos
    const { rows: [statsRef] } = await pool.query(
      `SELECT
         COUNT(*)                                    AS total,
         COUNT(*) FILTER (WHERE estado='completado') AS completados,
         COUNT(*) FILTER (WHERE estado='registrado') AS pendientes
       FROM referidos
       WHERE referidor_id=$1 AND empresa_id=$2`,
      [cliente_id, empresa_id]
    );

    // 7. Cupones usados
    const { rows: cupones } = await pool.query(
      `SELECT c.codigo, c.tipo AS descuento_tipo, c.valor AS descuento_valor, cu.fecha AS fecha_uso
       FROM cupones_usos cu
       JOIN cupones c ON c.id = cu.cupon_id
       WHERE cu.cliente_id=$1 AND c.empresa_id=$2
       ORDER BY cu.fecha DESC LIMIT 5`,
      [cliente_id, empresa_id]
    );

    // 8. Reseñas
    const { rows: reseñas } = await pool.query(
      `SELECT r.calificacion AS estrellas, r.comentario, r.creado_en, pr.nombre AS producto
       FROM reseñas r
       JOIN productos pr ON pr.id = r.producto_id
       WHERE r.cliente_id=$1 AND r.empresa_id=$2
       ORDER BY r.creado_en DESC LIMIT 5`,
      [cliente_id, empresa_id]
    );

    // 9. Canal preferido
    const totalPosNum    = parseInt(pos.total_ventas);
    const totalOnlineNum = parseInt(online.total_pedidos);
    const canalPreferido = totalPosNum >= totalOnlineNum ? "POS" : "Online";

    // 10. Total gastado combinado
    const totalGastado = parseFloat(pos.total_gastado_pos) + parseFloat(online.total_gastado_online);
    const ticketPromedio = (totalPosNum + totalOnlineNum) > 0
      ? totalGastado / (totalPosNum + totalOnlineNum)
      : 0;

    res.json({
      cliente,
      compras: {
        pos: {
          total_ventas:       totalPosNum,
          total_gastado:      parseFloat(pos.total_gastado_pos),
          ticket_promedio:    parseFloat(pos.ticket_promedio_pos),
          ultima_compra:      pos.ultima_compra_pos,
        },
        online: {
          total_pedidos:      totalOnlineNum,
          total_gastado:      parseFloat(online.total_gastado_online),
          ticket_promedio:    parseFloat(online.ticket_promedio_online),
          ultimo_pedido:      online.ultimo_pedido,
        },
        total_gastado:      totalGastado,
        ticket_promedio:    ticketPromedio,
        canal_preferido:    canalPreferido,
        top_productos:      topProductos,
      },
      lealtad: {
        total_mes:          totalMes,
        nivel_actual:       nivelActual || null,
        proximo_nivel:      proximoNivel || null,
        falta_para_subir:   proximoNivel ? proximoNivel.monto_minimo - totalMes : 0,
      },
      referidos: {
        total:       parseInt(statsRef.total),
        completados: parseInt(statsRef.completados),
        pendientes:  parseInt(statsRef.pendientes),
      },
      cupones,
      reseñas,
    });
  } catch (error) {
    console.error("getVista360:", error);
    res.status(500).json({ error: "Error al obtener vista 360" });
  }
};

export const getClientes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT id, nombre, apellido, usuario, telefono, direccion, numero_documento,
              COALESCE(activo, true)            AS activo,
              usuario LIKE '%@anonimo.local'    AS anonimizado
       FROM persona
       WHERE empresa_id = $1 AND rol_id = 4
       ORDER BY COALESCE(activo, true) DESC, nombre`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

// ✅ Nueva — búsqueda en tiempo real para el POS
export const buscarClientes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { q } = req.query;

    const result = await pool.query(
      `SELECT id, nombre, apellido, numero_documento, telefono
       FROM persona
       WHERE empresa_id = $1 AND rol_id = 4 AND activo IS NOT FALSE
         AND (nombre ILIKE $2 OR apellido ILIKE $2 OR numero_documento ILIKE $2)
       ORDER BY nombre
       LIMIT 10`,
      [empresa_id, `%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error en la búsqueda" });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const {
      nombre,
      apellido,
      usuario,
      contrasena,
      telefono,
      direccion,
      numero_documento,
      tipo_documento,   // ← agregar
      id_municipio      // ← agregar
    } = req.body;

    const tieneAcceso = usuario && contrasena;

    const usuarioFinal = tieneAcceso
      ? usuario
      : (numero_documento || `cliente_${Date.now()}`);

    const contrasenaFinal = tieneAcceso
      ? await bcrypt.hash(contrasena, 10)
      : await bcrypt.hash(`sin_acceso_${Date.now()}`, 10);

    const result = await pool.query(
      `INSERT INTO persona 
      (empresa_id, nombre, apellido, usuario, contrasena, telefono, direccion, 
       numero_documento, tipo_documento, id_municipio, rol_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,4)
      RETURNING id, nombre, apellido, usuario, numero_documento`,
      [
        empresa_id,
        nombre,
        apellido,
        usuarioFinal,
        contrasenaFinal,
        telefono       || null,
        direccion      || null,
        numero_documento || null,
        tipo_documento || 'Cédula de ciudadanía',
        id_municipio   ? Number(id_municipio) : null  // ← castear a número
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "El usuario ya existe" });
    }
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const { nombre, apellido, telefono, direccion } = req.body;

    const result = await pool.query(
      `UPDATE persona
       SET nombre=$1, apellido=$2, telefono=$3, direccion=$4
       WHERE id=$5 AND empresa_id=$6 AND rol_id=4
       RETURNING *`,
      [nombre, apellido, telefono, direccion, id, empresa_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
};

// Solo se elimina de verdad un cliente sin historial; con compras se desactiva o anonimiza (como Shopify)
export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const { rows: [historial] } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM ventas         WHERE cliente_id = $1)::int AS ventas,
              (SELECT COUNT(*) FROM pedidos_online WHERE cliente_id = $1)::int AS pedidos`,
      [id]
    );

    if (historial.ventas > 0 || historial.pedidos > 0) {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: `El cliente tiene ${historial.ventas} venta(s) y ${historial.pedidos} pedido(s) en línea. ` +
               "Para conservar el historial, desactívalo o borra sus datos personales.",
      });
    }

    const result = await pool.query(
      `DELETE FROM persona
       WHERE id = $1 AND empresa_id = $2 AND rol_id = 4`,
      [id, empresa_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Cliente no encontrado" });

    res.json({ message: "Cliente eliminado" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: "El cliente tiene registros asociados (por ejemplo, referidos). Desactívalo o borra sus datos personales.",
      });
    }
    console.error(error);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
};

export const cambiarEstadoCliente = async (req, res) => {
  try {
    const { rows: [cliente] } = await pool.query(
      `UPDATE persona SET activo = NOT COALESCE(activo, true)
       WHERE id = $1 AND empresa_id = $2 AND rol_id = 4
       RETURNING id, activo`,
      [req.params.id, req.user.empresa_id]
    );
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar el estado del cliente" });
  }
};

// Derecho de supresión (Ley 1581 de 2012): borra los datos personales y conserva las compras
export const anonimizarCliente = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const contrasenaInutil = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

    await client.query("BEGIN");
    const { rows: [cliente] } = await client.query(
      `UPDATE persona SET
         nombre = 'Cliente', apellido = 'eliminado',
         usuario = 'eliminado_' || id || '@anonimo.local',
         contrasena = $3,
         telefono = NULL, direccion = NULL,
         tipo_documento = NULL, numero_documento = NULL, id_municipio = NULL,
         reset_token = NULL, reset_token_expiry = NULL,
         activo = false
       WHERE id = $1 AND empresa_id = $2 AND rol_id = 4
       RETURNING id`,
      [id, req.user.empresa_id, contrasenaInutil]
    );
    if (!cliente) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    await client.query(
      `UPDATE pedidos_online SET direccion_entrega = 'Dato eliminado' WHERE cliente_id = $1`, [id]
    );
    await client.query(`DELETE FROM carritos WHERE cliente_id = $1`, [id]);
    await client.query("COMMIT");

    res.json({ message: "Datos personales eliminados" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error al borrar los datos del cliente" });
  } finally {
    client.release();
  }
};

export const registrarClientePublico = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      usuario,
      contrasena,
      telefono,
      direccion,
      tipo_documento,
      numero_documento,
      id_municipio,
      empresa_id,
      codigo_referido_invitante, // código del cliente que refirió
    } = req.body;

    const hashedPassword  = await bcrypt.hash(contrasena, 10);
    const codigoPropio    = generarCodigo(nombre); // código único del nuevo cliente

    const result = await pool.query(
      `INSERT INTO persona (
        nombre, apellido, usuario, contrasena,
        telefono, direccion, tipo_documento,
        numero_documento, rol_id, id_municipio, codigo_referido
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,4,$9,$10)
      RETURNING *`,
      [
        nombre, apellido, usuario, hashedPassword,
        telefono, direccion, tipo_documento,
        numero_documento, id_municipio, codigoPropio,
      ]
    );

    const nuevoCliente = result.rows[0];

    // 🔔 Notificación nuevo cliente
    if (empresa_id) {
      crearNotificacion({
        empresa_id,
        tipo:          "nuevo_cliente",
        titulo:        "Nuevo cliente registrado",
        mensaje:       `${nombre} ${apellido} se registró en la tienda.`,
        seccion:       "clientes",
        referencia_id: nuevoCliente.id,
      });
    }

    // 🤝 Procesar referido si llegó con un código
    if (codigo_referido_invitante && empresa_id) {
      try {
        const { rows: [referidor] } = await pool.query(
          `SELECT id FROM persona WHERE codigo_referido=$1`, [codigo_referido_invitante]
        );

        if (referidor && referidor.id !== nuevoCliente.id) {
          // Anti-abuso: verificar límite de 3 referidos desde la misma IP en 72h
          const ip = req.ip || req.headers["x-forwarded-for"] || null;
          const { rows: [limiteIp] } = await pool.query(
            `SELECT COUNT(*) AS total FROM referidos
             WHERE empresa_id=$1 AND ip_registro=$2
             AND creado_en >= NOW() - INTERVAL '72 hours'`,
            [empresa_id, ip]
          );

          if (parseInt(limiteIp.total) < 3) {
            // Obtener nivel actual del referidor para calcular el descuento
            const { rows: pos }    = await pool.query(
              `SELECT COALESCE(SUM(total),0) AS total FROM ventas
               WHERE cliente_id=$1 AND empresa_id=$2
               AND DATE_TRUNC('month',fecha)=DATE_TRUNC('month',NOW())`,
              [referidor.id, empresa_id]
            );
            const { rows: online } = await pool.query(
              `SELECT COALESCE(SUM(total),0) AS total FROM pedidos_online
               WHERE cliente_id=$1 AND empresa_id=$2
               AND DATE_TRUNC('month',fecha_pedido)=DATE_TRUNC('month',NOW())
               AND estado!='cancelado'`,
              [referidor.id, empresa_id]
            );
            const totalMes = parseFloat(pos[0].total) + parseFloat(online[0].total);
            const { rows: niveles } = await pool.query(
              `SELECT * FROM niveles_lealtad
               WHERE empresa_id=$1 AND activo=true AND monto_minimo<=$2
               ORDER BY monto_minimo DESC LIMIT 1`,
              [empresa_id, totalMes]
            );
            const nivelId = niveles[0]?.id ?? null;

            // Config de descuento para el amigo
            let { rows: [configAmigo] } = await pool.query(
              `SELECT * FROM referidos_config_amigo
               WHERE empresa_id=$1 AND activo=true
               AND nivel_id IS NOT DISTINCT FROM $2 LIMIT 1`,
              [empresa_id, nivelId]
            );
            if (!configAmigo) {
              const { rows: [fallback] } = await pool.query(
                `SELECT * FROM referidos_config_amigo
                 WHERE empresa_id=$1 AND nivel_id IS NULL AND activo=true LIMIT 1`,
                [empresa_id]
              );
              configAmigo = fallback || { descuento_pct: 5, envio_gratis: false };
            }

            await pool.query(
              `INSERT INTO referidos
                 (empresa_id, referidor_id, referido_id, codigo_usado,
                  descuento_amigo_pct, envio_gratis_amigo, ip_registro)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                empresa_id, referidor.id, nuevoCliente.id,
                codigo_referido_invitante,
                configAmigo.descuento_pct, configAmigo.envio_gratis || false, ip,
              ]
            );
          }
        }
      } catch (refErr) {
        console.error("Error procesando referido en registro:", refErr.message);
        // No interrumpe el registro
      }
    }

    const token = generarToken(nuevoCliente);

    res.json({
      message:         "Cliente registrado correctamente",
      token,
      cliente_id:      nuevoCliente.id,
      usuario:         nuevoCliente.usuario,
      nombre:          nuevoCliente.nombre,
      rol_id:          nuevoCliente.rol_id,
      codigo_referido: codigoPropio,
    });

  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso. Elegí otro." });
    }
    res.status(500).json({ error: "Error al registrar cliente" });
  }
};

export const loginCliente = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
    }

    const result = await pool.query(
      `SELECT id, nombre, apellido, usuario, rol_id, contrasena, activo
       FROM persona WHERE usuario = $1`,
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];

    // Solo clientes públicos (sin empresa_id, rol 4)
    if (user.rol_id !== 4) {
      return res.status(403).json({ error: "Acceso no permitido" });
    }

    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    if (user.activo === false) {
      return res.status(403).json({ error: "Esta cuenta está desactivada. Comunícate con la tienda." });
    }

    const token = generarToken(user);

    res.json({
      token,
      cliente_id: user.id,      // ✅ necesario para el payload del pedido
      usuario:    user.usuario,
      nombre:     user.nombre,
      rol_id:     user.rol_id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login de cliente" });
  }
};


export const loginGoogleCliente = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Credencial de Google requerida" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, given_name, family_name, sub: google_id } = ticket.getPayload();

    const existing = await pool.query(
      "SELECT id, nombre, apellido, usuario, rol_id, activo FROM persona WHERE usuario = $1 AND rol_id = 4",
      [email]
    );

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (user.activo === false) {
        return res.status(403).json({ error: "Esta cuenta está desactivada. Comunícate con la tienda." });
      }
    } else {
      const randomPass = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
      const codigoPropio = generarCodigo(given_name || "CLI");
      const inserted = await pool.query(
        `INSERT INTO persona (nombre, apellido, usuario, contrasena, rol_id, codigo_referido)
         VALUES ($1, $2, $3, $4, 4, $5)
         RETURNING id, nombre, apellido, usuario, rol_id`,
        [given_name || "Usuario", family_name || "Google", email, randomPass, codigoPropio]
      );
      user = inserted.rows[0];
    }

    const token = generarToken(user);
    res.json({
      token,
      cliente_id: user.id,
      usuario:    user.usuario,
      nombre:     user.nombre,
      rol_id:     user.rol_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión con Google" });
  }
};

// ✅ GET perfil del cliente logueado
export const getPerfilCliente = async (req, res) => {
  try {
    const id = req.user.id;
    const result = await pool.query(
      `SELECT id, nombre, apellido, usuario, telefono, direccion,
              tipo_documento, numero_documento
       FROM persona WHERE id = $1 AND rol_id = 4`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

// ✅ PUT actualizar perfil del cliente logueado
export const actualizarPerfilCliente = async (req, res) => {
  try {
    const id = req.user.id;
    const { nombre, apellido, telefono, direccion } = req.body;

    const result = await pool.query(
      `UPDATE persona
       SET nombre=$1, apellido=$2, telefono=$3, direccion=$4
       WHERE id=$5 AND rol_id=4
       RETURNING id, nombre, apellido, usuario, telefono, direccion`,
      [nombre, apellido, telefono, direccion, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
};

// ✅ PUT cambiar contraseña del cliente
export const cambiarContrasenaCliente = async (req, res) => {
  try {
    const id = req.user.id;
    const { contrasena_actual, contrasena_nueva } = req.body;

    const result = await pool.query(
      "SELECT contrasena FROM persona WHERE id = $1",
      [id]
    );

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
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
};

// ── POST /api/clientes/recuperar-contrasena ───────────────────────────────────
export const solicitarRecuperacion = async (req, res) => {
  try {
    const { usuario } = req.body; // usuario = email del cliente
    if (!usuario) return res.status(400).json({ error: "El correo es obligatorio" });

    const result = await pool.query(
      "SELECT id, nombre FROM persona WHERE usuario = $1 AND rol_id = 4",
      [usuario.trim().toLowerCase()]
    );

    // Siempre responder "ok" aunque no exista (seguridad — no revelar si existe la cuenta)
    if (result.rows.length === 0) {
      return res.json({ ok: true });
    }

    const persona = result.rows[0];
    const token   = crypto.randomBytes(32).toString("hex");
    const expiry  = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      "UPDATE persona SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3",
      [token, expiry, persona.id]
    );

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    await enviarEmailRecuperacion(usuario, persona.nombre, token, baseUrl);

    res.json({ ok: true });
  } catch (error) {
    console.error("Error solicitarRecuperacion:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
};

// ── POST /api/clientes/resetear-contrasena ────────────────────────────────────
export const resetearContrasena = async (req, res) => {
  try {
    const { token, contrasena_nueva } = req.body;

    if (!token || !contrasena_nueva) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
    if (contrasena_nueva.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const result = await pool.query(
      "SELECT id FROM persona WHERE reset_token=$1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "El enlace no es válido o ya expiró" });
    }

    const hashed = await bcrypt.hash(contrasena_nueva, 10);
    await pool.query(
      "UPDATE persona SET contrasena=$1, reset_token=NULL, reset_token_expiry=NULL WHERE id=$2",
      [hashed, result.rows[0].id]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("Error resetearContrasena:", error);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};