-- Elimina el rol "SuperAdmin" (id 1): en cada empresa el rol máximo pasa a ser "Administrador" (id 2).
-- Quien registró la empresa queda marcado como PROPIETARIO (empresas.propietario_id) y está protegido:
-- otros administradores no pueden cambiarle el rol, desactivarlo ni eliminarlo.
--
-- Es seguro ejecutarlo varias veces. Pégalo completo en el editor SQL (local con psql, o Neon).
-- Después de ejecutarlo, los usuarios que estaban con la sesión abierta deben volver a iniciar sesión.

BEGIN;

-- 1. Marca de propietario
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS propietario_id INTEGER REFERENCES persona(id) ON DELETE SET NULL;

-- 2. Propietario de cada empresa que aún no lo tiene: el SuperAdmin si existe; si no, el administrador más antiguo
UPDATE empresas e
SET propietario_id = COALESCE(
  (SELECT p.id FROM persona p WHERE p.empresa_id = e.id AND p.rol_id = 1 ORDER BY p.id LIMIT 1),
  (SELECT p.id FROM persona p WHERE p.empresa_id = e.id AND p.rol_id = 2 ORDER BY p.id LIMIT 1)
)
WHERE e.propietario_id IS NULL;

-- 3. Los SuperAdmin pasan a Administrador (en la persona y en el vínculo persona-empresa)
UPDATE persona          SET rol_id = 2 WHERE rol_id = 1;
UPDATE persona_empresas SET rol_id = 2 WHERE rol_id = 1;
ALTER TABLE persona_empresas ALTER COLUMN rol_id SET DEFAULT 2;

-- 4. Se elimina el rol SuperAdmin y sus permisos
DELETE FROM rol_permisos WHERE rol_id = 1;
DELETE FROM roles        WHERE id = 1 AND nombre = 'SuperAdmin';

COMMIT;

-- Comprobación (opcional):
-- SELECT id, nombre FROM roles ORDER BY id;
-- SELECT e.id, e.nombre, p.usuario AS propietario FROM empresas e LEFT JOIN persona p ON p.id = e.propietario_id ORDER BY e.id;
