import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BtnSoporte from "../components/BtnSoporte";

/* ─── Animación ─── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── Estilos reutilizables ─── */
// Mismo ancho y márgenes laterales para TODA la página (navbar incluido)
const container = "mx-auto w-full max-w-[1760px] px-5 md:px-8 lg:px-12 xl:px-20";

const btn = "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition duration-200 hover:-translate-y-px cursor-pointer";
const btnDark = `${btn} bg-neutral-950 text-white hover:shadow-[0_10px_24px_rgba(0,0,0,0.25)]`;
const btnGhost = `${btn} border border-neutral-300 text-neutral-950 hover:bg-white`;

/* ─── Datos ─── */
const NAV_LINKS = [
  ["#features", "Funcionalidades"],
  ["#tienda", "Tienda online"],
  ["#how", "Cómo funciona"],
  ["#faq", "Preguntas"],
];

const MARQUEE = [
  "Tienda online incluida", "Inventario en tiempo real", "Punto de venta",
  "Multitienda", "Predicción de demanda con IA", "Cupones de descuento",
  "Sistema de referidos", "$0 en comisiones",
];

const FEATURES = [
  {
    icon: "store", title: "Tienda online pública", big: true, dark: true,
    desc: "Cada empresa obtiene una tienda con URL propia donde tus clientes exploran el catálogo y hacen pedidos directamente, sin configurar nada extra.",
  },
  {
    icon: "brain", title: "Predicción de demanda con IA", big: true,
    desc: "Analiza tu historial de ventas y te anticipa qué productos vas a necesitar reponer y cuándo.",
  },
  {
    icon: "package", title: "Inventario en tiempo real",
    desc: "Cada venta actualiza el stock automáticamente y recibes alertas antes de que algo se agote.",
  },
  {
    icon: "pos", title: "Punto de venta (POS)",
    desc: "Registra ventas presenciales con varios métodos de pago, descuentos e historial de transacciones.",
  },
  {
    icon: "buildings", title: "Multitienda",
    desc: "Administra varias empresas desde una sola cuenta, cada una con su entorno aislado.",
  },
];

const STATS = [
  { value: "$0", label: "en comisiones por cada venta" },
  { value: "1", label: "cuenta para todos tus negocios" },
  { value: "24/7", label: "tu tienda online recibiendo pedidos" },
];

const STORE_ITEMS = [
  <>URL propia: <code className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[15px] text-blue-600">merkai.app/tienda/tu-empresa</code></>,
  "Carrito de compras, métodos de pago y seguimiento de pedidos",
  "Notificaciones por correo al comprador y al administrador",
  "Cupones de descuento y sistema de referidos integrado",
];

const STEPS = [
  { n: "01", title: "Crea tu cuenta", desc: "Registra tu empresa en minutos. Sin tarjeta de crédito y sin configuraciones complicadas." },
  { n: "02", title: "Configura tu negocio", desc: "Agrega productos, precios e imágenes, y define los roles de acceso para tu equipo." },
  { n: "03", title: "Empieza a vender", desc: "Tu tienda queda activa de inmediato. Gestiona pedidos, ventas e inventario desde el mismo panel." },
];

const FAQS = [
  { q: "¿Tiene algún costo registrarse?", a: "No. Creas tu cuenta gratis y no necesitas tarjeta de crédito para empezar." },
  { q: "¿Merkai cobra comisión por mis ventas?", a: "No. Merkai no cobra comisiones por las transacciones que haces en tu tienda online ni en el punto de venta." },
  { q: "¿Necesito conocimientos técnicos para crear mi tienda?", a: "No. La tienda online se crea automáticamente al registrar tu empresa. Solo agregas tus productos y queda lista para recibir pedidos." },
  { q: "¿Puedo manejar varios negocios con una sola cuenta?", a: "Sí. Con la función multitienda administras varias empresas y cambias entre ellas sin cerrar sesión." },
  { q: "¿Puedo dar acceso a mi equipo?", a: "Sí. Puedes crear usuarios y asignarles roles para controlar a qué partes del sistema tiene acceso cada persona." },
];

/* ─── Componentes pequeños ─── */
const Serif = ({ children, className = "text-blue-600" }) => (
  <span className={`font-normal text-[1.08em] ${className}`}>
    {children}
  </span>
);

function Eyebrow({ children }) {
  return (
    <span className="mb-5 inline-block rounded-full bg-blue-50 px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-blue-600 md:text-sm">
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <motion.div {...up()} className="mb-12 grid gap-6 md:mb-16 lg:grid-cols-2 lg:items-end lg:gap-20 xl:mb-20">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-4xl font-bold leading-[1.03] tracking-[-0.04em] md:text-[56px] xl:text-[68px]">
          {title}
        </h2>
      </div>
      {desc && (
        <p className="max-w-[560px] text-lg leading-relaxed text-neutral-700 md:text-xl lg:justify-self-end lg:pb-3">
          {desc}
        </p>
      )}
    </motion.div>
  );
}

