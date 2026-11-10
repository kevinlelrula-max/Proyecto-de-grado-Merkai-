import pool from "../config/db.js";
import { calcularDescuento } from "../utils/calcularPedido.js";

// ── GET /api/cupones ──────────────────────────────────────────────────────────
export const getCupones = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const result = await pool.query(
      `SELECT c.*,
              COALESCE(
                (SELECT COALESCE(SUM(cu.descuento_aplicado), 0)
                 FROM cupones_usos cu WHERE cu.cupon_id = c.id),
                0
              ) AS total_ahorrado
       FROM cupones c
       WHERE c.empresa_id = $1
       ORDER BY c.creado_en DESC`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getCupones:", error);
    res.status(500).json({ error: "Error al obtener cupones" });
  }
};

// ── POST /api/cupones ─────────────────────────────────────────────────────────
export const crearCupon = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const {
      codigo,
      descripcion,
      tipo,
      valor,
      minimo_compra,
      maximo_descuento,
      usos_totales,
      usos_por_cliente,
      fecha_inicio,
      fecha_fin,
    } = req.body;

    if (!codigo || !tipo || valor === undefined) {
      return res.status(400).json({ error: "Código, tipo y valor son obligatorios" });
    }

    const tiposValidos = ["porcentaje", "valor_fijo", "envio_gratis"];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: "Tipo de descuento no válido" });
    }

    if (tipo === "porcentaje" && (valor <= 0 || valor > 100)) {
      return res.status(400).json({ error: "El porcentaje debe ser entre 1 y 100" });
    }

    const result = await pool.query(
      `INSERT INTO cupones
         (empresa_id, codigo, descripcion, tipo, valor,
          minimo_compra, maximo_descuento, usos_totales,
          usos_por_cliente, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        empresa_id,
        codigo.trim().toUpperCase(),
        descripcion || null,
        tipo,
        valor,
        minimo_compra || 0,
        maximo_descuento || null,
        usos_totales || null,
        usos_por_cliente || 1,
        fecha_inicio || new Date(),
        fecha_fin || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ya existe un cupón con ese código" });
    }
    console.error("Error crearCupon:", error);
    res.status(500).json({ error: "Error al crear el cupón" });
  }
};

// ── PUT /api/cupones/:id ──────────────────────────────────────────────────────
export const actualizarCupon = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id }     = req.params;
    const {
      codigo,
      descripcion,
      tipo,
      valor,
      minimo_compra,
      maximo_descuento,
      usos_totales,
      usos_por_cliente,
      fecha_inicio,
      fecha_fin,
    } = req.body;

    const result = await pool.query(
      `UPDATE cupones
       SET codigo           = $1,
           descripcion      = $2,
           tipo             = $3,
           valor            = $4,
           minimo_compra    = $5,
           maximo_descuento = $6,
           usos_totales     = $7,
           usos_por_cliente = $8,
           fecha_inicio     = $9,
           fecha_fin        = $10
       WHERE id = $11 AND empresa_id = $12
       RETURNING *`,
      [
        codigo.trim().toUpperCase(),
        descripcion || null,
        tipo,
        valor,
        minimo_compra || 0,
        maximo_descuento || null,
        usos_totales || null,
        usos_por_cliente || 1,
        fecha_inicio || new Date(),
        fecha_fin || null,
        id,
        empresa_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cupón no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ya existe un cupón con ese código" });
    }
    console.error("Error actualizarCupon:", error);
    res.status(500).json({ error: "Error al actualizar el cupón" });
  }
};

// ── PATCH /api/cupones/:id/toggle ─────────────────────────────────────────────
export const toggleCupon = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id }     = req.params;

    const result = await pool.query(
      `UPDATE cupones
       SET activo = NOT activo
       WHERE id = $1 AND empresa_id = $2
       RETURNING id, activo`,
      [id, empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cupón no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error toggleCupon:", error);
    res.status(500).json({ error: "Error al cambiar estado del cupón" });
  }
};

// ── DELETE /api/cupones/:id ───────────────────────────────────────────────────
export const eliminarCupon = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id }     = req.params;

    // Un cupón usado queda en el historial de pedidos y descuentos; se desactiva en vez de borrarse
    const { rows: [usos] } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM cupones_usos   WHERE cupon_id = $1)
            + (SELECT COUNT(*) FROM pedidos_online WHERE cupon_id = $1) AS total`,
      [id]
    );
    if (Number(usos.total) > 0) {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: "Este cupón ya se usó en pedidos. Desactívalo para que no se pueda volver a usar.",
      });
    }

    const result = await pool.query(
      `DELETE FROM cupones WHERE id = $1 AND empresa_id = $2 RETURNING id`,
      [id, empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cupón no encontrado" });
    }

    res.json({ ok: true });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        code: "TIENE_HISTORIAL",
        error: "Este cupón tiene registros asociados. Desactívalo en su lugar.",
      });
    }
    console.error("Error eliminarCupon:", error);
    res.status(500).json({ error: "Error al eliminar el cupón" });
  }
};

