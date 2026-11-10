// Puebla la plataforma con clientes, compras, niveles de lealtad y referidos de demostración, para que la versión
// desplegada se vea "viva" en el video. Usa la API (no la base de datos), así que se aplican las mismas reglas que en la app:
// descuentos, nivel de lealtad, stock, referidos y estados de pedido.
//
// Los niveles se alcanzan con compras de cantidad suficiente, SIN tocar los montos de Lealtad: pasa los montos mínimos
// reales de tus niveles en NIVELES (de menor a mayor, separados por coma). Ejemplo: NIVELES="150000,300000,500000".
//
// Contraseñas por variables de entorno (no van en el archivo):
//   $env:ADMIN_USER="correo-del-administrador"; $env:ADMIN_PASS="..."; $env:CLIENTE_PASS="clave-para-los-clientes-demo"
//   $env:NIVELES="150000,300000,500000"; $env:EMPRESA_ID="2"
//   node scripts/poblar_demo.mjs --simulacro   # muestra el plan sin llamar a la API
//   node scripts/poblar_demo.mjs               # ejecuta
// Opcionales: API_URL (por defecto producción), DEPARTAMENTO_ID (por defecto 50, Meta), DOMINIO_CORREO.
//
// Es seguro repetirlo: un cliente que ya existe se omite (no se le vuelven a crear compras).

const API        = (process.env.API_URL || "https://merkai-backend.onrender.com/api").replace(/\/$/, "");
const EMPRESA_ID = Number(process.env.EMPRESA_ID || 2);
const DEPTO_ID   = Number(process.env.DEPARTAMENTO_ID || 50);
const NIVELES    = (process.env.NIVELES || "150000,300000,500000").split(",").map((n) => Number(n.trim())).filter(Boolean);
const SIMULACRO  = process.argv.includes("--simulacro");
const { ADMIN_USER, ADMIN_PASS, CLIENTE_PASS } = process.env;
const DOMINIO    = process.env.DOMINIO_CORREO || "merkai-demo.com";

// nivel = número de nivel que se busca alcanzar (1 = el más bajo, 0 = ninguno, compras pequeñas).
// pos = ventas en el punto de venta; online = pedidos de la tienda y el estado final que se les deja
// (los pendientes y cancelados no cuentan para el nivel). referidoPor = índice de quien lo refirió.
// Ojo: el sistema limita a 3 referidos por IP cada 72 horas, así que solo los 3 primeros quedarán registrados como referidos.
const CLIENTES = [
  { nombre: "Laura",          apellido: "Gómez",   nivel: 3, pos: 5, online: ["entregado", "enviado"] },
  { nombre: "Andrés",         apellido: "Ramírez", nivel: 3, pos: 4, online: ["entregado", "confirmado"] },
  { nombre: "Camila",         apellido: "Torres",  nivel: 2, pos: 3, online: ["confirmado"], referidoPor: 0 },
  { nombre: "Juan",           apellido: "Pérez",   nivel: 2, pos: 3, online: ["enviado"],    referidoPor: 0 },
  { nombre: "Valentina",      apellido: "Rojas",   nivel: 1, pos: 2, online: ["entregado"],  referidoPor: 1 },
  { nombre: "Sebastián",      apellido: "Díaz",    nivel: 1, pos: 2, online: ["entregado"] },
  { nombre: "Daniela",        apellido: "Castro",  nivel: 0, pos: 0, online: ["confirmado"] },
  { nombre: "Felipe",         apellido: "Moreno",  nivel: 0, pos: 1, online: [] },
  { nombre: "María Fernanda", apellido: "León",    nivel: 0, pos: 0, online: ["pendiente"] },
  { nombre: "Santiago",       apellido: "Ortiz",   nivel: 0, pos: 0, online: ["cancelado"] },
];
const quitarTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const correo = (c) => `${quitarTildes(c.nombre).toLowerCase().replace(/\s+/g, "")}.${quitarTildes(c.apellido).toLowerCase()}@${DOMINIO}`;
const log = (...a) => console.log(...a);

async function llamar(metodo, ruta, cuerpo, token) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch { /* sin cuerpo */ }
  return { ok: r.ok, status: r.status, data };
}

