// Prepara los datos de demostración para el video usando la API (así se aplican las mismas reglas que en la app:
// cálculo del nivel de lealtad, descuentos, referidos, etc.). No toca la base de datos directamente.
//
// Qué crea (y es seguro repetirlo):
//   1. "Cliente Demo": lo registra (o inicia sesión si ya existe).
//   2. Le hace ventas en el punto de venta (efectivo) hasta que alcance un nivel de lealtad.
//   3. "Cliente Referido": se registra con el código del Cliente Demo (aparece en el módulo Referidos).
//
// Las contraseñas NO van en el archivo: se pasan por variables de entorno al ejecutarlo.
//
//   PowerShell:
//     $env:ADMIN_USER="correo-del-administrador"; $env:ADMIN_PASS="..."; $env:CLIENTE_PASS="..."
//     node scripts/preparar_demo.mjs            # ejecuta contra producción
//     node scripts/preparar_demo.mjs --simulacro  # solo muestra qué haría, sin llamar a la API
//
// Opcionales: API_URL (por defecto la de producción), EMPRESA_ID (por defecto 2), MAX_VENTAS (por defecto 8).

const API        = (process.env.API_URL || "https://merkai-backend.onrender.com/api").replace(/\/$/, "");
const EMPRESA_ID = Number(process.env.EMPRESA_ID || 2);
const MAX_VENTAS = Number(process.env.MAX_VENTAS || 8);
const SIMULACRO  = process.argv.includes("--simulacro");

const { ADMIN_USER, ADMIN_PASS, CLIENTE_PASS } = process.env;
const DEMO = { nombre: "Cliente", apellido: "Demo", usuario: "cliente.demo@merkai-demo.com" };
const REFERIDO = { nombre: "Cliente", apellido: "Referido", usuario: "cliente.referido@merkai-demo.com" };

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

async function registrarOEntrar(persona, extra = {}) {
  const alta = await llamar("POST", "/clientes/registro", {
    ...persona, contrasena: CLIENTE_PASS, telefono: "3000000000", empresa_id: EMPRESA_ID, ...extra,
  });
  if (alta.ok) return { ...alta.data, creado: true };
  if (alta.status === 400) { // el usuario ya existe: se inicia sesión
    const login = await llamar("POST", "/clientes/login", { usuario: persona.usuario, contrasena: CLIENTE_PASS });
    if (login.ok) return { ...login.data, creado: false };
    throw new Error(`${persona.usuario} ya existe pero la contraseña no coincide (${login.data?.error || login.status}).`);
  }
  throw new Error(`No se pudo registrar a ${persona.usuario}: ${alta.data?.error || alta.status}`);
}

(async () => {
  log(`API: ${API}  |  empresa_id: ${EMPRESA_ID}  ${SIMULACRO ? "(SIMULACRO: no se llama a la API)" : ""}`);
  if (!SIMULACRO && (!ADMIN_USER || !ADMIN_PASS || !CLIENTE_PASS)) {
    throw new Error("Faltan variables de entorno: ADMIN_USER, ADMIN_PASS y CLIENTE_PASS.");
  }
  log("Plan:");
  log(`  1. Iniciar sesión como administrador y buscar el método de pago «efectivo» y un producto con stock.`);
  log(`  2. Registrar (o entrar como) ${DEMO.usuario}.`);
  log(`  3. Vender 1 unidad en el punto de venta al Cliente Demo, hasta ${MAX_VENTAS} veces, hasta que tenga nivel de lealtad.`);
  log(`  4. Registrar ${REFERIDO.usuario} con el código de referido del Cliente Demo.`);
  if (SIMULACRO) return;

  // 1. Administrador, método de pago y producto
  const adm = await llamar("POST", "/auth/login", { usuario: ADMIN_USER, contrasena: ADMIN_PASS });
  if (!adm.ok || !adm.data?.token) throw new Error(`Inicio de sesión del administrador falló: ${adm.data?.error || adm.status}`);
  const tokenAdm = adm.data.token;
  const metodos = await llamar("GET", "/metodo_pago");
  const efectivo = (metodos.data || []).find((m) => String(m.metodo).toLowerCase() === "efectivo");
  if (!efectivo) throw new Error("No encontré el método de pago «efectivo».");
  const prods = await llamar("GET", "/productos", null, tokenAdm);
  const lista = Array.isArray(prods.data) ? prods.data : (prods.data?.productos || []);
  const producto = lista
    .filter((p) => p.activo !== false && Number(p.stock) >= MAX_VENTAS + 2)
    .sort((a, b) => Number(b.precio) - Number(a.precio))[0]; // el más caro: se llega al nivel con menos ventas
  if (!producto) throw new Error("No hay un producto con stock suficiente para las ventas de prueba.");
  log(`Producto de prueba: ${producto.nombre} ($${producto.precio}, stock ${producto.stock})`);

  // 2. Cliente Demo
  const demo = await registrarOEntrar(DEMO);
  log(`${demo.creado ? "Registrado" : "Ya existía"}: ${DEMO.usuario} (id ${demo.cliente_id})`);

  // 3. Ventas hasta alcanzar un nivel
  const estado = async () => (await llamar("GET", `/clientes/${demo.cliente_id}/vista360`, null, tokenAdm)).data?.lealtad;
  let lealtad = await estado();
  for (let i = 0; i < MAX_VENTAS && !lealtad?.nivel_actual; i++) {
    const v = await llamar("POST", "/ventas", {
      cliente_id: demo.cliente_id, metodo_pago_id: efectivo.id, productos: [{ producto_id: producto.id, cantidad: 1 }],
    }, tokenAdm);
    if (!v.ok) throw new Error(`La venta falló: ${v.data?.error || v.status}`);
    lealtad = await estado();
    log(`  venta ${i + 1}: total del mes $${lealtad?.total_mes}  nivel: ${lealtad?.nivel_actual?.nombre || "(aún ninguno)"}`);
  }
  if (!lealtad?.nivel_actual) log("  Aviso: no alcanzó nivel; baja el monto mínimo del nivel en Lealtad o sube MAX_VENTAS.");

  // 4. Cliente referido
  let codigo = demo.codigo_referido;
  if (!codigo) {
    const info = await llamar("GET", `/referidos/mi-info?empresa_id=${EMPRESA_ID}`, null, demo.token);
    codigo = info.data?.codigo_referido || info.data?.codigo;
  }
  if (codigo) {
    const ref = await registrarOEntrar(REFERIDO, { codigo_referido_invitante: codigo });
    log(`${ref.creado ? "Registrado" : "Ya existía"}: ${REFERIDO.usuario} (referido con el código ${codigo})`);
  } else {
    log("Aviso: no pude obtener el código de referido del Cliente Demo; regístralo a mano desde su enlace.");
  }
  log("Listo. Revisa Clientes 360 y Referidos en el panel.");
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
