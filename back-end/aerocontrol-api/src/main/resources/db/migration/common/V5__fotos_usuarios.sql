-- ---------------------------------------------------------------------
-- Foto do colaborador (no máximo uma). Fica em tabela separada para que
-- a listagem de usuários e o login não carreguem as imagens.
-- ---------------------------------------------------------------------
CREATE TABLE user_photos (
    user_id       BIGINT       NOT NULL PRIMARY KEY,
    content_type  VARCHAR(20)  NOT NULL,
    data          BYTEA        NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_photos_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_user_photos_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp'))
);
