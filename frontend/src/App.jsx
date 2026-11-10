import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";

// Empresas
import RegistroEmpresa from "./components/RegistroEmpresa";
import LoginEmpresa from "./components/LoginEmpresa";
import DashboardEmpresa from "./components/DashboardEmpresa";
import Perfil from "./modules/perfil/Perfil";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";

// POS
import Ventas from "./pages/VentasEmpresa";

// Reportes
import Reportes from "./pages/Reportes";

// Tienda cliente
import LoginCliente          from "./pages/LoginCliente";
import RegistroCliente       from "./pages/RegistroCliente";
import RecuperarContrasena   from "./pages/RecuperarContrasena";
import ResetearContrasena    from "./pages/ResetearContrasena";
import MisPedidos from "./pages/MisPedidos";
import PerfilCliente from "./modules/perfilCliente/PerfilCliente";
import TiendaInicio         from "./modules/tienda/TiendaInicio";
import TiendaCatalogo       from "./modules/tienda/TiendaCatalogo";
import TiendaContacto       from "./modules/tienda/TiendaContacto";
import TiendaProductoDetalle from "./modules/tienda/TiendaProductoDetalle";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Página principal ── */}
        <Route path="/" element={<Home />} />

        {/* ── Empresas ── */}
        <Route path="/empresa/registro" element={<RegistroEmpresa />} />
        <Route path="/empresa/login"    element={<LoginEmpresa />} />
        <Route path="/empresa/recuperar-contrasena" element={<RecuperarContrasena tipo="empresa" />} />
        <Route path="/empresa/resetear-contrasena"  element={<ResetearContrasena tipo="empresa" />} />

        {/* ── Dashboard empresa (requiere sesión) ── */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardEmpresa /></ProtectedRoute>} />
        <Route path="/perfil"    element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/ventas"    element={<ProtectedRoute seccion="ventas"><Ventas /></ProtectedRoute>} />
        <Route path="/reportes"  element={<ProtectedRoute seccion="reportes"><Reportes /></ProtectedRoute>} />

        {/* ── Tienda online del cliente ── */}
        <Route path="/tienda/login"                element={<LoginCliente />} />
        <Route path="/tienda/registro"             element={<RegistroCliente />} />
        <Route path="/tienda/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/tienda/resetear-contrasena"  element={<ResetearContrasena />} />
        <Route path="/tienda/mis-pedidos" element={<MisPedidos />} />
        <Route path="/tienda/perfil" element={<PerfilCliente />} />
        <Route path="/tienda/:empresaSlug"          element={<TiendaInicio />} />
        <Route path="/tienda/:empresaSlug/catalogo" element={<TiendaCatalogo />} />
        <Route path="/tienda/:empresaSlug/contacto"           element={<TiendaContacto />} />
        <Route path="/tienda/:empresaSlug/pedidos"            element={<MisPedidos />} />
        <Route path="/tienda/:empresaSlug/producto/:productoId" element={<TiendaProductoDetalle />} />

        {/* 🚫 Fallback global */}
        <Route path="*" element={<NotFound />} />

      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </BrowserRouter>
  );
}

export default App;