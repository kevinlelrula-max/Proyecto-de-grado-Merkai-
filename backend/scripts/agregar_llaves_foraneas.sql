-- Declara las llaves foráneas que faltan para que el ERD de pgAdmin muestre todas las relaciones.
-- Seguro de re-ejecutar: omite columnas inexistentes y FK que ya existen.

CREATE OR REPLACE FUNCTION pg_temp.add_fk(t text, c text, ref text, on_del text DEFAULT 'NO ACTION')
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rel      regclass := to_regclass(format('public.%I', t));
  nombre   text     := left(format('fk_%s_%s', t, c), 63);
  not_null boolean;
  accion   text     := on_del;
BEGIN
  IF rel IS NULL OR to_regclass(format('public.%I', ref)) IS NULL THEN
    RAISE NOTICE 'OMITIDA  %.% -> % (tabla no existe)', t, c, ref; RETURN;
  END IF;

  SELECT a.attnotnull INTO not_null
  FROM pg_attribute a WHERE a.attrelid = rel AND a.attname = c AND NOT a.attisdropped;
  IF NOT FOUND THEN
    RAISE NOTICE 'OMITIDA  %.% -> % (columna no existe)', t, c, ref; RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
    WHERE con.contype = 'f' AND con.conrelid = rel AND a.attname = c
  ) THEN
    RAISE NOTICE 'YA EXISTE %.% -> %', t, c, ref; RETURN;
  END IF;

  -- SET NULL sobre una columna NOT NULL fallaría al borrar; se protege el historial con NO ACTION
  IF accion = 'SET NULL' AND not_null THEN accion := 'NO ACTION'; END IF;

  BEGIN
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE %s NOT VALID',
                   rel, nombre, c, ref, accion);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'ERROR    %.% -> %: %', t, c, ref, SQLERRM; RETURN;
  END;

  BEGIN
    EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', rel, nombre);
    RAISE NOTICE 'CREADA   %.% -> % (ON DELETE %)', t, c, ref, accion;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'CREADA SIN VALIDAR %.% -> % (hay filas huérfanas): %', t, c, ref, SQLERRM;
  END;
END $$;

-- 1. Multitenant: toda tabla con empresa_id apunta a empresas
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.columns
           WHERE table_schema = 'public' AND column_name = 'empresa_id' AND table_name <> 'empresas'
           ORDER BY table_name
  LOOP
    PERFORM pg_temp.add_fk(r.table_name, 'empresa_id', 'empresas', 'CASCADE');
  END LOOP;
END $$;

-- 2. Relaciones de negocio
-- Núcleo / Auth
SELECT pg_temp.add_fk('persona',                    'rol_id',              'roles');
SELECT pg_temp.add_fk('persona_empresas',           'persona_id',          'persona',         'CASCADE');
SELECT pg_temp.add_fk('persona_empresas',           'rol_id',              'roles');
SELECT pg_temp.add_fk('rol_permisos',               'rol_id',              'roles',           'CASCADE');

-- Catálogo
SELECT pg_temp.add_fk('categoria',                  'parent_id',           'categoria',       'SET NULL');
SELECT pg_temp.add_fk('productos',                  'categoria_id',        'categoria',       'SET NULL');
SELECT pg_temp.add_fk('producto_imagenes',          'producto_id',         'productos',       'CASCADE');

-- Ventas POS
SELECT pg_temp.add_fk('ventas',                     'administrador_id',    'persona');
SELECT pg_temp.add_fk('ventas',                     'cliente_id',          'persona');
SELECT pg_temp.add_fk('ventas',                     'metodo_pago_id',      'metodo_pago');
SELECT pg_temp.add_fk('detalle_venta',              'venta_id',            'ventas',          'CASCADE');
SELECT pg_temp.add_fk('detalle_venta',              'producto_id',         'productos',       'SET NULL');

