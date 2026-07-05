package com.projectmt.api.shared.web;

import com.projectmt.api.shared.api.ApiPaths;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public final class RequestIdFilter extends OncePerRequestFilter {

  public static final String HEADER_NAME = "X-Request-ID";
  public static final String ATTRIBUTE_NAME =
    RequestIdFilter.class.getName() + ".requestId";

  private static final Pattern SAFE_REQUEST_ID =
    Pattern.compile("[A-Za-z0-9._-]{1,128}");

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();

    return !path.equals(ApiPaths.V1)
      && !path.startsWith(ApiPaths.V1 + "/");
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String requestId = resolveRequestId(request);

    request.setAttribute(ATTRIBUTE_NAME, requestId);
    response.setHeader(HEADER_NAME, requestId);

    filterChain.doFilter(request, response);
  }

  public static String getRequestId(HttpServletRequest request) {
    Object requestId = request.getAttribute(ATTRIBUTE_NAME);

    return requestId instanceof String value ? value : "unknown";
  }

  private String resolveRequestId(HttpServletRequest request) {
    String suppliedRequestId = request.getHeader(HEADER_NAME);

    if (
      suppliedRequestId != null
      && SAFE_REQUEST_ID.matcher(suppliedRequestId).matches()
    ) {
      return suppliedRequestId;
    }

    return UUID.randomUUID().toString();
  }
}
