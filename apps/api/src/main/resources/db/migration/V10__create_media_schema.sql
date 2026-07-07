CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    object_key VARCHAR(512) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UPLOAD_PENDING',
    consent_accepted_at TIMESTAMPTZ NOT NULL,
    retention_policy VARCHAR(80) NOT NULL DEFAULT 'USER_CONTROLLED_DELETE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    UNIQUE (id, user_id),
    UNIQUE (object_key),
    CHECK (LENGTH(BTRIM(object_key)) > 0),
    CHECK (LENGTH(BTRIM(original_filename)) > 0),
    CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
    CHECK (size_bytes BETWEEN 1 AND 10485760),
    CHECK (status IN ('UPLOAD_PENDING', 'AVAILABLE', 'DELETED')),
    CHECK (retention_policy = 'USER_CONTROLLED_DELETE')
);

CREATE INDEX ix_media_assets_user_status_updated
    ON media_assets (user_id, status, updated_at DESC);

CREATE TRIGGER trg_media_assets_updated_at
BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();
