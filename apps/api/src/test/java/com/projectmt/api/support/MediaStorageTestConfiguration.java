package com.projectmt.api.support;

import com.projectmt.api.media.MediaObjectStorage;
import com.projectmt.api.media.MediaStorageSigner;
import com.projectmt.api.media.SignedUploadOperation;
import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration(proxyBeanMethods = false)
public class MediaStorageTestConfiguration {

  @Bean
  @Primary
  TestMediaStorage testMediaStorage() {
    return new TestMediaStorage();
  }

  public static final class TestMediaStorage
    implements MediaStorageSigner, MediaObjectStorage {

    private final Set<String> deletedObjectKeys = new LinkedHashSet<>();

    @Override
    public SignedUploadOperation signUpload(
      String objectKey,
      String contentType,
      long sizeBytes
    ) {
      return new SignedUploadOperation(
        URI.create("https://storage.project-mt.test/" + objectKey),
        "PUT",
        Map.of("Content-Type", contentType),
        Instant.now().plusSeconds(300)
      );
    }

    @Override
    public void deleteObject(String objectKey) {
      deletedObjectKeys.add(objectKey);
    }

    public Set<String> deletedObjectKeys() {
      return Set.copyOf(deletedObjectKeys);
    }
  }
}
