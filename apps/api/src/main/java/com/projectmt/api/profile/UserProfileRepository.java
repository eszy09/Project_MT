package com.projectmt.api.profile;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;
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
}
