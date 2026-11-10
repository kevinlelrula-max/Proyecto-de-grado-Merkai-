-- Categorías por empresa.
-- Antes: una sola lista de categorías compartida por todas las empresas (cualquiera podía renombrar o
-- borrar las de las demás). Ahora: cada empresa tiene las suyas (categoria.empresa_id).
--
-- Qué hace:
--   1. Agrega categoria.empresa_id y cambia la unicidad: el nombre es único DENTRO de cada empresa.
--   2. Crea una copia de cada categoría en uso para cada empresa que tiene productos con ella.
--   3. Apunta los productos a la copia de SU empresa.
--   4. Borra las categorías globales viejas que quedaron sin uso.
--
-- Es seguro ejecutarlo varias veces. Pégalo completo en el editor SQL (local con psql, o Neon).

BEGIN;

-- 1. Dueño de cada categoría y unicidad por empresa
ALTER TABLE categoria ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE categoria DROP CONSTRAINT IF EXISTS categoria_nombre_key;
CREATE UNIQUE INDEX IF NOT EXISTS categoria_empresa_nombre_key ON categoria (empresa_id, nombre);
CREATE INDEX IF NOT EXISTS idx_categoria_empresa ON categoria (empresa_id);

-- 2. Copia de cada categoría global para cada empresa que la usa
INSERT INTO categoria (nombre, estado, empresa_id)
SELECT DISTINCT c.nombre, c.estado, p.empresa_id
FROM categoria c
JOIN productos p ON p.categoria_id = c.id
WHERE c.empresa_id IS NULL AND p.empresa_id IS NOT NULL
ON CONFLICT (empresa_id, nombre) DO NOTHING;

-- 3. Cada producto pasa a la categoría de su propia empresa
UPDATE productos p
SET categoria_id = n.id
FROM categoria o, categoria n
WHERE p.categoria_id = o.id
  AND o.empresa_id IS NULL
  AND n.empresa_id = p.empresa_id
  AND n.nombre = o.nombre;

-- 4. Se eliminan las categorías globales que ya nadie usa
DELETE FROM categoria c
WHERE c.empresa_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM productos p WHERE p.categoria_id = c.id);

COMMIT;

-- Comprobación (opcional):
-- SELECT e.nombre AS empresa, c.nombre AS categoria, (SELECT count(*) FROM productos p WHERE p.categoria_id = c.id) AS productos
-- FROM categoria c LEFT JOIN empresas e ON e.id = c.empresa_id ORDER BY e.id, c.nombre;
-- SELECT count(*) AS productos_con_categoria_de_otra_empresa
-- FROM productos p JOIN categoria c ON c.id = p.categoria_id WHERE c.empresa_id IS DISTINCT FROM p.empresa_id;
