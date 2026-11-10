import { useState, useEffect } from "react";
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  toggleCategoria,
  eliminarCategoria
} from "../services/categorias.api";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

export default function Categorias() {
  const token = localStorage.getItem("token");

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formulario nueva categoría
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Edición inline
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState("");

  // =========================
  // CARGAR
  // =========================
  const cargar = async () => {
    setCargando(true);
    try {
      const data = await getCategorias(token);
      setCategorias(data);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar categorías");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // =========================
  // CREAR
  // =========================
  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nuevaNombre.trim()) return;
    setGuardando(true);
    try {
      const nueva = await crearCategoria({ nombre: nuevaNombre }, token);
      setCategorias([...categorias, nueva]);
      setNuevaNombre("");
      toast.success("Categoría creada correctamente");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al crear categoría");
    } finally {
      setGuardando(false);
    }
  };

  // =========================
  // EDITAR
  // =========================
  const handleEditar = (cat) => {
    setEditandoId(cat.id);
    setEditandoNombre(cat.nombre);
  };

  const handleGuardarEdicion = async (id) => {
    if (!editandoNombre.trim()) return;
    try {
      const actualizada = await actualizarCategoria(id, { nombre: editandoNombre }, token);
      setCategorias(categorias.map(c => c.id === id ? actualizada : c));
      setEditandoId(null);
      toast.success("Categoría actualizada");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al actualizar");
    }
  };

  // =========================
  // TOGGLE ESTADO
  // =========================
  const handleToggle = async (id) => {
    try {
      const actualizada = await toggleCategoria(id, token);
      setCategorias(categorias.map(c => c.id === id ? actualizada : c));
      toast.info("Estado actualizado");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cambiar estado");
    }
  };

  // =========================
  // ELIMINAR
  // =========================
  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar esta categoría?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarCategoria(id, token);
      setCategorias(categorias.filter(c => c.id !== id));
      toast.success("Categoría eliminada 🗑");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar");
    }
  };

  const activas = categorias.filter(c => c.estado).length;
  const inactivas = categorias.filter(c => !c.estado).length;

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />

      <style>{`
        .cat-wrap { display: flex; flex-direction: column; gap: 20px; }

        .cat-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .cat-stat { background: #f9fffe; border: 1.5px solid #E8FAF5; border-radius: 14px; padding: 16px 18px; }
        .cat-stat-label { font-size: 12px; color: #aaa; margin-bottom: 4px; }
        .cat-stat-val { font-size: 22px; font-weight: 500; color: #1a1a1a; }
        .cat-stat-val.verde { color: #00A884; }
        .cat-stat-val.gris { color: #aaa; }

        .cat-nueva { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 16px; padding: 18px; }
        .cat-nueva h3 { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
        .cat-nueva-form { display: flex; gap: 10px; }
        .cat-nueva-input {
          flex: 1; padding: 9px 14px;
          border: 1.5px solid #eee; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          outline: none; color: #1a1a1a;
          transition: border-color 0.15s;
        }
        .cat-nueva-input:focus { border-color: #00C9A7; }
        .cat-nueva-btn {
          padding: 9px 18px;
          background: #2563eb;
          border: none; border-radius: 10px;
          color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: opacity 0.15s; white-space: nowrap;
        }
        .cat-nueva-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cat-nueva-btn:hover:not(:disabled) { opacity: 0.88; }

        .cat-lista { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 16px; overflow: hidden; }
        .cat-lista-header { padding: 14px 18px; border-bottom: 1px solid #f5f5f5; background: #fafafa; }
        .cat-lista-header h3 { font-size: 14px; font-weight: 600; color: #1a1a1a; margin: 0; }

        .cat-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px; border-bottom: 1px solid #f9f9f9;
          transition: background 0.1s;
        }
        .cat-item:last-child { border-bottom: none; }
        .cat-item:hover { background: #fafafa; }

        .cat-item-nombre { flex: 1; font-size: 13px; font-weight: 500; color: #1a1a1a; }
        .cat-item-edit-input {
          flex: 1; padding: 6px 10px;
          border: 1.5px solid #00C9A7; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          outline: none; color: #1a1a1a;
        }

        .badge-estado {
          font-size: 11px; padding: 3px 10px;
          border-radius: 99px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          border: 1.5px solid transparent;
        }
        .badge-activo { background: #E8FAF5; color: #00875A; border-color: #B8EFE0; }
        .badge-activo:hover { background: #D0F5EC; }
        .badge-inactivo { background: #f5f5f5; color: #aaa; border-color: #eee; }
        .badge-inactivo:hover { background: #eee; }

        .cat-actions { display: flex; gap: 6px; }
        .cat-btn {
          width: 30px; height: 30px;
          border: 1.5px solid #eee; border-radius: 8px;
          background: #fafafa; cursor: pointer;
          font-size: 13px; display: flex; align-items: center; justify-content: center;
          transition: all 0.12s; color: #555;
        }
        .cat-btn:hover { background: #f0f0f0; }
        .cat-btn.guardar { border-color: #00C9A7; background: #E8FAF5; color: #00875A; }
        .cat-btn.guardar:hover { background: #00C9A7; color: #fff; }
        .cat-btn.eliminar:hover { border-color: #FF4D4D; background: #FFF0F0; color: #FF4D4D; }

        .cat-vacio { padding: 40px; text-align: center; color: #ccc; font-size: 13px; }
        .spinner-cat { padding: 40px; text-align: center; color: #aaa; font-size: 13px; }
      `}</style>

      <div className="cat-wrap">

        {/* STATS */}
        <div className="cat-stats">
          <div className="cat-stat">
            <div className="cat-stat-label">Total categorías</div>
            <div className="cat-stat-val">{categorias.length}</div>
          </div>
          <div className="cat-stat">
            <div className="cat-stat-label">Activas</div>
            <div className="cat-stat-val verde">{activas}</div>
          </div>
          <div className="cat-stat">
            <div className="cat-stat-label">Inactivas</div>
            <div className="cat-stat-val gris">{inactivas}</div>
          </div>
        </div>

        {/* FORMULARIO NUEVA */}
        <div className="cat-nueva">
          <h3>Nueva categoría</h3>
          <form className="cat-nueva-form" onSubmit={handleCrear}>
            <input
              className="cat-nueva-input"
              placeholder="Ej: Pescado fresco, Mariscos, Ahumados..."
              value={nuevaNombre}
              onChange={e => setNuevaNombre(e.target.value)}
            />
            <button className="cat-nueva-btn" type="submit" disabled={guardando || !nuevaNombre.trim()}>
              {guardando ? "Guardando..." : "Crear categoría"}
            </button>
          </form>
        </div>

        {/* LISTA */}
        <div className="cat-lista">
          <div className="cat-lista-header">
            <h3>Categorías registradas</h3>
          </div>

          {cargando ? (
            <div className="spinner-cat">Cargando...</div>
          ) : categorias.length === 0 ? (
            <div className="cat-vacio">No hay categorías aún — crea la primera arriba</div>
          ) : (
            categorias.map(cat => (
              <div key={cat.id} className="cat-item">

                {editandoId === cat.id ? (
                  <input
                    className="cat-item-edit-input"
                    value={editandoNombre}
                    onChange={e => setEditandoNombre(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleGuardarEdicion(cat.id);
                      if (e.key === "Escape") setEditandoId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="cat-item-nombre">{cat.nombre}</span>
                )}

                <span
                  className={`badge-estado ${cat.estado ? "badge-activo" : "badge-inactivo"}`}
                  onClick={() => handleToggle(cat.id)}
                  title="Clic para cambiar estado"
                >
                  {cat.estado ? "Activa" : "Inactiva"}
                </span>

                <div className="cat-actions">
                  {editandoId === cat.id ? (
                    <>
                      <button className="cat-btn guardar" onClick={() => handleGuardarEdicion(cat.id)} title="Guardar">✓</button>
                      <button className="cat-btn" onClick={() => setEditandoId(null)} title="Cancelar">✕</button>
                    </>
                  ) : (
                    <>
                      <button className="cat-btn" onClick={() => handleEditar(cat)} title="Editar nombre">✏</button>
                      <button className="cat-btn eliminar" onClick={() => handleEliminar(cat.id)} title="Eliminar">🗑</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}