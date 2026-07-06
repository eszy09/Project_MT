CREATE INDEX ix_workout_sessions_user_history_cursor
    ON workout_sessions (user_id, completed_at DESC, id DESC)
    WHERE status = 'COMPLETED';
