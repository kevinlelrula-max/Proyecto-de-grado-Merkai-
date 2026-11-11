-- Deja guardada la configuración del sistema de referidos de Pesquera Estrada (para la demo y la sustentación):
--   · Premio para el AMIGO según el nivel de lealtad de quien lo invita (descuento en su primera compra),
--     y el nivel que hereda durante 30 días (el mismo nivel de quien lo invitó).
--   · Premio para QUIEN INVITA (si todavía no hay ninguno configurado).
--
-- Es seguro ejecutarlo varias veces: solo inserta lo que falta y NO pisa lo que ya configuraste desde
-- el panel (Referidos > Configuración). Los niveles se buscan por nombre, así que sirve igual en la base
-- local y en producción. Se puede ajustar después desde el panel.
--
-- Solo toca la empresa con slug 'pesquera-estrada'.

BEGIN;

-- 1. Premio para el amigo: uno "sin nivel" y uno por cada nivel de lealtad activo de la empresa
INSERT INTO referidos_config_amigo
  (empresa_id, nivel_id, nivel_nombre, descuento_pct, envio_gratis, descripcion, activo, nivel_heredado_id)
SELECT e.id, NULL, 'Sin nivel', 5, false, '5% de descuento de bienvenida en tu primera compra', true, NULL
FROM empresas e
WHERE e.slug = 'pesquera-estrada'
  AND NOT EXISTS (SELECT 1 FROM referidos_config_amigo c WHERE c.empresa_id = e.id);

INSERT INTO referidos_config_amigo
  (empresa_id, nivel_id, nivel_nombre, descuento_pct, envio_gratis, descripcion, activo, nivel_heredado_id)
SELECT e.id, n.id, n.nombre,
       CASE n.nombre WHEN 'Cobre' THEN 6 WHEN 'Plata' THEN 7 ELSE 8 END,
       (n.nombre NOT IN ('Cobre', 'Plata')),                      -- envío gratis solo con el nivel más alto
       'Descuento en tu primera compra y nivel ' || n.nombre || ' durante tu primer mes',
       true,
       n.id                                                       -- hereda el mismo nivel de quien lo invitó
FROM empresas e
JOIN niveles_lealtad n ON n.empresa_id = e.id AND n.activo = true
WHERE e.slug = 'pesquera-estrada'
  AND NOT EXISTS (SELECT 1 FROM referidos_config_amigo c WHERE c.empresa_id = e.id AND c.nivel_id = n.id);

-- 2. Premio para quien invita (solo si la empresa no tiene ninguno)
INSERT INTO referidos_config_referidor (empresa_id, rango_desde, rango_hasta, tipo_premio, valor, descripcion)
SELECT e.id, 1, 9, 'producto_gratis', NULL, 'Un producto gratis por cada amigo que haga su primera compra'
FROM empresas e
WHERE e.slug = 'pesquera-estrada'
  AND NOT EXISTS (SELECT 1 FROM referidos_config_referidor c WHERE c.empresa_id = e.id);

COMMIT;

-- Verificación
SELECT c.nivel_nombre, c.descuento_pct, c.envio_gratis, nh.nombre AS hereda_nivel, c.activo
FROM referidos_config_amigo c
JOIN empresas e ON e.id = c.empresa_id AND e.slug = 'pesquera-estrada'
LEFT JOIN niveles_lealtad nh ON nh.id = c.nivel_heredado_id
ORDER BY c.nivel_id NULLS FIRST;