function Check() {
  return (
    <i className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[13px] font-bold not-italic text-white">
      ✓
    </i>
  );
}

function Icon({ name, size = 24 }) {
  const p = {
    store: <><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>,
    package: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
    pos: <><rect x="2" y="3" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    buildings: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01" /></>,
    brain: <><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 013.76-3.4z" /><path d="M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-3.76-3.4z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
}

function Logo({ size = 28 }) {
  return <img src="/logo-merkai-icon.png" alt="Merkai" width={size} height={size} style={{ objectFit: "contain" }} />;
}

/* ═══════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(0);
  const toRegister = () => navigate("/empresa/registro");
  const toLogin = () => navigate("/empresa/login");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f6f2] font-['Inter','Segoe_UI',sans-serif] text-neutral-950 antialiased">

      {/* ── NAVBAR FLOTANTE (alineado con el contenedor) ── */}
      <nav className="fixed inset-x-0 top-4 z-50">
        <div className={container}>
          <div className="flex w-full items-center justify-between rounded-full border border-neutral-200 bg-white/80 py-2 pl-5 pr-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <a href="#" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
              <Logo /> Merkai
            </a>

            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={href} className="rounded-full px-4 py-2 text-[15px] font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950">
                  {label}
                </a>
              ))}
            </div>

            <div className="flex gap-1.5">
              <button onClick={toLogin} className={`${btnGhost} hidden px-5 py-2.5 text-[15px] sm:inline-flex`}>Iniciar sesión</button>
              <button onClick={toRegister} className={`${btnDark} px-5 py-2.5 text-[15px]`}>Registrarse gratis</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-48 lg:pb-32">
        <div className="pointer-events-none absolute -top-20 left-[-10%] h-[600px] w-[700px] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.13),transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-0 right-[-5%] h-[500px] w-[800px] bg-[radial-gradient(ellipse_at_center,rgba(147,180,255,0.18),transparent_65%)]" />

        <div className={`${container} relative grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-24`}>
          <motion.div {...up(0)} className="text-center lg:text-left">
            <h1 className="mx-auto mb-7 max-w-[680px] text-[44px] font-bold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:mx-0 xl:text-[80px]">
              Tu negocio y tu tienda online, en un solo <Serif>lugar.</Serif>
            </h1>

            <p className="mx-auto mb-10 max-w-[560px] text-lg leading-relaxed text-neutral-700 md:text-xl lg:mx-0">
              Gestiona inventario, ventas y clientes con una tienda online
              incluida desde el primer día, sin costo adicional.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button onClick={toRegister} className={`${btnDark} px-8 py-4 text-[17px]`}>Crear cuenta gratis →</button>
              <button onClick={toLogin} className={`${btnGhost} px-8 py-4 text-[17px]`}>Ya tengo cuenta</button>
            </div>
          </motion.div>

          <motion.div {...up(0.15)}>
            <div className="rounded-[20px] border border-neutral-200 bg-gradient-to-b from-white to-[#efeee9] p-2 shadow-[0_40px_100px_rgba(15,23,42,0.18)] md:rounded-[26px] md:p-3">
              <img
                src="/screenshot-dashboard.png"
                alt="Panel de gestión Merkai"
                className="block w-full rounded-[14px] md:rounded-[18px]"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* ── MARQUEE (ancho completo a propósito) ── */}
      <div className="overflow-hidden border-y border-neutral-200 py-7 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <motion.div
          className="flex w-max gap-14"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 34, ease: "linear", repeat: Infinity }}
        >
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap text-lg font-semibold text-neutral-800 md:text-xl">
              <span className="text-sm text-blue-600">✦</span> {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── CONTENIDO: separación uniforme entre secciones ── */}
      <main className="flex flex-col gap-28 py-28 md:gap-40 md:py-40 xl:gap-48 xl:py-48">

        {/* ── FUNCIONALIDADES (BENTO) ── */}
        <section id="features" className={`${container} scroll-mt-32`}>
          <SectionHeader
            eyebrow="Funcionalidades"
            title={<>Todo lo que tu negocio <Serif>necesita</Serif></>}
            desc="Inventario, ventas, clientes y tienda online conectados y funcionando desde un solo panel."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-6 lg:gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...up(i * 0.06)}
                className={[
                  "relative overflow-hidden rounded-[28px] border p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.07)] md:p-10",
                  f.big ? "md:col-span-3" : "md:col-span-2",
                  f.dark ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white",
                ].join(" ")}
              >
                {f.dark && (
                  <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.5),transparent_70%)]" />
                )}

                <div className="relative mb-5 flex items-center gap-5">
                  <div className={`flex shrink-0 items-center justify-center rounded-[18px] ${f.big ? "h-[68px] w-[68px]" : "h-[60px] w-[60px]"} ${f.dark ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600"}`}>
                    <Icon name={f.icon} size={f.big ? 32 : 28} />
                  </div>
                  <h3 className={`font-bold leading-tight tracking-[-0.02em] ${f.big ? "text-[32px]" : "text-[26px]"}`}>
                    {f.title}
                  </h3>
                </div>

                <p className={`relative text-[19px] leading-[1.65] ${f.big ? "max-w-[620px]" : ""} ${f.dark ? "text-white/85" : "text-neutral-800"}`}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── TIENDA ONLINE: imagen izquierda, texto derecha ── */}
        <section id="tienda" className={`${container} grid scroll-mt-32 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24`}>
          <motion.div {...up(0.1)} className="order-2 lg:order-1">
            <div className="rounded-[20px] border border-neutral-200 bg-white p-2 shadow-[0_30px_80px_rgba(15,23,42,0.14)] md:rounded-[26px] md:p-3">
              <img
                src="/screenshot-tienda.png"
                alt="Tienda online Merkai"
                className="block w-full rounded-[14px] md:rounded-[18px]"
              />
            </div>
          </motion.div>

          <motion.div {...up()} className="order-1 lg:order-2">
            <Eyebrow>Ecommerce incluido</Eyebrow>
            <h2 className="mb-6 text-4xl font-bold leading-[1.03] tracking-[-0.04em] md:text-[56px] xl:text-[64px]">
              Tu tienda pública, lista desde el <Serif>primer día</Serif>
            </h2>
            <p className="mb-8 max-w-[600px] text-lg leading-relaxed text-neutral-700 md:text-xl">
              Al crear tu empresa obtienes automáticamente una tienda online donde tus clientes
              ven el catálogo, agregan productos al carrito y hacen pedidos.
            </p>
            <ul className="mb-10 grid gap-3">
              {STORE_ITEMS.map((item, i) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-6 py-5 text-lg leading-snug text-neutral-800">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={toRegister} className={`${btnDark} px-8 py-4 text-[17px]`}>Crear mi tienda gratis →</button>
          </motion.div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section id="how" className={`${container} scroll-mt-32`}>
          <SectionHeader
            eyebrow="Proceso"
            title={<>Listo en tres <Serif>pasos</Serif></>}
            desc="Del registro a tu primera venta, sin configuraciones complicadas."
          />

          <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...up(i * 0.12)}
                className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-8 md:p-10"
              >
                <span className="pointer-events-none absolute -bottom-6 right-6 font-['Instrument_Serif',Georgia,serif] text-[150px] italic leading-none text-neutral-100">
                  {i + 1}
                </span>

                <div className="relative mb-5 flex items-center gap-5">
                  <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                    {step.n}
                  </div>
                  <h3 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">{step.title}</h3>
                </div>

                <p className="relative text-[19px] leading-[1.65] text-neutral-800">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FAQ EN DOS COLUMNAS ── */}
        <section id="faq" className={`${container} grid scroll-mt-32 gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20 xl:gap-28`}>
          <motion.div {...up()} className="lg:sticky lg:top-32 lg:self-start">
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <h2 className="mb-6 text-4xl font-bold leading-[1.03] tracking-[-0.04em] md:text-[56px] xl:text-[68px]">
              Resolvemos tus <Serif>dudas</Serif>
            </h2>
            <p className="mb-8 max-w-[460px] text-lg leading-relaxed text-neutral-700 md:text-xl">
              ¿No encuentras lo que buscas? Escríbenos desde el botón de soporte y te ayudamos.
            </p>
            <button onClick={toRegister} className={`${btnDark} px-8 py-4 text-[17px]`}>Empezar gratis →</button>
          </motion.div>

          <div className="grid gap-3 self-start">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <motion.div key={item.q} {...up(i * 0.05)} className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 px-6 py-6 text-left text-lg font-semibold md:px-8 md:py-7 md:text-xl"
                    aria-expanded={open}
                  >
                    {item.q}
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition duration-300 ${open ? "rotate-45 bg-neutral-950 text-white" : "bg-neutral-100"}`}>
                      +
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="max-w-[760px] px-6 pb-7 text-lg leading-relaxed text-neutral-700 md:px-8">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        
      </main>

      {/* ── FOOTER ── */}
      <footer className={`${container} pb-12`}>
        <div className="flex flex-col items-center justify-between gap-6 border-t border-neutral-200 pt-10 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-2.5 text-lg font-bold"><Logo size={26} /> Merkai</div>
          <div className="flex flex-wrap justify-center gap-6">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="text-base font-medium text-neutral-700 transition hover:text-neutral-950">{label}</a>
            ))}
          </div>
          <span className="text-[15px] text-neutral-700">© 2026 Merkai · Gestión comercial y ecommerce</span>
        </div>
      </footer>

      <BtnSoporte />
    </div>
  );
}