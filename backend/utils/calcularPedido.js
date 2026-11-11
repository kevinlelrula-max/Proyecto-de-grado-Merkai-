import pool from "../config/db.js";

export class ErrorPedido extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const redondear = (n) => Math.round(n * 100) / 100;

export function calcularDescuento(cupon, subtotal, costoEnvio = 0) {
  if (cupon.tipo === "porcentaje") {
    let desc = subtotal * (parseFloat(cupon.valor) / 100);
    if (cupon.maximo_descuento) desc = Math.min(desc, parseFloat(cupon.maximo_descuento));
    return Math.round(desc);
  }
  if (cupon.tipo === "valor_fijo") {
    return Math.min(parseFloat(cupon.valor), subtotal);
  }
  if (cupon.tipo === "envio_gratis") {
    return costoEnvio;
  }
  return 0;
}

// Compras del mes (POS + online confirmadas) → nivel de lealtad vigente
export async function getNivelLealtadCliente(clienteId, empresaId, db = pool) {
  const [pos, online] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM ventas
       WHERE cliente_id=$1 AND empresa_id=$2
       AND DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())`,
      [clienteId, empresaId]
    ),
    db.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM pedidos_online
       WHERE cliente_id=$1 AND empresa_id=$2
       AND estado NOT IN ('cancelado', 'pendiente')
       AND DATE_TRUNC('month', fecha_pedido) = DATE_TRUNC('month', NOW())`,
      [clienteId, empresaId]
    ),
  ]);
  const totalMes = parseFloat(pos.rows[0].total) + parseFloat(online.rows[0].total);

  const { rows: [nivelGanado] } = await db.query(
    `SELECT * FROM niveles_lealtad
     WHERE empresa_id=$1 AND activo=true AND monto_minimo <= $2
     ORDER BY monto_minimo DESC LIMIT 1`,
    [empresaId, totalMes]
  );

  // Nivel heredado por referido (vigente): vale el mejor entre el ganado y el heredado
  const { rows: [heredado] } = await db.query(
    `SELECT nl.*, r.nivel_heredado_hasta
     FROM referidos r
     JOIN niveles_lealtad nl ON nl.id = r.nivel_heredado_id
     WHERE r.referido_id = $1 AND r.empresa_id = $2
       AND r.nivel_heredado_id IS NOT NULL
       AND r.nivel_heredado_hasta > NOW()
       AND nl.activo = true
     ORDER BY nl.monto_minimo DESC LIMIT 1`,
    [clienteId, empresaId]
  );
  const montoGanado = nivelGanado ? parseFloat(nivelGanado.monto_minimo) : -1;
  if (heredado && heredado.monto_minimo != null && parseFloat(heredado.monto_minimo) > montoGanado) {
    return { totalMes, nivel: heredado, heredado: true, heredado_hasta: heredado.nivel_heredado_hasta };
  }
  return { totalMes, nivel: nivelGanado || null, heredado: false };
}

// ¿El cliente ya tiene compras en la empresa? (ventas del punto de venta o pedidos no cancelados)
// El beneficio de referido es solo para la primera compra.
export async function yaTieneCompras(clienteId, empresaId, db = pool, excluirPedidoId = null) {
  const { rows: [r] } = await db.query(
    `SELECT (
       (SELECT COUNT(*) FROM ventas WHERE cliente_id=$1 AND empresa_id=$2)
     + (SELECT COUNT(*) FROM pedidos_online
        WHERE cliente_id=$1 AND empresa_id=$2 AND estado <> 'cancelado' AND id <> COALESCE($3, 0))
     ) AS total`,
    [clienteId, empresaId, excluirPedidoId]
  );
  return parseInt(r.total) > 0;
}

// El precio más bajo entre: normal, mayoreo y normal con descuento de lealtad (igual que la tienda)
export function precioInteligente(producto, descuentoLealtad) {
  const precio = parseFloat(producto.precio);
  const precios = [precio];
  const mayoreo = parseFloat(producto.precio_mayoreo);
  if (mayoreo > 0) precios.push(mayoreo);
  if (descuentoLealtad > 0) precios.push(precio * (1 - descuentoLealtad / 100));
  return Math.min(...precios);
}

export function tieneEnvioConfigurado(empresa) {
  return (parseFloat(empresa.envio_costo) || 0) > 0
    || Object.keys(empresa.envio_costos_departamentos || {}).length > 0;
}

function costoEnvioDepartamento(empresa, departamentoId) {
  if (!(Number(departamentoId) > 0)) return 0;
  const costos = empresa.envio_costos_departamentos || {};
  const key = String(departamentoId);
  if (key in costos) return Number(costos[key]);
  return parseFloat(empresa.envio_costo) || 0;
}

