-- Distribuidora del Llano (empresa 2) como negocio de ABARROTES y víveres, con todo lo que pide la barra
-- de avance de Inicio: productos, perfil, tienda personalizada, niveles de lealtad, referidos y equipo.
-- (El logo se sube a mano desde "Editor de tienda": una imagen no se puede cargar por SQL.)
--
-- Requiere haber ejecutado antes migrar_categorias_por_empresa.sql (categorías por empresa).
-- Es seguro ejecutarlo varias veces. Contraseña del empleado demo: Demo2026!
--
-- Solo toca la empresa 2.

BEGIN;

-- 1. Categorías propias de esta empresa (y se quitan las de pescado que ya no usa)
INSERT INTO categoria (nombre, estado, empresa_id)
SELECT n, true, 2 FROM (VALUES ('Abarrotes'), ('Bebidas'), ('Aseo y hogar'), ('Frutas y verduras')) AS c(n)
ON CONFLICT (empresa_id, nombre) DO NOTHING;

-- 2. Catálogo de abarrotes. Si la empresa ya tenía productos (los de prueba), se reutilizan esas filas.
CREATE TEMP TABLE nuevos ON COMMIT DROP AS
SELECT row_number() OVER () AS rn, v.*
FROM (VALUES
  ('Arroz blanco premium',         4200,  3900, 800, 100, 'kg',      'Abarrotes',         'Arroz de grano largo, ideal para el almuerzo de todos los días.'),
  ('Aceite vegetal 3 L',          38000, 36000, 120,  20, 'unidad',  'Abarrotes',         'Aceite vegetal para cocinar y freír, presentación de 3 litros.'),
  ('Azúcar refinada',              4600,  4300, 500,  80, 'kg',      'Abarrotes',         'Azúcar blanca refinada, por kilo.'),
  ('Panela redonda',               3500,  3200, 300,  50, 'unidad',  'Abarrotes',         'Panela tradicional de caña, ideal para aguapanela y dulces.'),
  ('Lenteja',                      7800,  7300, 150,  30, 'kg',      'Abarrotes',         'Lenteja seleccionada, por kilo.'),
  ('Gaseosa 2,5 L',                7500,  7000, 240,  40, 'unidad',  'Bebidas',           'Gaseosa familiar de 2,5 litros, varios sabores.'),
  ('Agua en botellón 20 L',        9000,  8500,  80,  15, 'unidad',  'Bebidas',           'Agua tratada en botellón de 20 litros.'),
  ('Jugo de naranja 1 L',          5200,  4800, 160,  30, 'unidad',  'Bebidas',           'Jugo de naranja listo para tomar.'),
  ('Detergente en polvo 1 kg',     9800,  9200, 140,  25, 'unidad',  'Aseo y hogar',      'Detergente en polvo para ropa, bolsa de 1 kg.'),
  ('Papel higiénico x12',         18500, 17000, 110,  20, 'paquete', 'Aseo y hogar',      'Paquete de 12 rollos de doble hoja.'),
  ('Plátano hartón',               3200,  2900, 400,  60, 'kg',      'Frutas y verduras', 'Plátano hartón fresco de la región, por kilo.'),
  ('Yuca',                         2400,  2200, 300,  50, 'kg',      'Frutas y verduras', 'Yuca fresca, por kilo.')
) AS v(nombre, precio, mayoreo, stock, minimo, unidad, categoria, descr);

CREATE TEMP TABLE conteo ON COMMIT DROP AS SELECT count(*)::int AS n FROM productos WHERE empresa_id = 2;

-- 2a. Productos que ya existían: se les cambian los datos
WITH ex AS (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM productos WHERE empresa_id = 2)
UPDATE productos p
SET nombre = n.nombre, precio = n.precio, precio_mayoreo = n.mayoreo, stock = n.stock, stock_minimo = n.minimo,
    unidad = n.unidad, descripcion = n.descr, categoria_id = c.id, imagen_url = NULL, activo = true
FROM ex
JOIN nuevos n ON n.rn = ex.rn
JOIN categoria c ON c.empresa_id = 2 AND c.nombre = n.categoria
WHERE p.id = ex.id;

-- 2b. Productos nuevos para completar el catálogo
INSERT INTO productos (empresa_id, nombre, precio, precio_mayoreo, stock, stock_minimo, unidad, categoria_id, descripcion, activo)
SELECT 2, n.nombre, n.precio, n.mayoreo, n.stock, n.minimo, n.unidad, c.id, n.descr, true
FROM nuevos n
JOIN categoria c ON c.empresa_id = 2 AND c.nombre = n.categoria
WHERE n.rn > (SELECT n FROM conteo);

