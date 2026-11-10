-- =====================================================================================================
-- SEGUNDA TANDA de datos de demostración (NO repite lo que ya ejecutaste con poblar_demo.sql).
-- Pégalo completo en el editor SQL de Neon (rama production) y ejecútalo UNA vez; es todo o nada.
--
-- Qué hace:
--   1) Crea 10 clientes nuevos (Gabriela Montoya, Héctor Rincón, Lina Marcela Ortega, ...) con compras, niveles de lealtad y referidos.
--      Algunos tienen ventas de días anteriores (hace 10 a 35 días, del mes pasado: salen en el historial pero no cuentan para el nivel)
--      y otros tienen compras de las últimas horas (para que "Ventas hoy" no salga en $0).
--   2) Les hace de 1 a 2 ventas más en el punto de venta a clientes que ya existían (Laura, Andrés, Camila, Juan, Valentina, Sebastián y Felipe).
--   3) Registra referidos nuevos entre ellos (los nuevos refieren o son referidos por los clientes ya creados).
--   4) Suma v_stock_extra unidades (kg) al stock de cada producto activo, para cubrir estas compras (pon 0 si no quieres sumar).
--
-- NO cambia los montos de Lealtad (se usan los que ya tienes; deben ser 3 niveles activos).
-- Los correos son nombre.apellido@merkai-demo.com y la contraseña de todos es:  Demo2026!
-- Es seguro repetirlo: si ya se ejecutó (existe gabriela.montoya@...), no hace nada más.
-- Revisa v_empresa (1 = Pesquera Estrada). Mira el stock antes con consultar_stock.sql.
-- =====================================================================================================
DO $demo2$
DECLARE
  v_empresa      int  := 1;
  v_dominio      text := 'merkai-demo.com';
  v_hash         text := '$2b$10$U3Bc/B.6uR6SbUXepAwz.e0A70NoXLYYHBiJyo/qR6Ys64zYpc.g6';  -- contraseña: Demo2026!
  v_direccion    text := 'Calle 15 # 30-20, Villavicencio, Meta';
  v_stock_extra  numeric := 20;          -- kg que se SUMAN a cada producto activo (solo la primera vez)

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
BEGIN
  IF EXISTS (SELECT 1 FROM persona WHERE usuario = 'gabriela.montoya@' || v_dominio) THEN
    RAISE NOTICE 'Esta segunda tanda ya se ejecutó antes; no se hace nada.';
    RETURN;
  END IF;

  SELECT id INTO v_admin FROM persona WHERE empresa_id = v_empresa AND rol_id IN (1, 2) ORDER BY id LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'La empresa % no tiene un administrador (persona con rol 1 o 2).', v_empresa; END IF;
  SELECT id INTO v_metodo FROM metodo_pago WHERE lower(metodo) = 'efectivo' ORDER BY id LIMIT 1;
  IF v_metodo IS NULL THEN RAISE EXCEPTION 'No existe el método de pago Efectivo.'; END IF;

  SELECT array_agg(monto_minimo ORDER BY monto_minimo) INTO v_niveles
    FROM niveles_lealtad WHERE empresa_id = v_empresa AND activo;
  IF v_niveles IS NULL OR array_length(v_niveles, 1) < 3 THEN
    RAISE EXCEPTION 'Configura al menos 3 niveles activos en Lealtad antes de ejecutar este script.';
  END IF;

  -- Stock: se suma ANTES de calcular los productos disponibles
  IF v_stock_extra > 0 THEN
    UPDATE productos SET stock = stock + v_stock_extra WHERE empresa_id = v_empresa AND activo IS NOT FALSE;
  END IF;

  SELECT array_agg(id ORDER BY id), avg(precio) INTO v_prods, v_precio_medio
    FROM productos WHERE empresa_id = v_empresa AND activo IS NOT FALSE AND stock > 0;
  IF v_prods IS NULL OR array_length(v_prods, 1) < 3 THEN RAISE EXCEPTION 'No hay suficientes productos con stock.'; END IF;

  -- Clientes que ya existen (de la primera tanda): se buscan por correo para poder referirlos y venderles
  FOR c IN
    SELECT * FROM (VALUES (1, 'Laura', 'Gómez'), (2, 'Andrés', 'Ramírez'), (3, 'Camila', 'Torres'), (4, 'Juan', 'Pérez'),
                          (5, 'Valentina', 'Rojas'), (6, 'Sebastián', 'Díaz'), (8, 'Felipe', 'Moreno')) AS t(idx, nombre, apellido)
  LOOP
    v_correo := lower(translate(replace(c.nombre, ' ', ''), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '.'
             || lower(translate(c.apellido, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '@' || v_dominio;
    SELECT id, codigo_referido INTO v_id, v_cod FROM persona WHERE usuario = v_correo;
    IF v_id IS NOT NULL THEN v_ids[c.idx] := v_id; v_cods[c.idx] := v_cod; END IF;
    v_id := NULL;
  END LOOP;

  -- idx, nombre, apellido, nivel buscado (1 = el más bajo, 0 = ninguno), ventas POS, pedidos en línea (estado final),
  -- quién lo refirió (1 a 8 = clientes de la primera tanda), compras de las últimas horas, ventas de días anteriores (mes pasado)
  FOR c IN
    SELECT * FROM (VALUES
      (21, 'Gabriela',     'Montoya',  2, 3, ARRAY['entregado']::text[],                1,         false, 2),
      (22, 'Héctor',       'Rincón',   1, 2, ARRAY['enviado']::text[],                  2,         false, 2),
      (23, 'Lina Marcela', 'Ortega',   3, 4, ARRAY['entregado','entregado']::text[],    4,         false, 3),
      (24, 'Óscar',        'Duarte',   0, 2, ARRAY[]::text[],                           NULL::int, false, 3),
      (25, 'Tatiana',      'Ruiz',     1, 2, ARRAY['confirmado']::text[],               NULL,      false, 2),
      (26, 'Jorge Iván',   'Acosta',   0, 1, ARRAY['entregado']::text[],                NULL,      false, 2),
      (27, 'Marcela',      'Peña',     0, 0, ARRAY['pendiente','confirmado']::text[],   NULL,      true,  0),
      (28, 'Brayan',       'Cortés',   0, 2, ARRAY[]::text[],                           NULL,      true,  0),
      (29, 'Yuliana',      'Castaño',  2, 3, ARRAY['enviado']::text[],                  3,         false, 1),
      (30, 'Fernando',     'Gil',      0, 1, ARRAY['cancelado']::text[],                NULL,      false, 1)
    ) AS t(idx, nombre, apellido, nivel, pos, online, referido_por, hoy, hist)
    ORDER BY idx
  LOOP
    v_correo := lower(translate(replace(c.nombre, ' ', ''), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '.'
             || lower(translate(c.apellido, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '@' || v_dominio;

    IF EXISTS (SELECT 1 FROM persona WHERE usuario = v_correo) THEN
      RAISE NOTICE 'Ya existía % (se omite)', v_correo;
      CONTINUE;
    END IF;

    v_cod := upper(left(regexp_replace(translate(c.nombre, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN'), '[^A-Za-z]', 'X', 'g'), 3)) || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO persona (nombre, apellido, usuario, contrasena, telefono, direccion, rol_id, codigo_referido, fecha_registro)
    VALUES (c.nombre, c.apellido, v_correo, v_hash, '30' || lpad((10000000 + c.idx * 137)::text, 8, '0'), v_direccion, 4, v_cod,
            CASE WHEN c.hist > 0 THEN now() - interval '40 days'
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

    -- Primero los pedidos en línea, luego las ventas del punto de venta y las de días anteriores; si no llegó al monto de su nivel
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

      v_p := NULL;
      FOR k IN 1..array_length(v_prods, 1) LOOP
        v_ptr := v_ptr % array_length(v_prods, 1) + 1;
        SELECT id, precio, stock INTO v_prod FROM productos WHERE id = v_prods[v_ptr];
        IF v_prod.stock >= v_cant THEN v_p := v_prod.id; EXIT; END IF;
      END LOOP;
      IF v_p IS NULL THEN
        RAISE EXCEPTION 'No hay un producto con % unidades de stock. Sube el stock en Productos y vuelve a ejecutar el script.', v_cant;
      END IF;

      IF e = 'hist' THEN
        v_fecha := now() - (10 + random() * 25) * interval '1 day';
      ELSIF c.hoy THEN
        v_fecha := now() - random() * interval '3 hours';
      ELSE
        v_fecha := greatest(date_trunc('month', now()), now() - random() * interval '8 days');
      END IF;
      v_sub := v_prod.precio * v_cant;

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

      IF e <> 'cancelado' THEN
        UPDATE productos SET stock = stock - v_cant WHERE id = v_p;
      END IF;
    END LOOP;
  END LOOP;

  -- Ventas extra a clientes que ya existían: 1 a 2 ventas del punto de venta, de 1 a 3 unidades, en los últimos días del mes
  FOR c IN
    SELECT * FROM (VALUES (1, 2, 6), (2, 1, 6), (3, 1, 5), (4, 2, 6), (5, 1, 4), (6, 1, 6), (8, 2, 6))
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

  -- Referidos nuevos: (referido, referidor). Quedan completados con la primera compra del referido
  FOR c IN
    SELECT * FROM (VALUES (21, 1), (22, 2), (23, 4), (29, 3)) AS t(idx, referidor)
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
$demo2$;
