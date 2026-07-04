package com.projectmt.api.shared.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.net.URI;
import java.util.List;

@Schema(
  name = "ApiProblem",
  description = "Standard error response returned by the Project_MT API."
)
public record ApiProblem(
  URI type,
  String title,
  int status,
  String detail,
  URI instance,
  ApiErrorCode code,
  String requestId,
  List<ApiFieldError> errors
) {
  public ApiProblem {
    errors = errors == null ? List.of() : List.copyOf(errors);
  }
}