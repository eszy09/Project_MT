package com.projectmt.api.media;

public interface MediaStorageSigner {
  SignedUploadOperation signUpload(
    String objectKey,
    String contentType,
    long sizeBytes
  );
}
