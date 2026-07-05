ALTER TABLE user_profiles
    ADD COLUMN primary_goal VARCHAR(40),
    ADD COLUMN target_areas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN experience_level VARCHAR(40),
    ADD COLUMN height_cm NUMERIC(5, 2),
    ADD COLUMN weight_kg NUMERIC(6, 2),
    ADD COLUMN onboarding_step SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE user_profiles
    ADD CONSTRAINT ck_user_profiles_primary_goal
        CHECK (
            primary_goal IS NULL
            OR primary_goal IN (
                'BUILD_MUSCLE',
                'LOSE_FAT',
                'IMPROVE_STRENGTH',
                'GENERAL_FITNESS'
            )
        ),
    ADD CONSTRAINT ck_user_profiles_target_areas
        CHECK (
            target_areas <@ ARRAY[
                'CHEST',
                'BACK',
                'SHOULDERS',
                'ARMS',
                'CORE',
                'GLUTES',
                'LEGS',
                'FULL_BODY'
            ]::TEXT[]
        ),
    ADD CONSTRAINT ck_user_profiles_experience_level
        CHECK (
            experience_level IS NULL
            OR experience_level IN (
                'BEGINNER',
                'INTERMEDIATE',
                'ADVANCED'
            )
        ),
    ADD CONSTRAINT ck_user_profiles_height_cm
        CHECK (
            height_cm IS NULL
            OR height_cm BETWEEN 50 AND 300
        ),
    ADD CONSTRAINT ck_user_profiles_weight_kg
        CHECK (
            weight_kg IS NULL
            OR weight_kg BETWEEN 20 AND 500
        ),
    ADD CONSTRAINT ck_user_profiles_onboarding_step
        CHECK (onboarding_step BETWEEN 1 AND 4),
    ADD CONSTRAINT ck_user_profiles_completed_onboarding
        CHECK (
            onboarding_completed_at IS NULL
            OR (
                primary_goal IS NOT NULL
                AND CARDINALITY(target_areas) > 0
            )
        );
