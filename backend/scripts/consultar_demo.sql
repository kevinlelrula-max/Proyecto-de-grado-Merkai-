-- Consulta los clientes de demostración: correo, código de referido, compras, total del mes, nivel de lealtad y quién los refirió.
-- Pégalo en el editor SQL de Neon. Solo lee datos (no modifica nada).
-- Contraseña de todos los clientes demo: Demo2026!   (la contraseña no se puede leer de la base: se guarda cifrada)
-- Cambia el 1 por el id de la empresa si es otra (1 = Pesquera Estrada).
WITH par AS (SELECT 1 AS empresa_id, '%@merkai-demo.com' AS patron),
base AS (
  SELECT p.id, p.nombre, p.apellido, p.usuario, p.codigo_referido,
    (SELECT count(*) FROM ventas v WHERE v.cliente_id = p.id AND v.empresa_id = par.empresa_id)                       AS ventas_pos,
    (SELECT count(*) FROM pedidos_online o WHERE o.cliente_id = p.id AND o.empresa_id = par.empresa_id)               AS pedidos_online,
    COALESCE((SELECT sum(total) FROM ventas v WHERE v.cliente_id = p.id AND v.empresa_id = par.empresa_id
               AND date_trunc('month', v.fecha) = date_trunc('month', now())), 0)
  + COALESCE((SELECT sum(total) FROM pedidos_online o WHERE o.cliente_id = p.id AND o.empresa_id = par.empresa_id
               AND o.estado NOT IN ('cancelado', 'pendiente')
               AND date_trunc('month', o.fecha_pedido) = date_trunc('month', now())), 0)                              AS total_mes,
    par.empresa_id
  FROM persona p, par
  WHERE p.rol_id = 4 AND p.usuario LIKE par.patron
)
SELECT b.id,
       b.nombre || ' ' || b.apellido                      AS cliente,
       b.usuario                                          AS correo,
       'Demo2026!'                                        AS contrasena_demo,   -- la de todos los clientes demo (si no la cambiaste)
       b.codigo_referido,
       b.ventas_pos,
       b.pedidos_online,
       b.total_mes,
       COALESCE((SELECT n.nombre FROM niveles_lealtad n
                  WHERE n.empresa_id = b.empresa_id AND n.activo AND n.monto_minimo <= b.total_mes
                  ORDER BY n.monto_minimo DESC LIMIT 1), '(sin nivel)') AS nivel,
       (SELECT a.nombre || ' ' || a.apellido FROM referidos r JOIN persona a ON a.id = r.referidor_id
         WHERE r.referido_id = b.id AND r.empresa_id = b.empresa_id LIMIT 1)       AS referido_por
FROM base b
ORDER BY b.id;
