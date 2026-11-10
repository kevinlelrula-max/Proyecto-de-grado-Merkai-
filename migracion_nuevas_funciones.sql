-- =====================================================
-- MIGRACIÓN: IVA, Devoluciones, Cierre de Caja
-- Ejecutar en Neon (SQL Editor)
-- =====================================================

-- 1. IVA/impuesto configurable por empresa
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC(5,2) DEFAULT 0;

-- 2. Tabla de devoluciones / reembolsos
CREATE TABLE IF NOT EXISTS devoluciones (
  id               SERIAL PRIMARY KEY,
  empresa_id       INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  tipo             VARCHAR(20)  NOT NULL CHECK (tipo IN ('venta', 'pedido')),
  referencia_id    INTEGER      NOT NULL,
  motivo           TEXT         NOT NULL,
  productos        JSONB        NOT NULL DEFAULT '[]',
  monto_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  metodo_reembolso VARCHAR(50)  DEFAULT 'efectivo',
  estado           VARCHAR(20)  DEFAULT 'aprobada',
  created_at       TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devoluciones_empresa ON devoluciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_tipo    ON devoluciones(tipo, referencia_id);

-- 3. Tabla de sesiones de caja (cierre de caja formal)
CREATE TABLE IF NOT EXISTS caja_sesiones (
  id              SERIAL PRIMARY KEY,
  empresa_id      INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id      INTEGER REFERENCES persona(id),
  monto_apertura  NUMERIC(12,2) DEFAULT 0,
  monto_cierre    NUMERIC(12,2),
  observaciones   TEXT,
  estado          VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  fecha_apertura  TIMESTAMP DEFAULT NOW(),
  fecha_cierre    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_caja_sesiones_empresa ON caja_sesiones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_caja_sesiones_estado  ON caja_sesiones(empresa_id, estado);
