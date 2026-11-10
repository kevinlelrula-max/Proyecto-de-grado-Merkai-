-- =============================================
-- SISTEMA DE REFERIDOS
-- =============================================

-- Código único de referido en cada persona
ALTER TABLE persona ADD COLUMN IF NOT EXISTS codigo_referido VARCHAR(20) UNIQUE;

-- ─────────────────────────────────────────────
-- Tabla 1: Premio para el AMIGO según nivel del referidor
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referidos_config_amigo (
  id            SERIAL PRIMARY KEY,
  empresa_id    INT          NOT NULL,
  nivel_id      INT          DEFAULT NULL,   -- NULL = sin nivel
  nivel_nombre  VARCHAR(100) NOT NULL DEFAULT 'Sin nivel',
  descuento_pct DECIMAL(5,2) NOT NULL DEFAULT 5,
  envio_gratis  BOOLEAN      DEFAULT FALSE,
  descripcion   VARCHAR(200),
  activo        BOOLEAN      DEFAULT TRUE,
  UNIQUE(empresa_id, nivel_id)
);

-- ─────────────────────────────────────────────
-- Tabla 2: Premio para el REFERIDOR según acumulados históricos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referidos_config_referidor (
  id           SERIAL PRIMARY KEY,
  empresa_id   INT          NOT NULL,
  rango_desde  INT          NOT NULL,
  rango_hasta  INT          DEFAULT NULL,   -- NULL = sin límite (ej: 30+)
  tipo_premio  VARCHAR(30)  NOT NULL DEFAULT 'puntos',  -- puntos | descuento_pct
  valor        DECIMAL(10,2) DEFAULT NULL,
  descripcion  VARCHAR(200),
  activo       BOOLEAN      DEFAULT TRUE
);

-- ─────────────────────────────────────────────
-- Registro de cada referido
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referidos (
  id                          SERIAL PRIMARY KEY,
  empresa_id                  INT          NOT NULL,
  referidor_id                INT          NOT NULL REFERENCES persona(id),
  referido_id                 INT          REFERENCES persona(id),
  codigo_usado                VARCHAR(20)  NOT NULL,
  estado                      VARCHAR(30)  NOT NULL DEFAULT 'registrado',
  -- registrado | completado | cancelado
  nivel_referidor_al_completar VARCHAR(100),
  descuento_amigo_pct         DECIMAL(5,2) DEFAULT 0,
  envio_gratis_amigo          BOOLEAN      DEFAULT FALSE,
  tipo_premio_referidor       VARCHAR(30),
  valor_premio_referidor      DECIMAL(10,2),
  pedido_activador_id         INT,
  ip_registro                 INET,
  creado_en                   TIMESTAMP    DEFAULT NOW(),
  completado_en               TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ref_referidor  ON referidos(referidor_id);
CREATE INDEX IF NOT EXISTS idx_ref_referido   ON referidos(referido_id);
CREATE INDEX IF NOT EXISTS idx_ref_codigo     ON referidos(codigo_usado);
CREATE INDEX IF NOT EXISTS idx_ref_empresa    ON referidos(empresa_id, estado);
