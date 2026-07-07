package com.projectmt.api.media;

import com.projectmt.api.shared.api.ApiPaths;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping(
  path = ApiPaths.V1 + "/media",
  produces = MediaType.APPLICATION_JSON_VALUE
)
public class MediaController {

  private final MediaService media;

  public MediaController(MediaService media) {
    this.media = media;
  }

  @PostMapping(
    path = "/upload-operations",
    consumes = MediaType.APPLICATION_JSON_VALUE
  )
  @ResponseStatus(HttpStatus.CREATED)
  public MediaUploadOperationResponse createUploadOperation(
    @Valid @RequestBody MediaUploadOperationRequest request
  ) {
    return MediaUploadOperationResponse.from(
      media.createUploadOperation(request.command())
    );
  }

  @GetMapping
  public List<MediaAssetResponse> list() {
    return media.list().stream().map(MediaAssetResponse::from).toList();
  }

  @GetMapping("/{id}")
  public MediaAssetResponse get(@PathVariable UUID id) {
    return MediaAssetResponse.from(media.get(id));
  }

  @PostMapping("/{id}/complete")
  public MediaAssetResponse complete(@PathVariable UUID id) {
    return MediaAssetResponse.from(media.complete(id));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    media.delete(id);
  }

  public record MediaUploadOperationRequest(
    @NotBlank @Size(max = 255) String filename,
    @NotBlank @Size(max = 100) String contentType,
    @Min(1) @Max(10_485_760) long sizeBytes,
    @NotNull Boolean consentAccepted
  ) {
    MediaUploadCommand command() {
      return new MediaUploadCommand(
        filename,
        contentType,
        sizeBytes,
        Boolean.TRUE.equals(consentAccepted)
      );
    }
  }

  public record MediaUploadOperationResponse(
    MediaAssetResponse asset,
    URI uploadUrl,
    String method,
    Map<String, String> headers,
    Instant expiresAt
  ) {
    static MediaUploadOperationResponse from(MediaUploadOperation value) {
      return new MediaUploadOperationResponse(
        MediaAssetResponse.from(value.asset()),
        value.operation().uploadUrl(),
        value.operation().method(),
        value.operation().headers(),
        value.operation().expiresAt()
      );
    }
  }

  public record MediaAssetResponse(
    UUID id,
    String filename,
    String contentType,
    long sizeBytes,
    String status,
    String retentionPolicy,
    Instant consentAcceptedAt,
    Instant createdAt,
    Instant updatedAt
  ) {
    static MediaAssetResponse from(MediaAsset asset) {
      return new MediaAssetResponse(
        asset.id(),
        asset.originalFilename(),
        asset.contentType(),
        asset.sizeBytes(),
        asset.status(),
        asset.retentionPolicy(),
        asset.consentAcceptedAt(),
        asset.createdAt(),
        asset.updatedAt()
      );
    }
  }
}
