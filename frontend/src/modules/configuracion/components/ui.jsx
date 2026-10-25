const BASE = "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:ring-4";
const OK   = "border-slate-300 focus:border-blue-500 focus:ring-blue-100";
const MAL  = "border-red-400 focus:border-red-500 focus:ring-red-100";

export function Tarjeta({ Icon, titulo, descripcion, acciones, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        {Icon && (
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon size={19} />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900">{titulo}</h3>
          {descripcion && <p className="text-[13px] text-slate-600 mt-0.5">{descripcion}</p>}
        </div>
        {acciones}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Etiqueta({ id, label, requerido }) {
  return (
    <label htmlFor={id} className="block text-[13px] font-semibold text-slate-800 mb-1.5">
      {label}{requerido && <span className="text-red-500"> *</span>}
    </label>
  );
}

function Pie({ ayuda, error }) {
  if (error) return <p className="text-xs text-red-600 mt-1.5" role="alert">{error}</p>;
  if (ayuda) return <p className="text-xs text-slate-500 mt-1.5">{ayuda}</p>;
  return null;
}

export function Campo({ id, label, ayuda, error, requerido, Icon, className = "", ...props }) {
  return (
    <div className={className}>
      <Etiqueta id={id} label={label} requerido={requerido} />
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input id={id} aria-invalid={!!error} className={`${BASE} ${error ? MAL : OK} ${Icon ? "pl-10" : ""}`} {...props} />
      </div>
      <Pie ayuda={ayuda} error={error} />
    </div>
  );
}

export function Area({ id, label, ayuda, error, max, value = "", className = "", ...props }) {
  return (
    <div className={className}>
      <Etiqueta id={id} label={label} />
      <textarea id={id} value={value} maxLength={max} aria-invalid={!!error} className={`${BASE} ${error ? MAL : OK} resize-none leading-relaxed`} {...props} />
      <div className="flex justify-between gap-3">
        <Pie ayuda={ayuda} error={error} />
        {max && <span className="text-xs text-slate-400 mt-1.5 ml-auto">{value.length}/{max}</span>}
      </div>
    </div>
  );
}

export function Selector({ id, label, ayuda, error, className = "", children, ...props }) {
  return (
    <div className={className}>
      <Etiqueta id={id} label={label} />
      <select id={id} className={`${BASE} ${error ? MAL : OK}`} {...props}>{children}</select>
      <Pie ayuda={ayuda} error={error} />
    </div>
  );
}

export function Interruptor({ activo, onChange, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${activo ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${activo ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
