CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workout_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES app_users (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_workout_sessions_id_user
        UNIQUE (id, user_id),

    CONSTRAINT ck_workout_sessions_status
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'DISCARDED')),

    CONSTRAINT ck_workout_sessions_completion
        CHECK (
            (
                status = 'COMPLETED'
                AND completed_at IS NOT NULL
                AND completed_at >= started_at
                AND duration_seconds IS NOT NULL
            )
            OR (
                status <> 'COMPLETED'
                AND completed_at IS NULL
                AND duration_seconds IS NULL
            )
        ),

    CONSTRAINT ck_workout_sessions_duration
        CHECK (
            duration_seconds IS NULL
            OR duration_seconds BETWEEN 0 AND 604800
        ),

    CONSTRAINT ck_workout_sessions_notes
        CHECK (
            notes IS NULL
            OR LENGTH(BTRIM(notes)) > 0
        ),

    CONSTRAINT ck_workout_sessions_timestamps
        CHECK (updated_at >= created_at)
);

CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    position SMALLINT NOT NULL,
    exercise_code VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    notes VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workout_exercises_session_owner
        FOREIGN KEY (workout_session_id, user_id)
        REFERENCES workout_sessions (id, user_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_workout_exercises_session_position
        UNIQUE (workout_session_id, position),

    CONSTRAINT uq_workout_exercises_id_session_user
        UNIQUE (id, workout_session_id, user_id),

    CONSTRAINT ck_workout_exercises_position
        CHECK (position > 0),

    CONSTRAINT ck_workout_exercises_code_not_blank
        CHECK (LENGTH(BTRIM(exercise_code)) > 0),

    CONSTRAINT ck_workout_exercises_display_name_not_blank
        CHECK (LENGTH(BTRIM(display_name)) > 0),

    CONSTRAINT ck_workout_exercises_notes
        CHECK (
            notes IS NULL
            OR LENGTH(BTRIM(notes)) > 0
        ),

    CONSTRAINT ck_workout_exercises_timestamps
        CHECK (updated_at >= created_at)
);

CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL,
    workout_session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    position SMALLINT NOT NULL,
    weight_kg NUMERIC(7, 3),
    repetitions SMALLINT,
    completed_at TIMESTAMPTZ,
    notes VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_workout_sets_exercise_session_owner
        FOREIGN KEY (
            workout_exercise_id,
            workout_session_id,
            user_id
        )
        REFERENCES workout_exercises (
            id,
            workout_session_id,
            user_id
        )
        ON DELETE CASCADE,

    CONSTRAINT uq_workout_sets_exercise_position
        UNIQUE (workout_exercise_id, position),

    CONSTRAINT ck_workout_sets_position
        CHECK (position > 0),

    CONSTRAINT ck_workout_sets_weight
        CHECK (
            weight_kg IS NULL
            OR weight_kg BETWEEN 0 AND 2000
        ),

    CONSTRAINT ck_workout_sets_repetitions
        CHECK (
            repetitions IS NULL
            OR repetitions BETWEEN 1 AND 1000
        ),

    CONSTRAINT ck_workout_sets_completion
        CHECK (
            completed_at IS NULL
            OR (
                weight_kg IS NOT NULL
                AND repetitions IS NOT NULL
            )
        ),

    CONSTRAINT ck_workout_sets_notes
        CHECK (
            notes IS NULL
            OR LENGTH(BTRIM(notes)) > 0
        ),

    CONSTRAINT ck_workout_sets_timestamps
        CHECK (updated_at >= created_at)
);

CREATE INDEX ix_workout_sessions_user_started_at
    ON workout_sessions (user_id, started_at DESC);

CREATE INDEX ix_workout_sessions_user_completed_at
    ON workout_sessions (user_id, completed_at DESC)
    WHERE status = 'COMPLETED';

CREATE INDEX ix_workout_exercises_user_code_session
    ON workout_exercises (user_id, exercise_code, workout_session_id);

CREATE TRIGGER trg_workout_sessions_updated_at
BEFORE UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_workout_exercises_updated_at
BEFORE UPDATE ON workout_exercises
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();

CREATE TRIGGER trg_workout_sets_updated_at
BEFORE UPDATE ON workout_sets
FOR EACH ROW
EXECUTE FUNCTION set_row_updated_at();
