package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.logging.LogLevel;
import org.springframework.boot.logging.LoggingSystem;
import org.springframework.context.annotation.Import;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({
  PostgresTestConfiguration.class,
  TestSecurityConfiguration.class
})
class RequestObservabilityIntegrationTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Autowired
  private MeterRegistry meterRegistry;

  @Test
  void sensitiveFrameworkLoggersRemainSafeInDebugMode() {
    LoggingSystem loggingSystem = LoggingSystem.get(
      getClass().getClassLoader()
    );

    assertEquals(
      LogLevel.INFO,
      loggingSystem
        .getLoggerConfiguration(
          "org.springframework.web.servlet.mvc.method.annotation.RequestResponseBodyMethodProcessor"
        )
        .getEffectiveLevel()
    );
    assertEquals(
      LogLevel.INFO,
      loggingSystem
        .getLoggerConfiguration(
          "org.springframework.jdbc.core.JdbcTemplate"
        )
        .getEffectiveLevel()
    );
  }

  @Test
  void everyRequestReceivesOrPropagatesARequestId()
    throws Exception {
    var suppliedResponse = send(
      HttpRequest
        .newBuilder(uri("/actuator/health"))
        .header("X-Request-ID", "frontend-correlation-123")
        .GET()
        .build()
    );

    assertEquals(
      "frontend-correlation-123",
      suppliedResponse
        .headers()
        .firstValue("X-Request-ID")
        .orElseThrow()
    );

    var unsafeResponse = send(
      HttpRequest
        .newBuilder(uri("/actuator/health"))
        .header("X-Request-ID", "unsafe request id with spaces")
        .GET()
        .build()
    );
    String generatedRequestId = unsafeResponse
      .headers()
      .firstValue("X-Request-ID")
      .orElseThrow();

    assertNotEquals(
      "unsafe request id with spaces",
      generatedRequestId
    );
    assertEquals(
      generatedRequestId,
      UUID.fromString(generatedRequestId).toString()
    );
  }

  @Test
  void httpLatencyAndErrorMetricsAreRecorded() throws Exception {
    send(
      HttpRequest.newBuilder(uri("/actuator/health")).GET().build()
    );
    send(
      HttpRequest
        .newBuilder(uri("/api/v1/not-a-route"))
        .header(
          "Authorization",
          "Bearer metrics-" + UUID.randomUUID()
        )
        .GET()
        .build()
    );

    var timers = meterRegistry
      .find("http.server.requests")
      .timers();

    assertTrue(timers.stream().mapToLong(Timer::count).sum() >= 2);
    assertTrue(
      timers
        .stream()
        .anyMatch(timer ->
          "404".equals(timer.getId().getTag("status"))
        )
    );
    assertTrue(
      timers
        .stream()
        .mapToDouble(timer ->
          timer.totalTime(java.util.concurrent.TimeUnit.NANOSECONDS)
        )
        .sum() > 0
    );
  }

  @Test
  void prometheusEndpointIsExposedButAuthenticated()
    throws Exception {
    var unauthenticated = send(
      HttpRequest
        .newBuilder(uri("/actuator/prometheus"))
        .GET()
        .build()
    );
    assertEquals(401, unauthenticated.statusCode());
    assertTrue(
      unauthenticated.headers().firstValue("X-Request-ID").isPresent()
    );

    var authenticated = send(
      HttpRequest
        .newBuilder(uri("/actuator/prometheus"))
        .header(
          "Authorization",
          "Bearer prometheus-" + UUID.randomUUID()
        )
        .GET()
        .build()
    );
    assertEquals(200, authenticated.statusCode());
    assertTrue(
      authenticated
        .body()
        .contains("http_server_requests_seconds_count")
    );
  }

  private HttpResponse<String> send(HttpRequest request)
    throws Exception {
    return HTTP_CLIENT.send(
      request,
      HttpResponse.BodyHandlers.ofString()
    );
  }

  private URI uri(String path) {
    return URI.create("http://localhost:" + port + path);
  }
}