-- Tienda en línea
SELECT pg_temp.add_fk('pedidos_online',             'cliente_id',          'persona');
SELECT pg_temp.add_fk('pedidos_online',             'metodo_pago_id',      'metodo_pago');
SELECT pg_temp.add_fk('pedidos_online',             'cupon_id',            'cupones',         'SET NULL');
SELECT pg_temp.add_fk('detalle_pedido_online',      'pedido_id',           'pedidos_online',  'CASCADE');
SELECT pg_temp.add_fk('detalle_pedido_online',      'producto_id',         'productos',       'SET NULL');
SELECT pg_temp.add_fk('pedido_estados_historial',   'pedido_id',           'pedidos_online',  'CASCADE');
SELECT pg_temp.add_fk('pagos_online',               'pedido_id',           'pedidos_online');
SELECT pg_temp.add_fk('carritos',                   'cliente_id',          'persona',         'CASCADE');

-- Marketing
SELECT pg_temp.add_fk('cupones_usos',               'cupon_id',            'cupones',         'CASCADE');
SELECT pg_temp.add_fk('cupones_usos',               'cliente_id',          'persona',         'CASCADE');
SELECT pg_temp.add_fk('cupones_usos',               'pedido_id',           'pedidos_online',  'SET NULL');
SELECT pg_temp.add_fk('referidos',                  'referidor_id',        'persona');
SELECT pg_temp.add_fk('referidos',                  'referido_id',         'persona',         'SET NULL');
SELECT pg_temp.add_fk('referidos',                  'pedido_activador_id', 'pedidos_online',  'SET NULL');
SELECT pg_temp.add_fk('referidos',                  'nivel_heredado_id',   'niveles_lealtad', 'SET NULL');
SELECT pg_temp.add_fk('referidos_config_amigo',     'nivel_id',            'niveles_lealtad', 'SET NULL');
SELECT pg_temp.add_fk('referidos_config_amigo',     'nivel_heredado_id',   'niveles_lealtad', 'SET NULL');
SELECT pg_temp.add_fk('referidos_config_referidor', 'nivel_id',            'niveles_lealtad', 'SET NULL');
SELECT pg_temp.add_fk('referidos_empresas',         'empresa_origen_id',   'empresas',        'CASCADE');
SELECT pg_temp.add_fk('referidos_empresas',         'empresa_referida_id', 'empresas',        'CASCADE');

-- Configuración
SELECT pg_temp.add_fk('empresa_metodo_pago',        'metodo_id',           'metodo_pago',     'CASCADE');
SELECT pg_temp.add_fk('empresa_metodo_pago',        'metodo_pago_id',      'metodo_pago',     'CASCADE');

-- Operaciones / Feedback
SELECT pg_temp.add_fk('caja_sesiones',              'usuario_id',          'persona');
SELECT pg_temp.add_fk('reseñas',                    'producto_id',         'productos',       'CASCADE');
SELECT pg_temp.add_fk('reseñas',                    'cliente_id',          'persona',         'CASCADE');

-- Ubicación
SELECT pg_temp.add_fk('municipios',                 'id_departamento',     'departamentos',   'CASCADE');
SELECT pg_temp.add_fk('persona',                    'id_municipio',        'municipios',      'SET NULL');

-- 3. Verificación: tablas sueltas y columnas *_id que siguen sin FK
SELECT 'tabla sin relaciones' AS problema, t.table_name AS tabla, NULL AS columna
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    WHERE con.contype = 'f'
      AND (con.conrelid  = to_regclass(format('public.%I', t.table_name))
        OR con.confrelid = to_regclass(format('public.%I', t.table_name)))
  )
UNION ALL
SELECT 'columna _id sin FK', c.table_name, c.column_name
FROM information_schema.columns c
WHERE c.table_schema = 'public' AND c.column_name LIKE '%\_id' AND c.column_name <> 'id'
  AND NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
    WHERE con.contype = 'f'
      AND con.conrelid = to_regclass(format('public.%I', c.table_name))
      AND a.attname = c.column_name
  )
ORDER BY 1, 2, 3;
