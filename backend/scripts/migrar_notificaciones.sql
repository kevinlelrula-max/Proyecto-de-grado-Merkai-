-- =============================================
-- SISTEMA DE NOTIFICACIONES
-- =============================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id             SERIAL PRIMARY KEY,
  empresa_id     INT          NOT NULL,
  tipo           VARCHAR(50)  NOT NULL,
  -- tipos: nuevo_pedido | stock_bajo | nuevo_cliente | pedido_entregado | pedido_cancelado | cupon_por_vencer
  titulo         VARCHAR(200) NOT NULL,
  mensaje        TEXT,
  leida          BOOLEAN      DEFAULT FALSE,
  seccion        VARCHAR(50),   -- sección del dashboard a abrir al hacer clic
  referencia_id  INT,           -- id del pedido, producto o cliente relacionado
  creado_en      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_empresa  ON notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notif_leida    ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notif_fecha    ON notificaciones(creado_en DESC);
