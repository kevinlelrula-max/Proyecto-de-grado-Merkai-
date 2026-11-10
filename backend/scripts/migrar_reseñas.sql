-- =============================================
-- SISTEMA DE RESEÑAS DE PRODUCTOS
-- =============================================

CREATE TABLE IF NOT EXISTS reseñas (
  id            SERIAL PRIMARY KEY,
  producto_id   INT         NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cliente_id    INT         NOT NULL REFERENCES persona(id)   ON DELETE CASCADE,
  empresa_id    INT         NOT NULL,
  calificacion  SMALLINT    NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario    TEXT,
  activo        BOOLEAN     DEFAULT TRUE,
  creado_en     TIMESTAMP   DEFAULT NOW(),
  UNIQUE(producto_id, cliente_id)  -- una reseña por cliente por producto
);

CREATE INDEX IF NOT EXISTS idx_reseñas_producto  ON reseñas(producto_id);
CREATE INDEX IF NOT EXISTS idx_reseñas_empresa   ON reseñas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reseñas_cliente   ON reseñas(cliente_id);
