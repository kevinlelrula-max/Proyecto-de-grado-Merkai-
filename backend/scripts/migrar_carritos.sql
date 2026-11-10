CREATE TABLE IF NOT EXISTS carritos (
  id                 SERIAL PRIMARY KEY,
  empresa_id         INT           NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id         INT           NOT NULL,
  cliente_nombre     VARCHAR(200),
  cliente_email      VARCHAR(200),
  cliente_telefono   VARCHAR(50),
  items              JSONB         NOT NULL DEFAULT '[]',
  total              DECIMAL(12,2) DEFAULT 0,
  ultima_actividad   TIMESTAMPTZ   DEFAULT NOW(),
  convertido         BOOLEAN       DEFAULT FALSE,
  creado_en          TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(empresa_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_carritos_empresa_activo
  ON carritos(empresa_id, convertido, ultima_actividad)
  WHERE convertido = FALSE;
