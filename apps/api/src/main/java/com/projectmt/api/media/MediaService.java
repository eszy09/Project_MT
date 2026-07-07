package com.projectmt.api.media;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiFieldError;
import com.projectmt.api.shared.api.ApiResourceNotFoundException;
import com.projectmt.api.shared.api.ApiValidationException;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class MediaService {

  private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  );

  private final CurrentUserService users;
  private final MediaRepository media;
  private final MediaStorageProperties properties;
  private final MediaStorageSigner signer;
  private final MediaObjectStorage storage;

  MediaService(
    CurrentUserService users,
    MediaRepository media,
    MediaStorageProperties properties,
    MediaStorageSigner signer,
    MediaObjectStorage storage
  ) {
    this.users = users;
    this.media = media;
    this.properties = properties;
    this.signer = signer;
    this.storage = storage;
  }

  @Transactional
  MediaUploadOperation createUploadOperation(MediaUploadCommand command) {
    UUID userId = users.requireCurrentUser().id();
    MediaUploadCommand normalized = normalize(command);
    validate(normalized);
    String objectKey = objectKey(userId, normalized.filename());
    UUID id = media.insert(userId, objectKey, normalized, Instant.now());
    MediaAsset asset = media.find(userId, id).orElseThrow();
    SignedUploadOperation operation = signer.signUpload(
      objectKey,
      normalized.contentType(),
      normalized.sizeBytes()
    );
    return new MediaUploadOperation(asset, operation);
  }

  @Transactional(readOnly = true)
  List<MediaAsset> list() {
    return media.list(users.requireCurrentUser().id());
  }

  @Transactional(readOnly = true)
  MediaAsset get(UUID id) {
    return media
      .find(users.requireCurrentUser().id(), id)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  @Transactional
  MediaAsset complete(UUID id) {
    UUID userId = users.requireCurrentUser().id();
    if (!media.markAvailable(userId, id)) {
      throw new ApiResourceNotFoundException();
    }
    return media.find(userId, id).orElseThrow();
  }

  @Transactional
  void delete(UUID id) {
    UUID userId = users.requireCurrentUser().id();
    MediaAsset asset = media
      .find(userId, id)
      .orElseThrow(ApiResourceNotFoundException::new);
    storage.deleteObject(asset.objectKey());
    media.markDeleted(userId, id);
  }

  private MediaUploadCommand normalize(MediaUploadCommand command) {
    return new MediaUploadCommand(
      sanitizeFilename(command.filename()),
      command.contentType() == null
        ? ""
        : command.contentType().strip().toLowerCase(Locale.ROOT),
      command.sizeBytes(),
      command.consentAccepted()
    );
  }

  private void validate(MediaUploadCommand command) {
    if (!command.consentAccepted()) {
      throw validation(
        "consentAccepted",
        "Upload consent must be accepted before creating an upload."
      );
    }
    if (!ALLOWED_CONTENT_TYPES.contains(command.contentType())) {
      throw validation(
        "contentType",
        "Only JPEG, PNG, WebP, and PDF files are supported."
      );
    }
    if (
      command.sizeBytes() < 1 ||
      command.sizeBytes() > properties.maxFileSizeBytes()
    ) {
      throw validation(
        "sizeBytes",
        "File size must be between 1 byte and the configured maximum."
      );
    }
  }

  private ApiValidationException validation(String field, String message) {
    return new ApiValidationException(
      "The media upload request is invalid.",
      List.of(new ApiFieldError(field, "INVALID", message))
    );
  }

  private String objectKey(UUID userId, String filename) {
    return "users/%s/media/%s/%s".formatted(
      userId,
      UUID.randomUUID(),
      filename
    );
  }

  private String sanitizeFilename(String value) {
    String normalized = value == null ? "" : value.strip();
    if (normalized.isEmpty()) return "upload";
    String sanitized = normalized.replaceAll("[^A-Za-z0-9._-]", "_");
    return sanitized.length() > 120 ? sanitized.substring(0, 120) : sanitized;
  }
}

record MediaUploadOperation(
  MediaAsset asset,
  SignedUploadOperation operation
) {}