-- 2c. Si sobraban productos viejos (más que los nuevos), se desactivan
UPDATE productos SET activo = false
WHERE id IN (SELECT id FROM (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM productos WHERE empresa_id = 2) t
             WHERE rn > (SELECT count(*) FROM nuevos));

-- 2d. Categorías de pescado de esta empresa que quedaron sin productos
DELETE FROM categoria c
WHERE c.empresa_id = 2 AND c.nombre IN ('Pescados', 'Mariscos', 'Crustaceos')
  AND NOT EXISTS (SELECT 1 FROM productos p WHERE p.categoria_id = c.id);

-- 3. Perfil y tienda: otro color de marca y textos de abarrotes
UPDATE empresas SET
  descripcion        = 'Distribuidora de abarrotes, bebidas y artículos de aseo para tiendas y hogares de los Llanos Orientales.',
  whatsapp           = '573205550123',
  telefono           = '3205550123',
  direccion          = 'Carrera 22 # 12-40, Villavicencio, Meta',
  horario            = 'Lun – Sáb: 7am – 6pm',
  instagram          = 'distribuidoradelllano',
  color_primario     = '#EA580C',
  hero_titulo        = 'Todo para tu despensa, al por mayor y al detal',
  hero_subtitulo     = 'Abarrotes, bebidas y aseo con entrega a domicilio en el Meta.',
  hero_btn_texto     = 'Ver productos',
  nosotros_titulo    = 'Tu distribuidora de confianza en los Llanos',
  nosotros_contenido = 'Más de diez años surtiendo a tiendas de barrio, restaurantes y familias de la región con productos de calidad y precios de mayorista.',
  footer_texto       = 'Distribuidora del Llano · Villavicencio, Meta'
WHERE id = 2;

-- 4. Niveles de lealtad (según lo que el cliente compra en el mes)
DELETE FROM niveles_lealtad WHERE empresa_id = 2
  AND nombre NOT IN ('Frecuente', 'Mayorista', 'Aliado')
  AND NOT EXISTS (SELECT 1 FROM referidos_config_amigo r WHERE r.nivel_id = niveles_lealtad.id);
INSERT INTO niveles_lealtad (empresa_id, nombre, monto_minimo, descuento_porcentaje, activo)
SELECT 2, v.nombre, v.monto, v.descuento, true
FROM (VALUES ('Frecuente', 200000, 4), ('Mayorista', 600000, 7), ('Aliado', 1500000, 10)) AS v(nombre, monto, descuento)
WHERE NOT EXISTS (SELECT 1 FROM niveles_lealtad n WHERE n.empresa_id = 2 AND n.nombre = v.nombre);

-- 5. Referidos: beneficio para el amigo y premios para quien invita
DELETE FROM referidos_config_amigo WHERE empresa_id = 2 AND nivel_id IS NULL;
INSERT INTO referidos_config_amigo (empresa_id, nivel_id, nivel_nombre, descuento_pct, envio_gratis, descripcion, activo)
VALUES (2, NULL, 'Sin nivel', 5, true, '5 % de descuento y envío gratis en tu primera compra', true);

DELETE FROM referidos_config_referidor WHERE empresa_id = 2;
INSERT INTO referidos_config_referidor (empresa_id, rango_desde, rango_hasta, tipo_premio, valor, descripcion, activo) VALUES
  (2, 1, 4, 'credito',         10000, 'Crédito de $10.000 por cada amigo que te acompañe', true),
  (2, 5, NULL, 'producto_gratis', NULL, 'Una canasta de víveres gratis', true);

-- 6. Equipo: una empleada (cajera) para que el panel muestre más de un usuario
INSERT INTO persona (empresa_id, nombre, apellido, usuario, contrasena, telefono, direccion, rol_id)
SELECT 2, 'Camila', 'Rojas', 'camila.rojas@llano-demo.com', '$2b$10$9WhdBrFllG64ubkP6mXkC.zZDdpJnutdjoEdU2Ki8VRcuBSdttUoi',
       '3205550124', 'Villavicencio', 3
WHERE NOT EXISTS (SELECT 1 FROM persona WHERE usuario = 'camila.rojas@llano-demo.com');

COMMIT;

-- Comprobación (opcional):
-- SELECT p.id, p.nombre, p.precio, p.stock, p.unidad, c.nombre AS categoria FROM productos p LEFT JOIN categoria c ON c.id = p.categoria_id WHERE p.empresa_id = 2 ORDER BY p.id;
-- SELECT nombre, monto_minimo, descuento_porcentaje FROM niveles_lealtad WHERE empresa_id = 2 ORDER BY monto_minimo;