(async () => {
  log(`API: ${API}  |  empresa_id: ${EMPRESA_ID}  |  niveles (monto mínimo): ${NIVELES.join(", ")}  ${SIMULACRO ? "(SIMULACRO: no se llama a la API)" : ""}`);
  log("Plan:");
  CLIENTES.forEach((c, i) => log(`  ${String(i + 1).padStart(2)}. ${c.nombre} ${c.apellido} <${correo(c)}> — objetivo: ${c.nivel ? `nivel ${c.nivel}` : "sin nivel"}, ${c.pos} ventas POS, pedidos online: [${c.online.join(", ") || "ninguno"}]${c.referidoPor !== undefined ? `, referido por #${c.referidoPor + 1}` : ""}`));
  if (SIMULACRO) return;
  if (!ADMIN_USER || !ADMIN_PASS || !CLIENTE_PASS) throw new Error("Faltan variables de entorno: ADMIN_USER, ADMIN_PASS y CLIENTE_PASS.");
  if (CLIENTES.some((c) => c.nivel > NIVELES.length)) throw new Error(`NIVELES debe tener al menos 3 montos (tiene ${NIVELES.length}).`);

  const adm = await llamar("POST", "/auth/login", { usuario: ADMIN_USER, contrasena: ADMIN_PASS });
  if (!adm.ok || !adm.data?.token) throw new Error(`Inicio de sesión del administrador falló: ${adm.data?.error || adm.status}`);
  const tokenAdm = adm.data.token;

  const metodos = await llamar("GET", "/metodo_pago");
  const efectivo = (metodos.data || []).find((m) => String(m.metodo).toLowerCase() === "efectivo");
  if (!efectivo) throw new Error("No encontré el método de pago «efectivo».");

  const prods = await llamar("GET", "/productos", null, tokenAdm);
  const lista = (Array.isArray(prods.data) ? prods.data : (prods.data?.productos || [])).filter((p) => p.activo !== false && Number(p.stock) > 0);
  if (lista.length < 3) throw new Error("No hay suficientes productos con stock.");
  const precioMedio = lista.reduce((a, p) => a + Number(p.precio), 0) / lista.length;
  const stock = new Map(lista.map((p) => [p.id, Number(p.stock) - 2])); // se deja un margen de 2 unidades por producto
  let cursor = 0;
  // siguiente producto con stock suficiente para la cantidad pedida (si no alcanza, se usa lo que quede)
  const siguienteProducto = (cantidad = 1) => {
    for (let k = 0; k < lista.length; k++) {
      const p = lista[(cursor++) % lista.length];
      const disp = stock.get(p.id);
      if (disp >= 1) { const cant = Math.min(cantidad, Math.floor(disp)); stock.set(p.id, disp - cant); return { p, cant }; }
    }
    return null;
  };

  const codigos = [];
  for (const [i, c] of CLIENTES.entries()) {
    const usuario = correo(c);
    const invitante = c.referidoPor !== undefined ? codigos[c.referidoPor] : undefined;
    const alta = await llamar("POST", "/clientes/registro", {
      nombre: c.nombre, apellido: c.apellido, usuario, contrasena: CLIENTE_PASS, telefono: `30${String(10000000 + i * 137).slice(0, 8)}`,
      empresa_id: EMPRESA_ID, ...(invitante ? { codigo_referido_invitante: invitante } : {}),
    });
    const cliente = alta.ok ? alta.data : null;
    if (!cliente) {
      if (alta.status === 400) { // ya existía: se entra solo para poder referir, pero no se repiten sus compras
        const login = await llamar("POST", "/clientes/login", { usuario, contrasena: CLIENTE_PASS });
        if (login.ok) {
          const info = await llamar("GET", `/referidos/mi-info?empresa_id=${EMPRESA_ID}`, null, login.data.token);
          codigos[i] = info.data?.codigo_referido || info.data?.codigo;
        }
        log(`- ${c.nombre} ${c.apellido}: ya existía, se omite.`);
        continue;
      }
      throw new Error(`No se pudo registrar a ${usuario}: ${alta.data?.error || alta.status}`);
    }
    codigos[i] = cliente.codigo_referido;
    log(`- ${c.nombre} ${c.apellido}: registrado (id ${cliente.cliente_id})${invitante ? ` con el código de #${c.referidoPor + 1}` : ""}`);

    // Cantidad por compra para llegar al monto del nivel buscado (con margen, porque el descuento de lealtad lo reduce)
    const nCompras = c.pos + c.online.filter((e) => e !== "pendiente" && e !== "cancelado").length;
    const meta = c.nivel ? NIVELES[c.nivel - 1] * 1.12 : 0;
    const cantidad = c.nivel && nCompras ? Math.max(1, Math.ceil(meta / (nCompras * precioMedio))) : 1;

    // Primero los pedidos en línea: el referido se completa con la primera compra y esa debe ser un pedido de la tienda
    for (const estado of c.online) {
      const sel = siguienteProducto(cantidad); if (!sel) break;
      const ped = await llamar("POST", "/pedidos", {
        empresa_id: EMPRESA_ID, metodo_pago_id: efectivo.id, direccion_entrega: "Calle 15 # 30-20, Villavicencio, Meta",
        notas: "Pedido de demostración", departamento_id: DEPTO_ID, detalle: [{ producto_id: sel.p.id, cantidad: sel.cant }],
      }, cliente.token);
      if (!ped.ok) { log(`    pedido online falló: ${ped.data?.error || ped.status}`); continue; }
      if (estado !== "pendiente") {
        const cambio = await llamar("PATCH", `/pedidos/${ped.data.id}/estado`, { estado }, tokenAdm);
        if (!cambio.ok) log(`    no se pudo pasar el pedido ${ped.data.id} a ${estado}: ${cambio.data?.error || cambio.status}`);
      }
    }
    const vender = async () => {
      const sel = siguienteProducto(cantidad); if (!sel) return false;
      const r = await llamar("POST", "/ventas", { cliente_id: cliente.cliente_id, metodo_pago_id: efectivo.id, productos: [{ producto_id: sel.p.id, cantidad: sel.cant }] }, tokenAdm);
      if (!r.ok) log(`    venta POS falló: ${r.data?.error || r.status}`);
      return r.ok;
    };
    for (let v = 0; v < c.pos; v++) await vender();

    // Si por los descuentos no llegó al nivel buscado, se completan ventas hasta lograrlo (máximo 5 extra)
    const leer = async () => (await llamar("GET", `/clientes/${cliente.cliente_id}/vista360`, null, tokenAdm)).data?.lealtad;
    let l = await leer();
    for (let extra = 0; c.nivel && Number(l?.total_mes ?? 0) < NIVELES[c.nivel - 1] && extra < 5; extra++) {
      if (!(await vender())) break;
      l = await leer();
    }
    log(`    total del mes $${l?.total_mes ?? "?"}  nivel: ${l?.nivel_actual?.nombre || "(ninguno)"}  (${cantidad} unidad(es) por compra)`);
  }
  log("Listo. Revisa Clientes, Pedidos, Lealtad y Referidos en el panel.");
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
