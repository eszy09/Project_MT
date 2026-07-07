package com.projectmt.api.media;

import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "project-mt.media")
class MediaStorageProperties {

  private String bucket;
  private String region;
  private URI endpoint;
  private String accessKey;
  private String secretKey;
  private boolean forcePathStyle = true;
  private long maxFileSizeBytes = 10_485_760;
  private long uploadUrlTtlSeconds = 300;

  String bucket() {
    return bucket;
  }

  void setBucket(String bucket) {
    this.bucket = bucket;
  }

  String region() {
    return region;
  }

  void setRegion(String region) {
    this.region = region;
  }

  URI endpoint() {
    return endpoint;
  }

  void setEndpoint(URI endpoint) {
    this.endpoint = endpoint;
  }

  String accessKey() {
    return accessKey;
  }

  void setAccessKey(String accessKey) {
    this.accessKey = accessKey;
  }

  String secretKey() {
    return secretKey;
  }

  void setSecretKey(String secretKey) {
    this.secretKey = secretKey;
  }

  boolean forcePathStyle() {
    return forcePathStyle;
  }

  void setForcePathStyle(boolean forcePathStyle) {
    this.forcePathStyle = forcePathStyle;
  }

  long maxFileSizeBytes() {
    return maxFileSizeBytes;
  }

  void setMaxFileSizeBytes(long maxFileSizeBytes) {
    this.maxFileSizeBytes = maxFileSizeBytes;
  }

  long uploadUrlTtlSeconds() {
    return uploadUrlTtlSeconds;
  }

  void setUploadUrlTtlSeconds(long uploadUrlTtlSeconds) {
    this.uploadUrlTtlSeconds = uploadUrlTtlSeconds;
  }
}