// ── GET /api/cupones/:id/usos ─────────────────────────────────────────────────
export const getUsosCupon = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const { id }     = req.params;

    // Verificar que el cupón pertenece a la empresa
    const cupon = await pool.query(
      `SELECT id FROM cupones WHERE id = $1 AND empresa_id = $2`,
      [id, empresa_id]
    );
    if (cupon.rows.length === 0) {
      return res.status(404).json({ error: "Cupón no encontrado" });
    }

    const result = await pool.query(
      `SELECT cu.id,
              cu.descuento_aplicado,
              cu.fecha,
              cu.pedido_id,
              p.nombre    AS cliente_nombre,
              p.apellido  AS cliente_apellido
       FROM cupones_usos cu
       LEFT JOIN persona p ON p.id = cu.cliente_id
       WHERE cu.cupon_id = $1
       ORDER BY cu.fecha DESC
       LIMIT 50`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getUsosCupon:", error);
    res.status(500).json({ error: "Error al obtener usos del cupón" });
  }
};

// ── POST /api/cupones/validar ─────────────────────────────────────────────────
// Endpoint público — valida el código y devuelve el descuento calculado
export const validarCupon = async (req, res) => {
  try {
    const { codigo, empresa_id, subtotal, costo_envio, cliente_id } = req.body;

    if (!codigo || !empresa_id || subtotal === undefined) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // Buscar el cupón
    const result = await pool.query(
      `SELECT * FROM cupones
       WHERE empresa_id = $1
         AND codigo = $2`,
      [empresa_id, codigo.trim().toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cupón no válido" });
    }

    const cupon = result.rows[0];

    // Validaciones
    if (!cupon.activo) {
      return res.status(400).json({ error: "Este cupón no está activo" });
    }

    const ahora = new Date();
    if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) {
      return res.status(400).json({ error: "Este cupón aún no está vigente" });
    }
    if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
      return res.status(400).json({ error: "Este cupón ha expirado" });
    }

    if (cupon.usos_totales !== null && cupon.usos_actuales >= cupon.usos_totales) {
      return res.status(400).json({ error: "Este cupón ya alcanzó el límite de usos" });
    }

    if (parseFloat(subtotal) < parseFloat(cupon.minimo_compra)) {
      return res.status(400).json({
        error: `El pedido mínimo para este cupón es $${Number(cupon.minimo_compra).toLocaleString("es-CO")}`,
      });
    }

    // Verificar usos por cliente
    if (cliente_id && cupon.usos_por_cliente !== null) {
      const usosCliente = await pool.query(
        `SELECT COUNT(*) AS total FROM cupones_usos
         WHERE cupon_id = $1 AND cliente_id = $2`,
        [cupon.id, cliente_id]
      );
      if (parseInt(usosCliente.rows[0].total) >= cupon.usos_por_cliente) {
        return res.status(400).json({ error: "Ya usaste este cupón el máximo de veces permitidas" });
      }
    }

    const descuento = calcularDescuento(cupon, parseFloat(subtotal), parseFloat(costo_envio || 0));

    res.json({
      valido:      true,
      cupon_id:    cupon.id,
      codigo:      cupon.codigo,
      descripcion: cupon.descripcion,
      tipo:        cupon.tipo,
      descuento,
    });
  } catch (error) {
    console.error("Error validarCupon:", error);
    res.status(500).json({ error: "Error al validar el cupón" });
  }
};

// ── GET /api/cupones/activos/:empresa_id ─────────────────────────────────────
// Público — muestra cupones vigentes en la tienda
export const getCuponesActivos = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    const result = await pool.query(
      `SELECT codigo, descripcion, tipo, valor, minimo_compra, fecha_fin
       FROM cupones
       WHERE empresa_id = $1
         AND activo = TRUE
         AND (fecha_inicio IS NULL OR fecha_inicio <= NOW())
         AND (fecha_fin IS NULL OR fecha_fin >= NOW())
         AND (usos_totales IS NULL OR usos_actuales < usos_totales)
       ORDER BY creado_en DESC
       LIMIT 4`,
      [empresa_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getCuponesActivos:", error);
    res.status(500).json({ error: "Error al obtener cupones activos" });
  }
};
