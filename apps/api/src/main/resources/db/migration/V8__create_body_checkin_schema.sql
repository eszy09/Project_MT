CREATE TABLE body_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ NOT NULL,
    weight_value NUMERIC(8,3),
    weight_unit VARCHAR(3),
    body_fat_percent NUMERIC(5,2),
    chest_value NUMERIC(8,3),
    chest_unit VARCHAR(2),
    waist_value NUMERIC(8,3),
    waist_unit VARCHAR(2),
    hips_value NUMERIC(8,3),
    hips_unit VARCHAR(2),
    arm_value NUMERIC(8,3),
    arm_unit VARCHAR(2),
    thigh_value NUMERIC(8,3),
    thigh_unit VARCHAR(2),
    notes VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (weight_value IS NULL = (weight_unit IS NULL)),
    CHECK (weight_unit IS NULL OR weight_unit IN ('kg', 'lb')),
    CHECK (weight_value IS NULL OR weight_value BETWEEN 20 AND 1400),
    CHECK (body_fat_percent IS NULL OR body_fat_percent BETWEEN 2 AND 75),
    CHECK (chest_value IS NULL = (chest_unit IS NULL)),
    CHECK (waist_value IS NULL = (waist_unit IS NULL)),
    CHECK (hips_value IS NULL = (hips_unit IS NULL)),
    CHECK (arm_value IS NULL = (arm_unit IS NULL)),
    CHECK (thigh_value IS NULL = (thigh_unit IS NULL)),
    CHECK (chest_unit IS NULL OR chest_unit IN ('cm', 'in')),
    CHECK (waist_unit IS NULL OR waist_unit IN ('cm', 'in')),
    CHECK (hips_unit IS NULL OR hips_unit IN ('cm', 'in')),
    CHECK (arm_unit IS NULL OR arm_unit IN ('cm', 'in')),
    CHECK (thigh_unit IS NULL OR thigh_unit IN ('cm', 'in')),
    CHECK (chest_value IS NULL OR chest_value BETWEEN 10 AND 400),
    CHECK (waist_value IS NULL OR waist_value BETWEEN 10 AND 400),
    CHECK (hips_value IS NULL OR hips_value BETWEEN 10 AND 400),
    CHECK (arm_value IS NULL OR arm_value BETWEEN 3 AND 200),
    CHECK (thigh_value IS NULL OR thigh_value BETWEEN 5 AND 250),
    CHECK (
        weight_value IS NOT NULL OR body_fat_percent IS NOT NULL
        OR chest_value IS NOT NULL OR waist_value IS NOT NULL
        OR hips_value IS NOT NULL OR arm_value IS NOT NULL
        OR thigh_value IS NOT NULL
    )
);

CREATE TABLE derived_body_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    source_checkin_id UUID NOT NULL,
    algorithm_version VARCHAR(50) NOT NULL,
    torso_scale NUMERIC(8,5),
    waist_scale NUMERIC(8,5),
    hip_scale NUMERIC(8,5),
    arm_scale NUMERIC(8,5),
    thigh_scale NUMERIC(8,5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_checkin_id, user_id)
        REFERENCES body_checkins(id, user_id) ON DELETE CASCADE,
    UNIQUE (source_checkin_id, algorithm_version),
    CHECK (LENGTH(BTRIM(algorithm_version)) > 0)
);

CREATE INDEX ix_body_checkins_user_measured_at
    ON body_checkins (user_id, measured_at DESC, id DESC);

CREATE INDEX ix_derived_body_parameters_user_created_at
    ON derived_body_parameters (user_id, created_at DESC);
