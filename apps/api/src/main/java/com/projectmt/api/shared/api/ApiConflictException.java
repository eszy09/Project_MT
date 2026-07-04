package com.projectmt.api.shared.api;

public final class ApiConflictException extends RuntimeException {

  public ApiConflictException(String message) {
    super(message);
  }
}