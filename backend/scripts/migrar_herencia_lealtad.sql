-- =============================================
-- HERENCIA DE LEALTAD EN SISTEMA DE REFERIDOS
-- El amigo referido llega con un nivel inicial
-- que dura 1 mes, según el nivel de quien lo refirió
-- =============================================

-- 1. Nivel heredado configurable en la tabla de config del amigo
ALTER TABLE referidos_config_amigo
ADD COLUMN IF NOT EXISTS nivel_heredado_id INT REFERENCES niveles_lealtad(id) ON DELETE SET NULL;

-- 2. Guardar el nivel heredado y su vigencia en cada referido completado
ALTER TABLE referidos
ADD COLUMN IF NOT EXISTS nivel_heredado_id    INT,
ADD COLUMN IF NOT EXISTS nivel_heredado_hasta TIMESTAMP;
