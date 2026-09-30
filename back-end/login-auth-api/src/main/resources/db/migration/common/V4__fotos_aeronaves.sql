-- ---------------------------------------------------------------------
-- Foto de cada aeronave (no máximo uma). Fica em tabela separada para
-- que a listagem de aeronaves não carregue as imagens.
-- ---------------------------------------------------------------------
CREATE TABLE aircraft_photos (
    aircraft_id   BIGINT       NOT NULL PRIMARY KEY,
    content_type  VARCHAR(20)  NOT NULL,
    data          BYTEA        NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aircraft_photos_aircraft FOREIGN KEY (aircraft_id) REFERENCES aircraft (id) ON DELETE CASCADE,
    CONSTRAINT ck_aircraft_photos_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);
