ALTER TABLE workout_sessions
    ADD COLUMN completion_key VARCHAR(100),
    ADD COLUMN request_fingerprint CHAR(64);

ALTER TABLE workout_sessions
    ADD CONSTRAINT uq_workout_sessions_user_completion_key
        UNIQUE (user_id, completion_key),

    ADD CONSTRAINT ck_workout_sessions_completion_identity
        CHECK (
            (
                status = 'COMPLETED'
                AND completion_key IS NOT NULL
                AND LENGTH(BTRIM(completion_key)) > 0
                AND request_fingerprint IS NOT NULL
            )
            OR (
                status <> 'COMPLETED'
                AND completion_key IS NULL
                AND request_fingerprint IS NULL
            )
        ),

    ADD CONSTRAINT ck_workout_sessions_request_fingerprint
        CHECK (
            request_fingerprint IS NULL
            OR request_fingerprint ~ '^[0-9a-f]{64}$'
        );
