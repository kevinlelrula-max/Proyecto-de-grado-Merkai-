// "Hoy" y "ayer" en hora de Colombia para las consultas del panel.
// Las fechas de la base son "timestamp sin zona" guardadas con la hora del servidor de base de datos (UTC en Neon):
// se interpretan en esa zona y se pasan a Bogotá, para que después de las 7 p. m. "hoy" no salte al día siguiente.
export const aBogota = (columna) =>
  `((${columna} AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'America/Bogota')::date`;

export const HOY_BOGOTA = "(NOW() AT TIME ZONE 'America/Bogota')::date";

// Fecha (AAAA-MM-DD) de hoy en Colombia, más o menos n días
export const fechaCO = (desplazarDias = 0) => {
  const [y, m, d] = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + desplazarDias)).toISOString().slice(0, 10);
};
