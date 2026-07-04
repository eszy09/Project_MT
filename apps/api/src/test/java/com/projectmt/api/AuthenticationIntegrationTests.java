package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({
  AuthenticationIntegrationTests.AuthenticationProbeController.class,
  PostgresTestConfiguration.class,
  TestSecurityConfiguration.class
})
class AuthenticationIntegrationTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Test
  void protectedEndpointRequiresAccessToken() throws Exception {
    var response = send(
      HttpRequest
        .newBuilder(uri("/api/v1/test/auth/current-user"))
        .GET()
        .build()
    );

    assertEquals(401, response.statusCode());
  }

  @Test
  void oidcIdentityMapsToStableInternalUserId() throws Exception {
    String firstUserId = currentUserId("stable-test-user");
    String repeatedUserId = currentUserId("stable-test-user");
    String otherUserId = currentUserId("different-test-user");

    assertEquals(firstUserId, repeatedUserId);
    assertNotEquals(firstUserId, otherUserId);
  }

  @Test
  void expiredAccessTokenIsRejected() throws Exception {
    var response = authenticatedRequest("expired-test-token");

    assertEquals(401, response.statusCode());
  }

  @Test
  void authenticatedRequestsDoNotCreateServerSessions()
    throws Exception {
    var response = authenticatedRequest("stateless-test-user");

    assertEquals(200, response.statusCode());
    assertFalse(response.headers().firstValue("Set-Cookie").isPresent());
  }

  private String currentUserId(String token) throws Exception {
    var response = authenticatedRequest(token);

    assertEquals(200, response.statusCode());
    return response.body();
  }

  private HttpResponse<String> authenticatedRequest(String token)
    throws Exception {
    var request = HttpRequest
      .newBuilder(uri("/api/v1/test/auth/current-user"))
      .header("Authorization", "Bearer " + token)
      .GET()
      .build();

    return send(request);
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
  static final class AuthenticationProbeController {

    private final CurrentUserService currentUsers;

    AuthenticationProbeController(CurrentUserService currentUsers) {
      this.currentUsers = currentUsers;
    }

    @GetMapping("/api/v1/test/auth/current-user")
    Map<String, UUID> currentUser() {
      return Map.of(
        "userId",
        currentUsers.requireCurrentUser().id()
      );
    }
  }
}
