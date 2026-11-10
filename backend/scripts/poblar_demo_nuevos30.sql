-- =====================================================================================================
-- Datos de demostración para Merkai: 30 CLIENTES NUEVOS (11 a 40) con compras, niveles de lealtad y referidos.
-- NO toca a los 10 clientes que ya tienes (Laura, Andrés, Camila, Juan, Valentina, Sebastián, Daniela, Felipe, María Fernanda y Santiago):
-- no les crea compras ni pedidos. Solo usa a Laura, Andrés y Juan como referidores de algunos clientes nuevos.
-- Pégalo completo en el editor SQL de Neon (rama production) y ejecútalo UNA vez; si algo falla no queda nada a medias.
--
--   PASO 1) Pone los montos mínimos de los 3 niveles de lealtad (v_montos: 150.000 / 300.000 / 500.000).
--   PASO 2) Suma v_stock_extra (20 kg) al stock de TODOS los productos activos (solo la primera vez; pon 0 para no sumar).
--   PASO 3) Crea los 30 clientes nuevos con sus compras (punto de venta y tienda en línea), ventas de días anteriores (mes pasado),
--           compras de las últimas horas (hoy) y referidos. Descuenta unas 400 unidades de stock.
-- Los correos son nombre.apellido@merkai-demo.com y la contraseña de todos es:  Demo2026!
-- Es seguro repetirlo: un cliente cuyo correo ya existe se omite. Para ver los datos después, ejecuta consultar_demo.sql.
-- =====================================================================================================
DO $demo$
DECLARE
  v_empresa      int  := 1;                       -- <- empresa donde se crean las compras (1 = Pesquera Estrada)
  v_dominio      text := 'merkai-demo.com';
  v_hash         text := '$2b$10$U3Bc/B.6uR6SbUXepAwz.e0A70NoXLYYHBiJyo/qR6Ys64zYpc.g6';  -- contraseña: Demo2026!
  v_direccion    text := 'Calle 15 # 30-20, Villavicencio, Meta';
  v_montos       numeric[] := ARRAY[150000, 300000, 500000];   -- monto mínimo mensual de los 3 niveles de lealtad (de menor a mayor)
  v_stock_extra  numeric   := 20;                              -- unidades (kg) que se SUMAN al stock de cada producto activo de la empresa

  v_admin        int;
  v_metodo       int;
  v_niveles      numeric[];
  v_prods        int[];
  v_ptr          int := 0;
  v_precio_medio numeric;
  c              record;
  e              text;
  k              int;
  v_correo       text;
  v_id           int;
  v_cod          text;
  v_ids          int[] := ARRAY[]::int[];
  v_cods         text[] := ARRAY[]::text[];
  v_primer_pedido int[] := ARRAY[]::int[];
  v_ncompras     int;
  v_cant         numeric;
  v_prod         record;
  v_p            int;
  v_fecha        timestamp;
  v_sub          numeric;
  v_doc          int;
  v_total_ref    numeric;
  v_nivel        text;
  v_plan         text[];
  v_i            int;
  v_tot          numeric;
  v_lote3        boolean;
