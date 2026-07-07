package com.projectmt.api.journal;

import java.time.Instant;
import java.util.UUID;

record JournalCommand(String title, String content) {}

record JournalEntry(
  UUID id,
  String title,
  String content,
  String visibility,
  int version,
  Instant createdAt,
  Instant updatedAt
) {}
