-- Rename old B2B referidos table
ALTER TABLE referidos RENAME TO referidos_empresas;

-- New client-to-client referidos table
CREATE TABLE referidos (
  id                           SERIAL PRIMARY KEY,
  empresa_id                   INT           NOT NULL,
  referidor_id                 INT           NOT NULL REFERENCES persona(id),
  referido_id                  INT           REFERENCES persona(id),
  codigo_usado                 VARCHAR(20)   NOT NULL,
  estado                       VARCHAR(30)   NOT NULL DEFAULT 'registrado',
  nivel_referidor_al_completar VARCHAR(100),
  descuento_amigo_pct          DECIMAL(5,2)  DEFAULT 0,
  envio_gratis_amigo           BOOLEAN       DEFAULT FALSE,
  tipo_premio_referidor        VARCHAR(30),
  valor_premio_referidor       DECIMAL(10,2),
  pedido_activador_id          INT,
  ip_registro                  INET,
  creado_en                    TIMESTAMP     DEFAULT NOW(),
  completado_en                TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ref_referidor ON referidos(referidor_id);
CREATE INDEX IF NOT EXISTS idx_ref_referido  ON referidos(referido_id);
CREATE INDEX IF NOT EXISTS idx_ref_codigo    ON referidos(codigo_usado);
CREATE INDEX IF NOT EXISTS idx_ref_empresa   ON referidos(empresa_id, estado);
