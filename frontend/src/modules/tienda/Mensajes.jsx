import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Mail, Phone, MessageCircle, MessageSquare, Search, ArrowLeft, Inbox, AlertTriangle, CheckCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

const AVATAR_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#059669"];
const avatarBg = (nombre = "") => AVATAR_COLORS[(nombre.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const inicial = (nombre = "") => (nombre.trim().charAt(0) || "?").toUpperCase();

const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "Hoy, 3:45 p. m.", "Ayer", "hace 3 días", "12 de mar."
function fechaAmable(valor, completa = false) {
  const f = new Date(valor);
  if (isNaN(f)) return "";
  const hora = f.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  const dias = Math.round((inicioDia(new Date()) - inicioDia(f)) / 86400000);
  if (dias <= 0) return completa ? `Hoy, ${hora}` : hora;
  if (dias === 1) return completa ? `Ayer, ${hora}` : "Ayer";
  if (dias < 7 && !completa) return `Hace ${dias} días`;
  const dia = f.toLocaleDateString("es-CO", { day: "numeric", month: completa ? "long" : "short", year: f.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  return completa ? `${dia}, ${hora}` : dia;
}

function Avatar({ nombre, size = 40 }) {
  return (
    <span
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, background: avatarBg(nombre), fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {inicial(nombre)}
    </span>
  );
}

function Esqueleto() {
  return (
    <ul className="divide-y divide-slate-100" aria-label="Cargando mensajes">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex gap-3 p-4 animate-pulse">
          <span className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Vacio({ Icon, titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <span className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Icon size={26} />
      </span>
      <p className="text-[15px] font-semibold text-slate-900">{titulo}</p>
      <p className="text-sm text-slate-600 mt-1 max-w-xs">{texto}</p>
      {accion}
    </div>
  );
}

export default function Mensajes() {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const fetchMensajes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/api/contacto`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      setMensajes(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMensajes(); }, [fetchMensajes]);

  const marcarLeido = async (id) => {
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, leido: true } : m)));
    try {
      const res = await fetch(`${API_BASE}/api/contacto/${id}/leido`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      // Si el servidor no lo guardó, vuelve a quedar sin leer para no engañar al usuario
      setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, leido: false } : m)));
    }
  };

  const abrir = (m) => {
    setSeleccionadoId(m.id);
    if (!m.leido) marcarLeido(m.id);
  };

  const noLeidos = mensajes.filter((m) => !m.leido).length;

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return mensajes.filter((m) => {
      if (filtro === "no_leidos" && m.leido) return false;
      if (!q) return true;
      return [m.nombre, m.email, m.telefono, m.mensaje].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [mensajes, filtro, busqueda]);

  const sel = mensajes.find((m) => m.id === seleccionadoId) || null;
  const tel = sel?.telefono ? sel.telefono.replace(/\D/g, "") : "";

  const asuntoRespuesta = sel ? `Re: Tu mensaje a nuestra tienda` : "";
  const cuerpoRespuesta = sel ? `Hola ${sel.nombre},\n\nGracias por escribirnos. ` : "";
  const textoWhatsApp = sel ? `Hola ${sel.nombre}, gracias por escribirnos. Te respondo sobre tu mensaje: ` : "";

  return (
    <div className="max-w-6xl mx-auto">

      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mensajes</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {noLeidos > 0
              ? `Tienes ${noLeidos} ${noLeidos === 1 ? "mensaje nuevo" : "mensajes nuevos"} de tus clientes`
              : "Lo que tus clientes te escriben desde la tienda en línea"}
          </p>
        </div>
        <button
          onClick={fetchMensajes}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-slate-300 text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

        {/* Lista */}
        <section className={`lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${sel ? "hidden lg:block" : ""}`} aria-label="Bandeja de mensajes">
          <div className="p-3 border-b border-slate-100 space-y-3">
            <label className="relative block">
              <span className="sr-only">Buscar mensajes</span>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, correo o texto"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 rounded-xl border border-slate-300 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <div className="flex gap-2" role="tablist" aria-label="Filtrar mensajes">
              {[
                { key: "todos", label: "Todos", n: mensajes.length },
                { key: "no_leidos", label: "Sin leer", n: noLeidos },
              ].map((f) => {
                const activo = filtro === f.key;
                return (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setFiltro(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-full border transition outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                      activo ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                    <span className={`text-[11px] px-1.5 rounded-full ${activo ? "bg-white/25" : "bg-slate-100 text-slate-700"}`}>{f.n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading && mensajes.length === 0 ? (
            <Esqueleto />
          ) : error ? (
            <Vacio
              Icon={AlertTriangle}
              titulo="No pudimos cargar tus mensajes"
              texto="Revisa tu conexión e inténtalo de nuevo. Tus mensajes no se perdieron."
              accion={
                <button onClick={fetchMensajes} className="mt-4 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  Reintentar
                </button>
              }
            />
          ) : mensajes.length === 0 ? (
            <Vacio Icon={Inbox} titulo="Aún no tienes mensajes" texto="Cuando un cliente te escriba desde el formulario de contacto de tu tienda, lo verás aquí." />
          ) : visibles.length === 0 ? (
            <Vacio
              Icon={filtro === "no_leidos" && !busqueda ? CheckCheck : Search}
              titulo={filtro === "no_leidos" && !busqueda ? "¡Estás al día!" : "Sin resultados"}
              texto={filtro === "no_leidos" && !busqueda ? "No tienes mensajes sin leer." : "Prueba con otra palabra o cambia el filtro."}
            />
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {visibles.map((m) => {
                const activo = m.id === seleccionadoId;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => abrir(m)}
                      aria-current={activo}
                      className={`w-full text-left flex gap-3 p-4 transition outline-none focus-visible:bg-blue-50 ${activo ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <Avatar nombre={m.nombre} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${m.leido ? "font-medium text-slate-800" : "font-bold text-slate-900"}`}>{m.nombre}</span>
                          <span className="text-xs text-slate-600 flex-shrink-0">{fechaAmable(m.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className={`truncate text-[13px] flex-1 ${m.leido ? "text-slate-600" : "text-slate-800 font-medium"}`}>{m.mensaje}</p>
                          {!m.leido && <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" aria-label="Sin leer" />}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Detalle */}
        <section className={`lg:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm ${sel ? "" : "hidden lg:block"}`} aria-label="Detalle del mensaje">
          {!sel ? (
            <Vacio Icon={MessageSquare} titulo="Elige un mensaje para leerlo" texto="Aquí verás el mensaje completo y podrás responderle a tu cliente por correo o WhatsApp." />
          ) : (
            <div>
              <div className="p-5 border-b border-slate-100">
                <button onClick={() => setSeleccionadoId(null)} className="lg:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 mb-4">
                  <ArrowLeft size={16} /> Volver a los mensajes
                </button>
                <div className="flex items-center gap-3">
                  <Avatar nombre={sel.nombre} size={48} />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{sel.nombre}</h3>
                    <p className="text-[13px] text-slate-600">{fechaAmable(sel.fecha, true)}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">{sel.mensaje}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Datos de contacto</p>
                  <ul className="space-y-2 text-sm text-slate-800">
                    <li className="flex items-center gap-2.5">
                      <Mail size={15} className="text-slate-500 flex-shrink-0" />
                      {sel.email ? <span className="break-all">{sel.email}</span> : <span className="text-slate-600">No dejó correo</span>}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Phone size={15} className="text-slate-500 flex-shrink-0" />
                      {sel.telefono ? <span>{sel.telefono}</span> : <span className="text-slate-600">No dejó teléfono</span>}
                    </li>
                  </ul>
                </div>

                {!sel.email && !tel ? (
                  <p className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Este cliente no dejó ni correo ni teléfono, así que no hay forma de responderle desde aquí.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {sel.email && (
                      <a
                        href={`mailto:${sel.email}?subject=${encodeURIComponent(asuntoRespuesta)}&body=${encodeURIComponent(cuerpoRespuesta)}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                      >
                        <Mail size={16} /> Responder por correo
                      </a>
                    )}
                    {tel && (
                      <a
                        href={`https://wa.me/${tel}?text=${encodeURIComponent(textoWhatsApp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-300 text-slate-800 shadow-sm hover:bg-slate-50 outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                      >
                        <MessageCircle size={16} className="text-green-600" /> Responder por WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
