import { useRef } from "react";
import { ImageIcon } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TiendaForm({ empresa, bannerPreview, onChange, onBannerChange }) {
  const bannerRef = useRef(null);

  function handleBannerFile(e) {
    const file = e.target.files?.[0];
    if (file) onBannerChange(file);
  }

  const bannerSrc = bannerPreview?.startsWith("data:")
    ? bannerPreview
    : bannerPreview
    ? `${API_BASE}${bannerPreview}`
    : null;

  return (
    <div className="space-y-6">

      {/* Apariencia */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">Apariencia</h3>
        <p className="text-sm text-gray-400 mb-5">Color y banner principal de tu tienda</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Color primario */}
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Color de marca</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={empresa.color_primario || "#0F6E56"}
                onChange={(e) => onChange("color_primario", e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={empresa.color_primario || "#0F6E56"}
                onChange={(e) => onChange("color_primario", e.target.value)}
                placeholder="#0F6E56"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Horario */}
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Horario de atención</label>
            <input
              type="text"
              value={empresa.horario || ""}
              onChange={(e) => onChange("horario", e.target.value)}
              placeholder="Lun – Sáb: 7am – 6pm"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Descripción */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción breve</label>
            <textarea
              value={empresa.descripcion || ""}
              onChange={(e) => onChange("descripcion", e.target.value)}
              placeholder="Ej: Productos frescos directo del campo a tu mesa..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Banner */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">Banner de la tienda</label>
          <div
            onClick={() => bannerRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
            style={{ minHeight: "120px" }}
          >
            {bannerSrc ? (
              <div className="relative">
                <img
                  src={bannerSrc}
                  alt="Banner"
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <span className="text-white text-sm font-medium">Cambiar banner</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <ImageIcon size={20} />
                </span>
                <p className="text-sm text-gray-500">Haz clic para subir el banner</p>
                <p className="text-xs text-gray-400">PNG, JPG · máx. 5 MB · Recomendado 1200×400px</p>
              </div>
            )}
          </div>
          <input
            ref={bannerRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleBannerFile}
          />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">Sección principal (Hero)</h3>
        <p className="text-sm text-gray-400 mb-5">El texto grande que ven tus clientes al entrar a la tienda</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
            <input
              type="text"
              value={empresa.hero_titulo || ""}
              onChange={(e) => onChange("hero_titulo", e.target.value)}
              placeholder="Ej: Productos frescos a tu puerta"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Subtítulo</label>
            <input
              type="text"
              value={empresa.hero_subtitulo || ""}
              onChange={(e) => onChange("hero_subtitulo", e.target.value)}
              placeholder="Ej: Calidad garantizada y entrega rápida"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Texto del botón</label>
            <input
              type="text"
              value={empresa.hero_btn_texto || ""}
              onChange={(e) => onChange("hero_btn_texto", e.target.value)}
              placeholder="Ej: Ver catálogo"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sobre nosotros */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">Sobre nosotros</h3>
        <p className="text-sm text-gray-400 mb-5">Historia o presentación de tu negocio</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Título de la sección</label>
            <input
              type="text"
              value={empresa.nosotros_titulo || ""}
              onChange={(e) => onChange("nosotros_titulo", e.target.value)}
              placeholder="Ej: ¿Quiénes somos?"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contenido</label>
            <textarea
              value={empresa.nosotros_contenido || ""}
              onChange={(e) => onChange("nosotros_contenido", e.target.value)}
              placeholder="Cuéntale a tus clientes sobre tu negocio, tu historia y tus valores..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Redes sociales */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">Redes sociales</h3>
        <p className="text-sm text-gray-400 mb-5">Aparecen en la sección de contacto de tu tienda</p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl w-8 text-center">📱</span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
              <input
                type="text"
                value={empresa.whatsapp || ""}
                onChange={(e) => onChange("whatsapp", e.target.value)}
                placeholder="573001234567 (sin + ni espacios)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl w-8 text-center">📸</span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
              <input
                type="text"
                value={empresa.instagram || ""}
                onChange={(e) => onChange("instagram", e.target.value)}
                placeholder="@minegocio"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl w-8 text-center">👍</span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Facebook</label>
              <input
                type="text"
                value={empresa.facebook || ""}
                onChange={(e) => onChange("facebook", e.target.value)}
                placeholder="minegocio"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
