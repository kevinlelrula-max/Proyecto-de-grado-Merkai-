-- Permite desactivar productos con historial de ventas en vez de eliminarlos.
-- Ejecutar ANTES de desplegar el backend que usa productos.activo.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_productos_empresa_activo ON productos(empresa_id, activo);
