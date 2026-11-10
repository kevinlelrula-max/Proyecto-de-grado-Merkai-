-- Migración: multi-tienda por usuario
-- Permite que un usuario (persona) gestione múltiples empresas

-- 1. Crear tabla pivote persona_empresas
CREATE TABLE IF NOT EXISTS persona_empresas (
  id          SERIAL PRIMARY KEY,
  persona_id  INTEGER NOT NULL REFERENCES persona(id) ON DELETE CASCADE,
  empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  rol_id      INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (persona_id, empresa_id)
);

-- 2. Migrar relaciones existentes
INSERT INTO persona_empresas (persona_id, empresa_id, rol_id)
SELECT id, empresa_id, rol_id
FROM persona
WHERE empresa_id IS NOT NULL
  AND rol_id IN (1, 2)
ON CONFLICT (persona_id, empresa_id) DO NOTHING;

-- 3. Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_persona_empresas_persona ON persona_empresas(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_empresas_empresa ON persona_empresas(empresa_id);
