CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title VARCHAR(140) NOT NULL,
    content TEXT NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (LENGTH(BTRIM(title)) > 0),
    CHECK (LENGTH(BTRIM(content)) > 0),
    CHECK (LENGTH(title) <= 140),
    CHECK (LENGTH(content) <= 10000),
    CHECK (visibility = 'PRIVATE'),
    CHECK (version > 0)
);

CREATE INDEX ix_journal_entries_user_updated
    ON journal_entries (user_id, updated_at DESC);

CREATE TRIGGER trg_journal_entries_updated_at
BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();
