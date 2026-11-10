-- =====================================================
-- MIGRACIÓN: Sistema de cupones y descuentos
-- Ejecutar una sola vez en la base de datos
-- =====================================================

-- Tabla principal de cupones
CREATE TABLE IF NOT EXISTS cupones (
  id               SERIAL PRIMARY KEY,
  empresa_id       INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo           VARCHAR(50) NOT NULL,
  descripcion      VARCHAR(200),
  tipo             VARCHAR(20) NOT NULL DEFAULT 'porcentaje'
                   CHECK (tipo IN ('porcentaje', 'valor_fijo', 'envio_gratis')),
  valor            NUMERIC(10,2) NOT NULL DEFAULT 0,
  minimo_compra    NUMERIC(12,2) NOT NULL DEFAULT 0,
  maximo_descuento NUMERIC(12,2),
  usos_totales     INT,
  usos_por_cliente INT NOT NULL DEFAULT 1,
  usos_actuales    INT NOT NULL DEFAULT 0,
  activo           BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio     TIMESTAMP DEFAULT NOW(),
  fecha_fin        TIMESTAMP,
  creado_en        TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, codigo)
);

-- Registro histórico de cada uso
CREATE TABLE IF NOT EXISTS cupones_usos (
  id                 SERIAL PRIMARY KEY,
  cupon_id           INT NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  cliente_id         INT REFERENCES persona(id),
  pedido_id          INT REFERENCES pedidos_online(id),
  descuento_aplicado NUMERIC(12,2) NOT NULL,
  fecha              TIMESTAMP DEFAULT NOW()
);

-- Columnas en pedidos_online para registrar el cupón usado
ALTER TABLE pedidos_online ADD COLUMN IF NOT EXISTS cupon_id  INT REFERENCES cupones(id);
ALTER TABLE pedidos_online ADD COLUMN IF NOT EXISTS descuento NUMERIC(12,2) NOT NULL DEFAULT 0;
