package com.projectmt.api.media;

import java.time.Instant;
import java.util.UUID;

record MediaUploadCommand(
  String filename,
  String contentType,
  long sizeBytes,
  boolean consentAccepted
) {}

record MediaAsset(
  UUID id,
  String objectKey,
  String originalFilename,
  String contentType,
  long sizeBytes,
  String status,
  Instant consentAcceptedAt,
  String retentionPolicy,
  Instant createdAt,
  Instant updatedAt
) {}
