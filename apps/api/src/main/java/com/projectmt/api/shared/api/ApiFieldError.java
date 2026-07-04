package com.projectmt.api.shared.api;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A validation failure associated with one request field.")
public record ApiFieldError(
  String field,
  String code,
  String message
) {}