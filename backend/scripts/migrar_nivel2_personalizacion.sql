-- Nivel 2: tipografía y cantidad de productos destacados
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS fuente VARCHAR(30) DEFAULT 'Inter';

ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS productos_destacados_cantidad INTEGER DEFAULT 4;

-- Nivel 3: footer personalizable
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS footer_texto VARCHAR(200) DEFAULT NULL;
