// Fechas en hora de Colombia para las herramientas del MCP.
// Las fechas de la base son "timestamp sin zona" guardadas con la hora del servidor de base de datos (UTC en Neon):
// se interpretan en esa zona y se pasan a Bogotá, para que "hoy" no salte al día siguiente después de las 7 p. m.
export const aBogota = (columna) =>
  `((${columna} AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'America/Bogota')::date`;

export const HOY_BOGOTA = "(NOW() AT TIME ZONE 'America/Bogota')::date";

export const fechaCO = (valor) =>
  new Date(valor).toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