async function validarCupon(db, cuponId, empresaId, clienteId, subtotal) {
  const { rows: [cupon] } = await db.query(
    "SELECT * FROM cupones WHERE id = $1 AND empresa_id = $2", [cuponId, empresaId]
  );
  if (!cupon || !cupon.activo) throw new ErrorPedido(400, "El cupón ya no es válido. Quítalo e intenta de nuevo.");

  const ahora = new Date();
  if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) throw new ErrorPedido(400, "El cupón aún no está vigente.");
  if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) throw new ErrorPedido(400, "El cupón ha expirado.");
  if (cupon.usos_totales !== null && cupon.usos_actuales >= cupon.usos_totales) {
    throw new ErrorPedido(400, "El cupón ya alcanzó el límite de usos.");
  }
  if (subtotal < parseFloat(cupon.minimo_compra)) {
    throw new ErrorPedido(400, `El pedido mínimo para este cupón es $${Number(cupon.minimo_compra).toLocaleString("es-CO")}.`);
  }
  if (cupon.usos_por_cliente !== null) {
    const { rows: [usos] } = await db.query(
      "SELECT COUNT(*) AS total FROM cupones_usos WHERE cupon_id = $1 AND cliente_id = $2",
      [cupon.id, clienteId]
    );
    if (parseInt(usos.total) >= cupon.usos_por_cliente) {
      throw new ErrorPedido(400, "Ya usaste este cupón el máximo de veces permitidas.");
    }
  }
  return cupon;
}

// Recalcula el pedido con datos de la base; nunca confía en precios ni totales del navegador
export async function calcularPedido({ empresa_id, cliente_id, detalle, cupon_id, departamento_id }, db = pool) {
  if (!Array.isArray(detalle) || detalle.length === 0) {
    throw new ErrorPedido(400, "El pedido debe tener al menos un producto");
  }

  const cantidades = new Map();
  for (const item of detalle) {
    const id = Number(item.producto_id);
    const cantidad = Number(item.cantidad);
    if (!Number.isInteger(id) || !(cantidad > 0)) {
      throw new ErrorPedido(400, "Cantidad o producto inválido en el pedido");
    }
    cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
  }

  const { rows: productos } = await db.query(
    `SELECT id, nombre, precio, precio_mayoreo, stock, activo
     FROM productos WHERE id = ANY($1::int[]) AND empresa_id = $2`,
    [[...cantidades.keys()], empresa_id]
  );
  const porId = new Map(productos.map(p => [p.id, p]));

  const noDisponibles = [...cantidades.keys()].filter(id => !porId.get(id)?.activo);
  if (noDisponibles.length > 0) {
    throw new ErrorPedido(400, "Algunos productos del carrito ya no están disponibles. Actualiza tu carrito.",
      { productos_no_disponibles: noDisponibles });
  }
  for (const [id, cantidad] of cantidades) {
    const p = porId.get(id);
    if (parseFloat(p.stock) < cantidad) {
      throw new ErrorPedido(400, `Stock insuficiente para ${p.nombre}. Disponible: ${p.stock}`);
    }
  }

  const { nivel } = await getNivelLealtadCliente(cliente_id, empresa_id, db);
  const descuentoLealtad = nivel ? parseFloat(nivel.descuento_porcentaje) || 0 : 0;

  const items = [...cantidades].map(([id, cantidad]) => ({
    producto_id: id,
    cantidad,
    precio_unitario: redondear(precioInteligente(porId.get(id), descuentoLealtad)),
  }));
  const subtotal = redondear(items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0));

  const { rows: [empresa] } = await db.query(
    "SELECT envio_costo, envio_costos_departamentos FROM empresas WHERE id = $1", [empresa_id]
  );
  if (!empresa) throw new ErrorPedido(404, "Tienda no encontrada");
  if (tieneEnvioConfigurado(empresa) && !(Number(departamento_id) > 0)) {
    throw new ErrorPedido(400, "Selecciona el departamento de envío para continuar.");
  }
  const costoEnvio = costoEnvioDepartamento(empresa, departamento_id);

  const { rows: [referido] } = await db.query(
    `SELECT descuento_amigo_pct, envio_gratis_amigo FROM referidos
     WHERE referido_id = $1 AND empresa_id = $2 AND estado = 'registrado' LIMIT 1`,
    [cliente_id, empresa_id]
  );
  // El beneficio del amigo es solo para su primera compra: con un pedido previo no cancelado (o una venta) no aplica
  const referidoVigente = referido && !(await yaTieneCompras(cliente_id, empresa_id, db));
  const descuentoReferido = referidoVigente ? Math.round(subtotal * parseFloat(referido.descuento_amigo_pct || 0) / 100) : 0;
  const costoEnvioEfectivo = referidoVigente && referido.envio_gratis_amigo ? 0 : costoEnvio;

  let cupon = null;
  let descuentoCupon = 0;
  if (cupon_id) {
    cupon = await validarCupon(db, cupon_id, empresa_id, cliente_id, subtotal);
    descuentoCupon = calcularDescuento(cupon, subtotal, costoEnvio);
  }

  const total = redondear(Math.max(0, subtotal + costoEnvioEfectivo - descuentoCupon - descuentoReferido));

  return {
    items,
    subtotal,
    costo_envio: costoEnvioEfectivo,
    descuento_cupon: descuentoCupon,
    descuento_referido: descuentoReferido,
    total,
    cupon,
  };
}
