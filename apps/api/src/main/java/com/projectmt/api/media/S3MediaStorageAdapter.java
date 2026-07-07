package com.projectmt.api.media;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Component
class S3MediaStorageAdapter
  implements MediaStorageSigner, MediaObjectStorage {

  private final MediaStorageProperties properties;
  private final S3Client client;
  private final S3Presigner presigner;

  S3MediaStorageAdapter(MediaStorageProperties properties) {
    this.properties = properties;
    var credentials = StaticCredentialsProvider.create(
      AwsBasicCredentials.create(properties.accessKey(), properties.secretKey())
    );
    var region = Region.of(properties.region());
    var s3Configuration = S3Configuration
      .builder()
      .pathStyleAccessEnabled(properties.forcePathStyle())
      .build();
    this.client = S3Client
      .builder()
      .region(region)
      .endpointOverride(properties.endpoint())
      .serviceConfiguration(s3Configuration)
      .credentialsProvider(credentials)
      .build();
    this.presigner = S3Presigner
      .builder()
      .region(region)
      .endpointOverride(properties.endpoint())
      .serviceConfiguration(s3Configuration)
      .credentialsProvider(credentials)
      .build();
  }

  @Override
  public SignedUploadOperation signUpload(
    String objectKey,
    String contentType,
    long sizeBytes
  ) {
    PutObjectRequest putObject = PutObjectRequest
      .builder()
      .bucket(properties.bucket())
      .key(objectKey)
      .contentType(contentType)
      .contentLength(sizeBytes)
      .build();
    PresignedPutObjectRequest signed = presigner.presignPutObject(
      PutObjectPresignRequest
        .builder()
        .signatureDuration(Duration.ofSeconds(properties.uploadUrlTtlSeconds()))
        .putObjectRequest(putObject)
        .build()
    );

    return new SignedUploadOperation(
      java.net.URI.create(signed.url().toString()),
      "PUT",
      Map.of("Content-Type", contentType),
      Instant.now().plusSeconds(properties.uploadUrlTtlSeconds())
    );
  }

  @Override
  public void deleteObject(String objectKey) {
    client.deleteObject(
      DeleteObjectRequest
        .builder()
        .bucket(properties.bucket())
        .key(objectKey)
        .build()
    );
  }
}
