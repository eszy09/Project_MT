package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.projectmt.api.shared.api.ApiConflictException;
import com.projectmt.api.support.PostgresTestConfiguration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({
  ApiContractTests.ContractProbeController.class,
  PostgresTestConfiguration.class
})
class ApiContractTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Test
  void apiIsVersionedAndReturnsRequestId() throws Exception {
    var request = HttpRequest
      .newBuilder(uri("/api/v1"))
      .header("X-Request-ID", "contract-test-123")
      .GET()
      .build();

    var response = send(request);

    assertEquals(200, response.statusCode());
    assertEquals(
      "contract-test-123",
      response.headers().firstValue("X-Request-ID").orElseThrow()
    );
    assertTrue(response.body().contains("\"version\":\"v1\""));
  }

  @Test
  void validationErrorsUseStandardProblemContract() throws Exception {
    var request = HttpRequest
      .newBuilder(uri("/api/v1/test/validation"))
      .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
      .POST(HttpRequest.BodyPublishers.ofString("{}"))
      .build();

    var response = send(request);

    assertEquals(400, response.statusCode());
    assertTrue(response.body().contains("\"code\":\"VALIDATION_FAILED\""));
    assertTrue(response.body().contains("\"requestId\""));
    assertTrue(response.body().contains("\"errors\""));
  }

  @Test
  void conflictsUseStandardProblemContract() throws Exception {
    var request = HttpRequest
      .newBuilder(uri("/api/v1/test/conflict"))
      .GET()
      .build();

    var response = send(request);

    assertEquals(409, response.statusCode());
    assertTrue(response.body().contains("\"code\":\"CONFLICT\""));
  }

  @Test
  void internalErrorsDoNotExposeSensitiveDetails() throws Exception {
    var request = HttpRequest
      .newBuilder(uri("/api/v1/test/internal"))
      .GET()
      .build();

    var response = send(request);

    assertEquals(500, response.statusCode());
    assertTrue(response.body().contains("\"code\":\"INTERNAL_ERROR\""));
    assertFalse(response.body().contains("sensitive-database-detail"));
  }

  @Test
  void openApiContainsVersionedApiAndProblemSchema() throws Exception {
    var request = HttpRequest
      .newBuilder(uri("/v3/api-docs"))
      .GET()
      .build();

    var response = send(request);

    assertEquals(200, response.statusCode());
    assertTrue(response.body().contains("/api/v1"));
    assertTrue(response.body().contains("ApiProblem"));
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

  @RestController
  static final class ContractProbeController {

    @PostMapping("/api/v1/test/validation")
    void validate(@Valid @RequestBody ProbeRequest request) {}

    @GetMapping("/api/v1/test/conflict")
    void conflict() {
      throw new ApiConflictException(
        "The requested operation conflicts with current state."
      );
    }

    @GetMapping("/api/v1/test/internal")
    void internalFailure() {
      throw new IllegalStateException("sensitive-database-detail");
    }
  }

  record ProbeRequest(@NotBlank String name) {}
}