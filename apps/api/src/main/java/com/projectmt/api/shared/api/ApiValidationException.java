package com.projectmt.api.shared.api;

import java.util.List;

public final class ApiValidationException extends RuntimeException {

  private final List<ApiFieldError> errors;

  public ApiValidationException(
    String message,
    List<ApiFieldError> errors
  ) {
    super(message);
    this.errors = List.copyOf(errors);
  }

  public List<ApiFieldError> errors() {
    return errors;
  }
}
