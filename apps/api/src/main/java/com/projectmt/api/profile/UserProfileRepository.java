package com.projectmt.api.profile;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserProfileRepository {

  private final JdbcClient jdbcClient;

  public UserProfileRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  public Optional<UserProfile> findByIdForUser(
    UUID profileId,
    UUID authenticatedUserId
  ) {
    return jdbcClient
      .sql("""
        SELECT
          id,
          user_id,
          display_name,
          created_at,
          updated_at
        FROM user_profiles
        WHERE id = :profileId
          AND user_id = :authenticatedUserId
        """)
      .param("profileId", profileId)
      .param("authenticatedUserId", authenticatedUserId)
      .query(UserProfileRepository::mapProfile)
      .optional();
  }

  public Optional<UserProfile> updateDisplayNameForUser(
    UUID profileId,
    UUID authenticatedUserId,
    String displayName
  ) {
    return jdbcClient
      .sql("""
        UPDATE user_profiles
        SET display_name = :displayName
        WHERE id = :profileId
          AND user_id = :authenticatedUserId
        RETURNING
          id,
          user_id,
          display_name,
          created_at,
          updated_at
        """)
      .param("profileId", profileId)
      .param("authenticatedUserId", authenticatedUserId)
      .param("displayName", displayName)
      .query(UserProfileRepository::mapProfile)
      .optional();
  }

  public boolean deleteByIdForUser(
    UUID profileId,
    UUID authenticatedUserId
  ) {
    int deletedRows = jdbcClient
      .sql("""
        DELETE FROM user_profiles
        WHERE id = :profileId
          AND user_id = :authenticatedUserId
        """)
      .param("profileId", profileId)
      .param("authenticatedUserId", authenticatedUserId)
      .update();

    return deletedRows == 1;
  }

  public Optional<OnboardingProfile> findOnboardingForUser(
    UUID authenticatedUserId
  ) {
    return jdbcClient
      .sql("""
        SELECT
          id,
          user_id,
          display_name,
          primary_goal,
          target_areas,
          experience_level,
          height_cm,
          weight_kg,
          onboarding_step,
          onboarding_completed_at,
          created_at,
          updated_at
        FROM user_profiles
        WHERE user_id = :authenticatedUserId
        """)
      .param("authenticatedUserId", authenticatedUserId)
      .query(UserProfileRepository::mapOnboardingProfile)
      .optional();
  }

  public OnboardingProfile saveProfileStageForUser(
    UUID authenticatedUserId,
    String displayName
  ) {
    return jdbcClient
      .sql("""
        INSERT INTO user_profiles (
          user_id,
          display_name,
          onboarding_step
        )
        VALUES (
          :authenticatedUserId,
          :displayName,
          2
        )
        ON CONFLICT (user_id) DO UPDATE
        SET
          display_name = EXCLUDED.display_name,
          onboarding_step = GREATEST(
            user_profiles.onboarding_step,
            2
          )
        RETURNING
          id,
          user_id,
          display_name,
          primary_goal,
          target_areas,
          experience_level,
          height_cm,
          weight_kg,
          onboarding_step,
          onboarding_completed_at,
          created_at,
          updated_at
        """)
      .param("authenticatedUserId", authenticatedUserId)
      .param("displayName", displayName)
      .query(UserProfileRepository::mapOnboardingProfile)
      .single();
  }

  public Optional<OnboardingProfile> saveGoalsStageForUser(
    UUID authenticatedUserId,
    PrimaryGoal primaryGoal,
    Set<TargetArea> targetAreas
  ) {
    String[] targetAreaValues = targetAreas
      .stream()
      .map(Enum::name)
      .toArray(String[]::new);

    return jdbcClient
      .sql("""
        UPDATE user_profiles
        SET
          primary_goal = :primaryGoal,
          target_areas = :targetAreas,
          onboarding_step = GREATEST(onboarding_step, 3)
        WHERE user_id = :authenticatedUserId
        RETURNING
          id,
          user_id,
          display_name,
          primary_goal,
          target_areas,
          experience_level,
          height_cm,
          weight_kg,
          onboarding_step,
          onboarding_completed_at,
          created_at,
          updated_at
        """)
      .param("authenticatedUserId", authenticatedUserId)
      .param("primaryGoal", primaryGoal.name())
      .param("targetAreas", targetAreaValues)
      .query(UserProfileRepository::mapOnboardingProfile)
      .optional();
  }

  public Optional<OnboardingProfile> saveBodyContextStageForUser(
    UUID authenticatedUserId,
    ExperienceLevel experienceLevel,
    BigDecimal heightCm,
    BigDecimal weightKg
  ) {
    return jdbcClient
      .sql("""
        UPDATE user_profiles
        SET
          experience_level = :experienceLevel,
          height_cm = :heightCm,
          weight_kg = :weightKg,
          onboarding_step = GREATEST(onboarding_step, 4)
        WHERE user_id = :authenticatedUserId
        RETURNING
          id,
          user_id,
          display_name,
          primary_goal,
          target_areas,
          experience_level,
          height_cm,
          weight_kg,
          onboarding_step,
          onboarding_completed_at,
          created_at,
          updated_at
        """)
      .param("authenticatedUserId", authenticatedUserId)
      .param(
        "experienceLevel",
        experienceLevel == null ? null : experienceLevel.name()
      )
      .param("heightCm", heightCm)
      .param("weightKg", weightKg)
      .query(UserProfileRepository::mapOnboardingProfile)
      .optional();
  }

  public Optional<OnboardingProfile> completeOnboardingForUser(
    UUID authenticatedUserId
  ) {
    return jdbcClient
      .sql("""
        UPDATE user_profiles
        SET onboarding_completed_at = COALESCE(
          onboarding_completed_at,
          CURRENT_TIMESTAMP
        )
        WHERE user_id = :authenticatedUserId
          AND primary_goal IS NOT NULL
          AND CARDINALITY(target_areas) > 0
        RETURNING
          id,
          user_id,
          display_name,
          primary_goal,
          target_areas,
          experience_level,
          height_cm,
          weight_kg,
          onboarding_step,
          onboarding_completed_at,
          created_at,
          updated_at
        """)
      .param("authenticatedUserId", authenticatedUserId)
      .query(UserProfileRepository::mapOnboardingProfile)
      .optional();
  }

  private static UserProfile mapProfile(
    ResultSet resultSet,
    int rowNumber
  ) throws SQLException {
    return new UserProfile(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("user_id", UUID.class),
      resultSet.getString("display_name"),
      resultSet.getTimestamp("created_at").toInstant(),
      resultSet.getTimestamp("updated_at").toInstant()
    );
  }

  private static OnboardingProfile mapOnboardingProfile(
    ResultSet resultSet,
    int rowNumber
  ) throws SQLException {
    String primaryGoal = resultSet.getString("primary_goal");
    String experienceLevel = resultSet.getString(
      "experience_level"
    );
    String[] targetAreas = (String[]) resultSet
      .getArray("target_areas")
      .getArray();
    var completedAt = resultSet.getTimestamp(
      "onboarding_completed_at"
    );

    return new OnboardingProfile(
      resultSet.getObject("id", UUID.class),
      resultSet.getObject("user_id", UUID.class),
      resultSet.getString("display_name"),
      primaryGoal == null
        ? null
        : PrimaryGoal.valueOf(primaryGoal),
      Arrays
        .stream(targetAreas)
        .map(TargetArea::valueOf)
        .collect(Collectors.toUnmodifiableSet()),
      experienceLevel == null
        ? null
        : ExperienceLevel.valueOf(experienceLevel),
      resultSet.getBigDecimal("height_cm"),
      resultSet.getBigDecimal("weight_kg"),
      resultSet.getInt("onboarding_step"),
      completedAt == null ? null : completedAt.toInstant(),
      resultSet.getTimestamp("created_at").toInstant(),
      resultSet.getTimestamp("updated_at").toInstant()
    );
  }
}
