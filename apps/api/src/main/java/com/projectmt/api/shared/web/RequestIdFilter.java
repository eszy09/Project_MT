package com.projectmt.api.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public final class RequestIdFilter extends OncePerRequestFilter {

  private static final Logger LOGGER =
    LoggerFactory.getLogger(RequestIdFilter.class);

  public static final String HEADER_NAME = "X-Request-ID";
  public static final String ATTRIBUTE_NAME =
    RequestIdFilter.class.getName() + ".requestId";

  private static final Pattern SAFE_REQUEST_ID =
    Pattern.compile("[A-Za-z0-9._-]{1,128}");

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String requestId = resolveRequestId(request);
    long startedAt = System.nanoTime();
    boolean failedBeforeResponse = false;

    request.setAttribute(ATTRIBUTE_NAME, requestId);
    response.setHeader(HEADER_NAME, requestId);

    try (MDC.MDCCloseable ignored = MDC.putCloseable(
      "request.id",
      requestId
    )) {
      try {
        filterChain.doFilter(request, response);
      } catch (
        IOException
        | ServletException
        | RuntimeException exception
      ) {
        failedBeforeResponse = true;
        throw exception;
      } finally {
        logCompletion(
          request,
          response,
          startedAt,
          failedBeforeResponse
        );
      }
    }
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

  private void logCompletion(
    HttpServletRequest request,
    HttpServletResponse response,
    long startedAt,
    boolean failedBeforeResponse
  ) {
    int status = failedBeforeResponse
      ? HttpServletResponse.SC_INTERNAL_SERVER_ERROR
      : response.getStatus();
    long durationMs = Math.max(
      0,
      (System.nanoTime() - startedAt) / 1_000_000
    );
    Object routeAttribute = request.getAttribute(
      HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE
    );
    String route = routeAttribute instanceof String pattern
      ? pattern
      : "UNMATCHED";

    var event = status >= 500
      ? LOGGER.atError()
      : status >= 400
        ? LOGGER.atWarn()
        : LOGGER.atInfo();

    event
      .addKeyValue("event.name", "http_request_completed")
      .addKeyValue("http.request.method", request.getMethod())
      .addKeyValue("http.route", route)
      .addKeyValue("http.response.status_code", status)
      .addKeyValue("http.outcome", outcome(status))
      .addKeyValue("http.duration_ms", durationMs)
      .log("HTTP request completed");
  }

  private String outcome(int status) {
    if (status >= 500) {
      return "SERVER_ERROR";
    }
    if (status >= 400) {
      return "CLIENT_ERROR";
    }
    if (status >= 300) {
      return "REDIRECTION";
    }
    if (status >= 200) {
      return "SUCCESS";
    }

    return "INFORMATIONAL";
  }
}
