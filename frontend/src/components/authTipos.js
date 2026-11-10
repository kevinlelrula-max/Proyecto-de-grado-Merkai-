// Configuración de los dos flujos que comparten las pantallas de recuperación de contraseña
export const AUTH_TIPOS = {
  cliente: {
    marca: "Merkai · Tienda",
    etiqueta: "Tu cuenta",
    acento: "#3674B5",
    login: "/tienda/login",
    recuperar: "/tienda/recuperar-contrasena",
    api: "/api/clientes",
  },
  empresa: {
    marca: "Merkai · Empresas",
    etiqueta: "Panel de gestión",
    acento: "#0f172a",
    login: "/empresa/login",
    recuperar: "/empresa/recuperar-contrasena",
    api: "/api/auth",
  },
};
