package com.projectmt.api.journal;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiConflictException;
import com.projectmt.api.shared.api.ApiResourceNotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class JournalService {

  private final CurrentUserService users;
  private final JournalRepository journals;

  JournalService(CurrentUserService users, JournalRepository journals) {
    this.users = users;
    this.journals = journals;
  }

  @Transactional
  JournalEntry create(JournalCommand command) {
    UUID userId = users.requireCurrentUser().id();
    JournalCommand normalized = normalize(command);
    UUID id = journals.insert(userId, normalized);
    return journals.find(userId, id).orElseThrow();
  }

  @Transactional(readOnly = true)
  List<JournalEntry> list() {
    return journals.list(users.requireCurrentUser().id());
  }

  @Transactional(readOnly = true)
  JournalEntry get(UUID id) {
    return journals
      .find(users.requireCurrentUser().id(), id)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  @Transactional
  JournalEntry update(UUID id, int version, JournalCommand command) {
    UUID userId = users.requireCurrentUser().id();
    ensureExists(userId, id);
    if (!journals.update(userId, id, version, normalize(command))) {
      throw new ApiConflictException(
        "The journal entry was modified by another request."
      );
    }
    return journals.find(userId, id).orElseThrow();
  }

  @Transactional
  void delete(UUID id) {
    UUID userId = users.requireCurrentUser().id();
    if (!journals.delete(userId, id)) {
      throw new ApiResourceNotFoundException();
    }
  }

  private void ensureExists(UUID userId, UUID id) {
    if (journals.find(userId, id).isEmpty()) {
      throw new ApiResourceNotFoundException();
    }
  }

  private JournalCommand normalize(JournalCommand command) {
    return new JournalCommand(
      neutralizeHtml(text(command.title())),
      neutralizeHtml(text(command.content()))
    );
  }

  private String text(String value) {
    return value == null ? "" : value.strip();
  }

  private String neutralizeHtml(String value) {
    return value
      .replace("&", "&amp;")
      .replace("<", "&lt;")
      .replace(">", "&gt;")
      .replace("\"", "&quot;")
      .replace("'", "&#39;");
  }
}
