CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_app_users_status
        CHECK (status IN ('ACTIVE', 'DISABLED', 'DELETED')),

    CONSTRAINT ck_app_users_timestamps
        CHECK (updated_at >= created_at)
);

CREATE TABLE user_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    issuer VARCHAR(2048) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_identities_user
        FOREIGN KEY (user_id)
        REFERENCES app_users (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_identities_issuer_subject
        UNIQUE (issuer, subject),

    CONSTRAINT uq_user_identities_user_issuer
        UNIQUE (user_id, issuer),

    CONSTRAINT ck_user_identities_issuer_not_blank
        CHECK (LENGTH(BTRIM(issuer)) > 0),

    CONSTRAINT ck_user_identities_subject_not_blank
        CHECK (LENGTH(BTRIM(subject)) > 0),

    CONSTRAINT ck_user_identities_timestamps
        CHECK (updated_at >= created_at)
);

CREATE FUNCTION set_row_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_user_identities_updated_at
BEFORE UPDATE ON user_identities
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();