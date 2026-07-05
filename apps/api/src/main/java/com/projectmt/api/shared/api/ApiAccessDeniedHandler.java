package com.projectmt.api.shared.api;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public final class ApiAccessDeniedHandler
  implements AccessDeniedHandler {

  private final ApiSecurityProblemWriter problemWriter;

  public ApiAccessDeniedHandler(
    ApiSecurityProblemWriter problemWriter
  ) {
    this.problemWriter = problemWriter;
  }

  @Override
  public void handle(
    HttpServletRequest request,
    HttpServletResponse response,
    AccessDeniedException exception
  ) throws IOException, ServletException {
    problemWriter.write(
      request,
      response,
      HttpStatus.FORBIDDEN,
      ApiErrorCode.ACCESS_DENIED,
      "You do not have permission to access this resource."
    );
  }
}
