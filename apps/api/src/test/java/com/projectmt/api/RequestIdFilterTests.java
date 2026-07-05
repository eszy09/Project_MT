package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.projectmt.api.shared.web.RequestIdFilter;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;

class RequestIdFilterTests {

  @Test
  void completionLogContainsOnlyAllowlistedRequestMetadata()
    throws Exception {
    String password = "super-secret-password";
    String token = "secret-bearer-token";
    String journal = "private journal content";
    String measurement = "waist=82";
    var request = new MockHttpServletRequest(
      "POST",
      "/api/v1/journal"
    );
    request.addHeader("X-Request-ID", "safe-request-id");
    request.addHeader("Authorization", "Bearer " + token);
    request.setQueryString("password=" + password);
    request.setContentType("application/json");
    request.setContent(
      ("{\"journal\":\""
        + journal
        + "\",\"measurement\":\""
        + measurement
        + "\"}").getBytes(StandardCharsets.UTF_8)
    );
    var response = new MockHttpServletResponse();
    Logger logger = (Logger) LoggerFactory.getLogger(
      RequestIdFilter.class
    );
    var appender = new ListAppender<ILoggingEvent>();
    appender.start();
    logger.addAppender(appender);

    try {
      new RequestIdFilter().doFilter(
        request,
        response,
        (servletRequest, servletResponse) -> {
          servletRequest.setAttribute(
            HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE,
            "/api/v1/journal"
          );
          ((MockHttpServletResponse) servletResponse).setStatus(201);
        }
      );
    } finally {
      logger.detachAppender(appender);
      appender.stop();
    }

    ILoggingEvent event = appender.list.getLast();
    Map<String, Object> fields = new HashMap<>();
    event
      .getKeyValuePairs()
      .forEach(pair -> fields.put(pair.key, pair.value));

    assertEquals(
      "safe-request-id",
      event.getMDCPropertyMap().get("request.id")
    );
    assertEquals("http_request_completed", fields.get("event.name"));
    assertEquals("POST", fields.get("http.request.method"));
    assertEquals("/api/v1/journal", fields.get("http.route"));
    assertEquals(201, fields.get("http.response.status_code"));
    assertEquals("SUCCESS", fields.get("http.outcome"));

    String loggedData =
      event.getFormattedMessage()
        + event.getMDCPropertyMap()
        + fields;

    assertFalse(loggedData.contains(password));
    assertFalse(loggedData.contains(token));
    assertFalse(loggedData.contains(journal));
    assertFalse(loggedData.contains(measurement));
  }
}
