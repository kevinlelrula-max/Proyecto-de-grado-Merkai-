export function decodeToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return null; }
}

export function tokenVigente(token) {
  const payload = decodeToken(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

// Cierra la sesión de cliente de la tienda (la del panel administrativo es otra: "token").
// Se usa cuando alguien entra al panel, para que al abrir la tienda desde ahí no aparezca
// la cuenta de un cliente que había iniciado sesión antes en el mismo navegador.
export function cerrarSesionCliente() {
  ["cliente_token", "cliente_id", "cliente_nombre", "cliente_rol", "cliente_empresa_id", "cliente_direccion"]
    .forEach((k) => localStorage.removeItem(k));
}