BEGIN
  -- El cuarto grupo (clientes 31 a 40), el stock extra y las ventas extra a clientes ya creados se hacen solo la primera vez
  v_lote3 := NOT EXISTS (SELECT 1 FROM persona WHERE usuario = 'valeria.ospina@' || v_dominio);

  -- PASO 1: niveles de lealtad. Los 3 niveles activos de la empresa (del de menor al de mayor monto) quedan con los montos de v_montos.
  IF (SELECT count(*) FROM niveles_lealtad WHERE empresa_id = v_empresa AND activo) < 3 THEN
    RAISE EXCEPTION 'La empresa % necesita al menos 3 niveles activos en Lealtad.', v_empresa;
  END IF;
  WITH ord AS (
    SELECT id, row_number() OVER (ORDER BY monto_minimo, id) AS rn
    FROM niveles_lealtad WHERE empresa_id = v_empresa AND activo
  )
  UPDATE niveles_lealtad n SET monto_minimo = v_montos[ord.rn]
  FROM ord WHERE n.id = ord.id AND ord.rn <= 3;

  -- PASO 2: stock. A todos los productos activos de la empresa se les suman v_stock_extra unidades (kg).
  -- Solo se suma una vez con esta versión del script (v_lote3 es falso si el cuarto grupo ya se creó, y entonces no se vuelve a sumar).
  IF v_lote3 THEN
    UPDATE productos SET stock = stock + v_stock_extra
    WHERE empresa_id = v_empresa AND activo IS NOT FALSE;
  END IF;

  -- PASO 3: datos de demostración
  SELECT id INTO v_admin FROM persona WHERE empresa_id = v_empresa AND rol_id IN (1, 2) ORDER BY id LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'La empresa % no tiene un administrador (persona con rol 1 o 2).', v_empresa; END IF;

  SELECT id INTO v_metodo FROM metodo_pago WHERE lower(metodo) = 'efectivo' ORDER BY id LIMIT 1;
  IF v_metodo IS NULL THEN RAISE EXCEPTION 'No existe el método de pago Efectivo.'; END IF;

  SELECT array_agg(monto_minimo ORDER BY monto_minimo) INTO v_niveles
    FROM niveles_lealtad WHERE empresa_id = v_empresa AND activo;
  IF v_niveles IS NULL OR array_length(v_niveles, 1) < 3 THEN
    RAISE EXCEPTION 'Configura al menos 3 niveles activos en Lealtad antes de ejecutar este script.';
  END IF;

  SELECT array_agg(id ORDER BY id), avg(precio) INTO v_prods, v_precio_medio
    FROM productos WHERE empresa_id = v_empresa AND activo IS NOT FALSE AND stock > 0;
  IF v_prods IS NULL OR array_length(v_prods, 1) < 3 THEN RAISE EXCEPTION 'No hay suficientes productos con stock.'; END IF;

  -- Clientes que YA existen (de la primera tanda): solo se buscan para usarlos como referidores; NO se les crea ni se les cambia nada
  FOR c IN
    SELECT * FROM (VALUES (1, 'Laura', 'Gómez'), (2, 'Andrés', 'Ramírez'), (4, 'Juan', 'Pérez')) AS t(idx, nombre, apellido)
  LOOP
    v_correo := lower(translate(replace(c.nombre, ' ', ''), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '.'
             || lower(translate(c.apellido, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '@' || v_dominio;
    v_id := NULL;
    SELECT id, codigo_referido INTO v_id, v_cod FROM persona WHERE usuario = v_correo;
    IF v_id IS NOT NULL THEN v_ids[c.idx] := v_id; v_cods[c.idx] := v_cod; END IF;
  END LOOP;

  -- idx, nombre, apellido, nivel buscado (1 = el más bajo, 0 = ninguno), ventas POS, pedidos en línea (estado final), quién lo refirió
  FOR c IN
    SELECT * FROM (VALUES
      -- segundo grupo (hoy = true: sus compras quedan con fecha de las últimas horas, para que "Ventas hoy" no salga en $0)
      (11, 'Carolina',        'Mejía',    2, 3, ARRAY['entregado']::text[],                1,         false, 0),
      (12, 'Esteban',         'Vargas',   1, 2, ARRAY['enviado']::text[],                  1,         false, 0),
      (13, 'Paula Andrea',    'Cruz',     1, 2, ARRAY['entregado']::text[],                2,         false, 0),
      (14, 'Mateo',           'Herrera',  0, 1, ARRAY['confirmado']::text[],               NULL,      true,  0),
      (15, 'Isabela',         'Núñez',    0, 2, ARRAY[]::text[],                           NULL,      true,  0),
      (16, 'Camilo',          'Salazar',  0, 1, ARRAY['confirmado','pendiente']::text[],   NULL,      true,  0),
      (17, 'Natalia',         'Pardo',    0, 1, ARRAY['entregado']::text[],                NULL,      false, 0),
      (18, 'Ricardo',         'Beltrán',  3, 4, ARRAY['entregado','enviado']::text[],      4,         false, 0),
      (19, 'Sofía',           'Quintero', 0, 0, ARRAY['pendiente']::text[],                NULL,      true,  0),
      (20, 'Diego Alejandro', 'Rueda',    0, 1, ARRAY['cancelado']::text[],                NULL,      false, 0),
      -- tercer grupo (la última columna = ventas de días anteriores, de hace 10 a 35 días: quedan en el historial pero no cuentan para el nivel del mes)
      (21, 'Gabriela',        'Montoya',  2, 3, ARRAY['entregado']::text[],                11,        false, 2),
      (22, 'Héctor',          'Rincón',   1, 2, ARRAY['enviado']::text[],                  2,         false, 2),
      (23, 'Lina Marcela',    'Ortega',   3, 4, ARRAY['entregado','entregado']::text[],    18,        false, 3),
      (24, 'Óscar',           'Duarte',   0, 2, ARRAY[]::text[],                           NULL,      false, 3),
      (25, 'Tatiana',         'Ruiz',     1, 2, ARRAY['confirmado']::text[],               NULL,      false, 2),
      (26, 'Jorge Iván',      'Acosta',   0, 1, ARRAY['entregado']::text[],                NULL,      false, 2),
      (27, 'Marcela',         'Peña',     0, 0, ARRAY['pendiente','confirmado']::text[],   NULL,      true,  0),
      (28, 'Brayan',          'Cortés',   0, 2, ARRAY[]::text[],                           NULL,      true,  0),
      (29, 'Yuliana',         'Castaño',  2, 3, ARRAY['enviado']::text[],                  4,         false, 1),
      (30, 'Fernando',        'Gil',      0, 1, ARRAY['cancelado']::text[],                NULL,      false, 1),      -- cuarto grupo (clientes 31 a 40)
      (31, 'Valeria',         'Ospina',   3, 4, ARRAY['entregado','enviado']::text[],      1,         false, 2),
      (32, 'Nicolás',         'Arango',   2, 3, ARRAY['confirmado']::text[],               2,         false, 1),
      (33, 'Karen Patricia',  'Mora',     1, 2, ARRAY['entregado']::text[],                23,        false, 3),
      (34, 'Samuel',          'Giraldo',  0, 2, ARRAY[]::text[],                           NULL,      true,  2),
      (35, 'Luisa Fernanda',  'Vega',     1, 2, ARRAY['enviado']::text[],                  18,        false, 0),
      (36, 'Andrés Felipe',   'Roa',      0, 1, ARRAY['entregado']::text[],                NULL,      false, 3),
      (37, 'Mónica',          'Serrano',  0, 0, ARRAY['pendiente','pendiente']::text[],    NULL,      true,  0),
      (38, 'Cristian',        'Bernal',   2, 3, ARRAY['entregado']::text[],                4,         false, 2),
      (39, 'Angie Paola',     'Lozano',   0, 1, ARRAY['confirmado']::text[],               NULL,      true,  1),
      (40, 'Julián David',    'Prieto',   0, 1, ARRAY['cancelado']::text[],                NULL,      false, 2)
    ) AS t(idx, nombre, apellido, nivel, pos, online, referido_por, hoy, hist)
    ORDER BY idx
  LOOP
    v_correo := lower(translate(replace(c.nombre, ' ', ''), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '.'
             || lower(translate(c.apellido, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '@' || v_dominio;

    IF EXISTS (SELECT 1 FROM persona WHERE usuario = v_correo) THEN
      SELECT id, codigo_referido INTO v_id, v_cod FROM persona WHERE usuario = v_correo;
      v_ids[c.idx] := v_id; v_cods[c.idx] := v_cod;
      RAISE NOTICE 'Ya existía % (se omite)', v_correo;
      CONTINUE;
    END IF;

    v_cod := upper(left(regexp_replace(translate(c.nombre, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'), '[^A-Za-z]', 'X', 'g'), 3)) || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO persona (nombre, apellido, usuario, contrasena, telefono, direccion, rol_id, codigo_referido, fecha_registro)
    VALUES (c.nombre, c.apellido, v_correo, v_hash, '30' || lpad((10000000 + c.idx * 137)::text, 8, '0'), v_direccion, 4, v_cod,
            CASE WHEN c.hist > 0 THEN now() - interval '40 days'    -- clientes con ventas del mes pasado: registrados antes
                 ELSE GREATEST(date_trunc('month', now()), now() - interval '9 days') END)
    RETURNING id INTO v_id;
    v_ids[c.idx] := v_id; v_cods[c.idx] := v_cod;

    -- Unidades por compra para llegar al monto mínimo del nivel buscado (a precio completo, con un 5 % de margen)
    v_ncompras := c.pos + (SELECT count(*) FROM unnest(c.online) s WHERE s NOT IN ('pendiente', 'cancelado'));
    IF c.nivel > 0 AND v_ncompras > 0 THEN
      v_cant := greatest(1, ceil(v_niveles[c.nivel] * 1.05 / (v_ncompras * v_precio_medio)));
    ELSE
      v_cant := 1;
    END IF;

    -- Primero los pedidos en línea y después las ventas del punto de venta; si al terminar no llegó al monto de su nivel,
    -- se agregan ventas del punto de venta (máximo 6) hasta lograrlo
    v_plan := c.online || array_fill('pos'::text, ARRAY[c.pos]) || array_fill('hist'::text, ARRAY[c.hist]);
    v_i := 0;
    LOOP
      v_i := v_i + 1;
      IF v_i <= COALESCE(array_length(v_plan, 1), 0) THEN
        e := v_plan[v_i];
      ELSE
        SELECT COALESCE((SELECT sum(total) FROM ventas WHERE cliente_id = v_id
                          AND date_trunc('month', fecha) = date_trunc('month', now())), 0)
             + COALESCE((SELECT sum(total) FROM pedidos_online WHERE cliente_id = v_id AND estado NOT IN ('cancelado', 'pendiente')
                          AND date_trunc('month', fecha_pedido) = date_trunc('month', now())), 0)
          INTO v_tot;
        EXIT WHEN c.nivel = 0 OR v_tot >= v_niveles[c.nivel] OR v_i > COALESCE(array_length(v_plan, 1), 0) + 6;
        e := 'pos';
      END IF;
      -- siguiente producto con stock suficiente
      v_p := NULL;
      FOR k IN 1..array_length(v_prods, 1) LOOP
        v_ptr := v_ptr % array_length(v_prods, 1) + 1;
        SELECT id, precio, stock, nombre INTO v_prod FROM productos WHERE id = v_prods[v_ptr];
        IF v_prod.stock >= v_cant THEN v_p := v_prod.id; EXIT; END IF;
      END LOOP;
      IF v_p IS NULL THEN
        RAISE EXCEPTION 'No hay un producto con % unidades de stock. Sube el stock en Productos y vuelve a ejecutar el script.', v_cant;
      END IF;

      IF e = 'hist' THEN
        v_fecha := now() - (10 + random() * 25) * interval '1 day';   -- ventas de días anteriores (mes pasado)
      ELSIF c.hoy THEN
        v_fecha := now() - random() * interval '3 hours';
      ELSE
        v_fecha := greatest(date_trunc('month', now()), now() - random() * interval '8 days');
      END IF;
      v_sub   := v_prod.precio * v_cant;

      IF e IN ('pos', 'hist') THEN
        INSERT INTO ventas (empresa_id, administrador_id, cliente_id, metodo_pago_id, total, fecha)
        VALUES (v_empresa, v_admin, v_id, v_metodo, v_sub, v_fecha) RETURNING id INTO v_doc;
        INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario)
        VALUES (v_doc, v_p, v_cant, v_prod.precio);
      ELSE
        INSERT INTO pedidos_online (empresa_id, cliente_id, estado, total, metodo_pago_id, direccion_entrega, notas, fecha_pedido, fecha_actualizacion, descuento)
        VALUES (v_empresa, v_id, e, v_sub, v_metodo, v_direccion, 'Pedido de demostración', v_fecha, least(now(), v_fecha + interval '1 day'), 0)
        RETURNING id INTO v_doc;
        INSERT INTO detalle_pedido_online (pedido_id, producto_id, cantidad, precio_unitario)
        VALUES (v_doc, v_p, v_cant, v_prod.precio);
        IF e <> 'pendiente' THEN
          INSERT INTO pedido_estados_historial (pedido_id, estado, cambiado_en)
          VALUES (v_doc, e, least(now(), v_fecha + interval '1 day'));
        END IF;
        IF v_primer_pedido[c.idx] IS NULL THEN v_primer_pedido[c.idx] := v_doc; END IF;
      END IF;

      -- el stock se descuenta en todo menos en lo cancelado (que lo devuelve)
      IF e <> 'cancelado' THEN
        UPDATE productos SET stock = stock - v_cant WHERE id = v_p;
      END IF;
    END LOOP;
  END LOOP;

  -- Ventas extra a algunos clientes NUEVOS (solo la primera vez): 1 venta del punto de venta,
  -- de 1 a 3 unidades, en los últimos días del mes.
  IF v_lote3 THEN
    FOR c IN
      SELECT * FROM (VALUES (11, 1, 3), (13, 1, 3), (21, 1, 4), (23, 1, 3), (25, 1, 3))
        AS t(idx, ventas, dias)   -- (cliente, nº de ventas, repartidas en los últimos N días)
    LOOP
      IF v_ids[c.idx] IS NULL THEN CONTINUE; END IF;
      FOR k IN 1..c.ventas LOOP
        v_cant := 1 + floor(random() * 3);
        v_p := NULL;
        FOR v_i IN 1..array_length(v_prods, 1) LOOP
          v_ptr := v_ptr % array_length(v_prods, 1) + 1;
          SELECT id, precio, stock INTO v_prod FROM productos WHERE id = v_prods[v_ptr];
          IF v_prod.stock >= v_cant THEN v_p := v_prod.id; EXIT; END IF;
        END LOOP;
        IF v_p IS NULL THEN RAISE EXCEPTION 'No hay un producto con % unidades de stock para las ventas extra.', v_cant; END IF;
        v_fecha := greatest(date_trunc('month', now()), now() - random() * c.dias * interval '1 day');
        INSERT INTO ventas (empresa_id, administrador_id, cliente_id, metodo_pago_id, total, fecha)
        VALUES (v_empresa, v_admin, v_ids[c.idx], v_metodo, v_prod.precio * v_cant, v_fecha) RETURNING id INTO v_doc;
        INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario) VALUES (v_doc, v_p, v_cant, v_prod.precio);
        UPDATE productos SET stock = stock - v_cant WHERE id = v_p;
      END LOOP;
    END LOOP;
  END IF;

  -- Referidos: quedan completados con la primera compra del referido, con el nivel que tenía quien lo refirió
  FOR c IN
    SELECT * FROM (VALUES (11, 1), (12, 1), (13, 2), (18, 4), (14, 11), (17, 18), (21, 11), (22, 2), (23, 18), (29, 4), (31, 1), (32, 2), (33, 23), (35, 18), (38, 4))
      AS t(idx, referidor)   -- (referido, referidor)
  LOOP
    IF v_ids[c.idx] IS NULL OR v_ids[c.referidor] IS NULL THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM referidos WHERE referido_id = v_ids[c.idx] AND empresa_id = v_empresa) THEN CONTINUE; END IF;

    SELECT COALESCE((SELECT sum(total) FROM ventas WHERE cliente_id = v_ids[c.referidor] AND empresa_id = v_empresa
                      AND date_trunc('month', fecha) = date_trunc('month', now())), 0)
         + COALESCE((SELECT sum(total) FROM pedidos_online WHERE cliente_id = v_ids[c.referidor] AND empresa_id = v_empresa
                      AND estado NOT IN ('cancelado', 'pendiente')
                      AND date_trunc('month', fecha_pedido) = date_trunc('month', now())), 0)
      INTO v_total_ref;
    SELECT nombre INTO v_nivel FROM niveles_lealtad
      WHERE empresa_id = v_empresa AND activo AND monto_minimo <= v_total_ref ORDER BY monto_minimo DESC LIMIT 1;

    INSERT INTO referidos (empresa_id, referidor_id, referido_id, codigo_usado, estado, nivel_referidor_al_completar,
                           descuento_amigo_pct, envio_gratis_amigo, pedido_activador_id, creado_en, completado_en)
    VALUES (v_empresa, v_ids[c.referidor], v_ids[c.idx], v_cods[c.referidor], 'completado', COALESCE(v_nivel, 'Sin nivel'),
            5, false, v_primer_pedido[c.idx], now() - interval '3 days', now() - interval '2 days');
  END LOOP;

  RAISE NOTICE 'Listo. Ejecuta consultar_demo.sql para ver a los clientes, sus totales y niveles.';
END
$demo$;
