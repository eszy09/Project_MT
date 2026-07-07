package com.projectmt.api.media;

import java.time.Instant;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class MediaRepository {

  private final JdbcClient jdbc;

  MediaRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  UUID insert(
    UUID userId,
    String objectKey,
    MediaUploadCommand command,
    Instant consentAcceptedAt
  ) {
    return jdbc
      .sql(
        """
        INSERT INTO media_assets (
          user_id,
          object_key,
          original_filename,
          content_type,
          size_bytes,
          consent_accepted_at
        )
        VALUES (
          :userId,
          :objectKey,
          :filename,
          :contentType,
          :sizeBytes,
          :consentAcceptedAt
        )
        RETURNING id
        """
      )
      .param("userId", userId)
      .param("objectKey", objectKey)
      .param("filename", command.filename())
      .param("contentType", command.contentType())
      .param("sizeBytes", command.sizeBytes())
      .param("consentAcceptedAt", Timestamp.from(consentAcceptedAt))
      .query(UUID.class)
      .single();
  }

  List<MediaAsset> list(UUID userId) {
    return jdbc
      .sql(
        """
        SELECT id, object_key, original_filename, content_type, size_bytes,
               status, consent_accepted_at, retention_policy, created_at, updated_at
        FROM media_assets
        WHERE user_id = :userId AND deleted_at IS NULL
        ORDER BY updated_at DESC, created_at DESC
        """
      )
      .param("userId", userId)
      .query(this::map)
      .list();
  }

  Optional<MediaAsset> find(UUID userId, UUID id) {
    return jdbc
      .sql(
        """
        SELECT id, object_key, original_filename, content_type, size_bytes,
               status, consent_accepted_at, retention_policy, created_at, updated_at
        FROM media_assets
        WHERE id = :id AND user_id = :userId AND deleted_at IS NULL
        """
      )
      .param("id", id)
      .param("userId", userId)
      .query(this::map)
      .optional();
  }

  boolean markAvailable(UUID userId, UUID id) {
    return jdbc
      .sql(
        """
        UPDATE media_assets
        SET status = 'AVAILABLE'
        WHERE id = :id AND user_id = :userId AND deleted_at IS NULL
        """
      )
      .param("id", id)
      .param("userId", userId)
      .update() == 1;
  }

  boolean markDeleted(UUID userId, UUID id) {
    return jdbc
      .sql(
        """
        UPDATE media_assets
        SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP
        WHERE id = :id AND user_id = :userId AND deleted_at IS NULL
        """
      )
      .param("id", id)
      .param("userId", userId)
      .update() == 1;
  }

  private MediaAsset map(java.sql.ResultSet rs, int rowNum)
    throws java.sql.SQLException {
    return new MediaAsset(
      rs.getObject("id", UUID.class),
      rs.getString("object_key"),
      rs.getString("original_filename"),
      rs.getString("content_type"),
      rs.getLong("size_bytes"),
      rs.getString("status"),
      rs.getTimestamp("consent_accepted_at").toInstant(),
      rs.getString("retention_policy"),
      rs.getTimestamp("created_at").toInstant(),
      rs.getTimestamp("updated_at").toInstant()
    );
  }
}
