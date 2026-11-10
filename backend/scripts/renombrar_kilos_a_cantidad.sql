-- =============================================
-- Renombrar columna kilos → cantidad
-- Las tablas de detalle ahora son multi-sector
-- La unidad real se lee de productos.unidad
-- =============================================

ALTER TABLE detalle_venta
  RENAME COLUMN kilos TO cantidad;

ALTER TABLE detalle_pedido_online
  RENAME COLUMN kilos TO cantidad;
