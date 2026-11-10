-- Agrega columna para costos de envío individuales por departamento
-- Estructura: {"5": 15000, "11": 8000, "44": 0}
-- Clave = id del departamento, Valor = costo en COP (0 = gratis)
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS envio_costos_departamentos JSONB DEFAULT '{}'::jsonb;
