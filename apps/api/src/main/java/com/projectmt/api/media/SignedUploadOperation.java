package com.projectmt.api.media;

import java.net.URI;
import java.time.Instant;
import java.util.Map;

public record SignedUploadOperation(
  URI uploadUrl,
  String method,
  Map<String, String> headers,
  Instant expiresAt
) {}
