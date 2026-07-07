package com.projectmt.api.journal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class JournalRepository {

  private final JdbcClient jdbc;

  JournalRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  UUID insert(UUID userId, JournalCommand command) {
    return jdbc
      .sql(
        """
        INSERT INTO journal_entries (user_id, title, content)
        VALUES (:userId, :title, :content)
        RETURNING id
        """
      )
      .param("userId", userId)
      .param("title", command.title())
      .param("content", command.content())
      .query(UUID.class)
      .single();
  }

  List<JournalEntry> list(UUID userId) {
    return jdbc
      .sql(
        """
        SELECT id, title, content, visibility, version, created_at, updated_at
        FROM journal_entries
        WHERE user_id = :userId
        ORDER BY updated_at DESC, created_at DESC
        """
      )
      .param("userId", userId)
      .query(this::map)
      .list();
  }

  Optional<JournalEntry> find(UUID userId, UUID id) {
    return jdbc
      .sql(
        """
        SELECT id, title, content, visibility, version, created_at, updated_at
        FROM journal_entries
        WHERE id = :id AND user_id = :userId
        """
      )
      .param("id", id)
      .param("userId", userId)
      .query(this::map)
      .optional();
  }

  boolean update(UUID userId, UUID id, int version, JournalCommand command) {
    return jdbc
      .sql(
        """
        UPDATE journal_entries
        SET title = :title,
            content = :content,
            version = version + 1
        WHERE id = :id AND user_id = :userId AND version = :version
        """
      )
      .param("id", id)
      .param("userId", userId)
      .param("version", version)
      .param("title", command.title())
      .param("content", command.content())
      .update() == 1;
  }

  boolean delete(UUID userId, UUID id) {
    return jdbc
      .sql(
        """
        DELETE FROM journal_entries
        WHERE id = :id AND user_id = :userId
        """
      )
      .param("id", id)
      .param("userId", userId)
      .update() == 1;
  }

  private JournalEntry map(java.sql.ResultSet rs, int rowNum)
    throws java.sql.SQLException {
    return new JournalEntry(
      rs.getObject("id", UUID.class),
      rs.getString("title"),
      rs.getString("content"),
      rs.getString("visibility"),
      rs.getInt("version"),
      rs.getTimestamp("created_at").toInstant(),
      rs.getTimestamp("updated_at").toInstant()
    );
  }
}
