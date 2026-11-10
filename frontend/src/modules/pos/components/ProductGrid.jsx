import { imgUrl } from "../../../utils/imgUrl";
const IMG_PLACEHOLDER = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%20viewBox%3D%220%200%20300%20200%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23f1f5f9%22%2F%3E%3Crect%20x%3D%22120%22%20y%3D%2272%22%20width%3D%2260%22%20height%3D%2245%22%20rx%3D%225%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%2294%22%20r%3D%2211%22%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%2294%22%20r%3D%224%22%20fill%3D%22%23cbd5e1%22%2F%3E%3C%2Fsvg%3E";

export default function ProductGrid({ productos, agregarProducto, busqueda, setBusqueda }) {

  const productosFiltrados = (productos || []).filter((p) => {
    if (!p || !p.nombre) return false;

    return p.nombre
      .toLowerCase()
      .includes((busqueda || "").toLowerCase());
  });

  return (
    <div className="pos-left">
      
      {/* 🔍 Buscador */}
      <div className="pos-search-bar">
        <input
          placeholder="Buscar producto..."
          value={busqueda || ""}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* 🧱 Grid */}
      <div className="pos-product-grid">
        {productosFiltrados.map(p => (
          <div
            key={p.id}
            className={`prod-card ${p.stock <= 0 ? "agotado" : ""}`}
            onClick={() => p.stock > 0 && agregarProducto(p)}
          >
            {/* 🖼️ IMAGEN */}
            <img
              src={imgUrl(p.imagen_url) || IMG_PLACEHOLDER}
              alt={p.nombre}
              className="prod-card-img"
              onError={(e) => e.target.src = IMG_PLACEHOLDER}
            />

            {/* 📦 Info */}
            <h3>{p.nombre}</h3>
            <div className="precio">
              ${Number(p.precio).toLocaleString("es-CO")}
            </div>
            <div className="stock">
              Stock: {p.stock}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}