CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES app_users (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_profiles_user
        UNIQUE (user_id),

    CONSTRAINT uq_user_profiles_id_user
        UNIQUE (id, user_id),

    CONSTRAINT ck_user_profiles_display_name_not_blank
        CHECK (LENGTH(BTRIM(display_name)) > 0),

    CONSTRAINT ck_user_profiles_timestamps
        CHECK (updated_at >= created_at)
);

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();
