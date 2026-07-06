CREATE TABLE routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    muscle_group VARCHAR(20) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (LENGTH(BTRIM(name)) > 0),
    CHECK (description IS NULL OR LENGTH(BTRIM(description)) > 0),
    CHECK (muscle_group IN ('CHEST','BACK','SHOULDERS','ARMS','LEGS','FULL_BODY','OTHER')),
    CHECK (version > 0)
);

CREATE TABLE routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL,
    user_id UUID NOT NULL,
    position SMALLINT NOT NULL CHECK (position > 0),
    exercise_code VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    notes VARCHAR(1000),
    FOREIGN KEY (routine_id, user_id) REFERENCES routines(id, user_id) ON DELETE CASCADE,
    UNIQUE (routine_id, position),
    UNIQUE (id, routine_id, user_id),
    CHECK (LENGTH(BTRIM(exercise_code)) > 0),
    CHECK (LENGTH(BTRIM(display_name)) > 0)
);

CREATE TABLE routine_set_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_exercise_id UUID NOT NULL,
    routine_id UUID NOT NULL,
    user_id UUID NOT NULL,
    position SMALLINT NOT NULL CHECK (position > 0),
    target_weight_kg NUMERIC(7,3) CHECK (target_weight_kg BETWEEN 0 AND 2000),
    target_repetitions SMALLINT NOT NULL CHECK (target_repetitions BETWEEN 1 AND 1000),
    notes VARCHAR(500),
    FOREIGN KEY (routine_exercise_id, routine_id, user_id)
        REFERENCES routine_exercises(id, routine_id, user_id) ON DELETE CASCADE,
    UNIQUE (routine_exercise_id, position)
);

CREATE INDEX ix_routines_user_archived_updated
    ON routines (user_id, archived_at, updated_at DESC);

CREATE TRIGGER trg_routines_updated_at
BEFORE UPDATE ON routines FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();
