ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS unidad_predeterminada VARCHAR(30) DEFAULT 'unidad';
