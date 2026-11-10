-- Historial de cambios de estado de pedidos online
CREATE TABLE IF NOT EXISTS pedido_estados_historial (
  id          SERIAL PRIMARY KEY,
  pedido_id   INT NOT NULL REFERENCES pedidos_online(id) ON DELETE CASCADE,
  estado      VARCHAR(30) NOT NULL,
  nota        VARCHAR(300),
  cambiado_en TIMESTAMP DEFAULT NOW()
);
