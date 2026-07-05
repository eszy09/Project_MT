package com.projectmt.api.shared.api;

public final class ApiResourceNotFoundException
  extends RuntimeException {

  public ApiResourceNotFoundException() {
    super("The requested resource was not found.");
  }
}
