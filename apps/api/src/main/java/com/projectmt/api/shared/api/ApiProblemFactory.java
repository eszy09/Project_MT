package com.projectmt.api.shared.api;

import com.projectmt.api.shared.web.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public final class ApiProblemFactory {

  public ApiProblem create(
    HttpStatus status,
    ApiErrorCode code,
    String detail,
    HttpServletRequest request
  ) {
    return create(status, code, detail, request, List.of());
  }

  public ApiProblem create(
    HttpStatus status,
    ApiErrorCode code,
    String detail,
    HttpServletRequest request,
    List<ApiFieldError> errors
  ) {
    return new ApiProblem(
      problemType(code),
      status.getReasonPhrase(),
      status.value(),
      detail,
      URI.create(request.getRequestURI()),
      code,
      RequestIdFilter.getRequestId(request),
      errors
    );
  }

  private URI problemType(ApiErrorCode code) {
    String problemName = code
      .name()
      .toLowerCase(Locale.ROOT)
      .replace('_', '-');

    return URI.create("urn:project-mt:problem:" + problemName);
  }
}