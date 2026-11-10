-- Stock actual de los productos de la empresa, para revisar antes (o después) de ejecutar poblar_demo.sql.
-- Solo lee datos. Pégalo en el editor SQL de Neon. Cambia el 1 por el id de la empresa si es otra (1 = Pesquera Estrada).
--
-- Columnas:
--   stock_actual        unidades (kg) que hay ahora.
--   venta_maxima_demo   lo más grande que el script le vende de una vez a un producto (unas 16 unidades por compra de los clientes Oro).
--   alcanza_para_demo   "SI" si el producto tiene al menos 16 unidades. El script elige solo productos con stock suficiente,
--                       así que basta con que VARIOS productos estén en "SI" (idealmente 8 o más).
WITH par AS (SELECT 1 AS empresa_id)
SELECT p.id,
       p.nombre,
       p.precio,
       p.stock                                   AS stock_actual,
       CASE WHEN p.stock >= 16 THEN 'SI' ELSE 'no' END AS alcanza_para_demo,
       p.activo
FROM productos p, par
WHERE p.empresa_id = par.empresa_id
ORDER BY p.stock DESC, p.nombre;

-- Resumen (ejecútalo aparte si quieres):
-- SELECT count(*) FILTER (WHERE activo IS NOT FALSE)               AS productos_activos,
--        sum(stock) FILTER (WHERE activo IS NOT FALSE)             AS stock_total,
--        count(*) FILTER (WHERE activo IS NOT FALSE AND stock >= 16) AS productos_con_16_o_mas
-- FROM productos WHERE empresa_id = 1;
