package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({ PostgresTestConfiguration.class, TestSecurityConfiguration.class })
class JournalIntegrationTests {

  private static final HttpClient HTTP = HttpClient.newHttpClient();
  private final ObjectMapper json = new ObjectMapper();

  @LocalServerPort
  int port;

  @Test
  void privateCrudEnforcesOwnershipAndOptimisticLocking() throws Exception {
    String owner = "journal-" + UUID.randomUUID();
    var created = send(owner, "POST", "", body("Day 1", "Private notes"));

    assertEquals(201, created.statusCode());
    var createdJson = json.readTree(created.body());
    String id = createdJson.path("id").asText();
    assertEquals("PRIVATE", createdJson.path("visibility").asText());
    assertEquals(1, createdJson.path("version").asInt());

    assertEquals(200, send(owner, "GET", "", null).statusCode());
    assertEquals(
      404,
      send("attacker-" + UUID.randomUUID(), "GET", "/" + id, null)
        .statusCode()
    );

    var updated = send(
      owner,
      "PUT",
      "/" + id + "?version=1",
      body("Day 1 updated", "Still private")
    );
    assertEquals(200, updated.statusCode());
    assertEquals(2, json.readTree(updated.body()).path("version").asInt());
    assertEquals(
      409,
      send(owner, "PUT", "/" + id + "?version=1", body("Stale", "Nope"))
        .statusCode()
    );

    assertEquals(204, send(owner, "DELETE", "/" + id, null).statusCode());
    assertEquals(404, send(owner, "GET", "/" + id, null).statusCode());
  }

  @Test
  void storedScriptMarkupIsNeutralizedAndNoPublicPostingExists()
    throws Exception {
    String owner = "journal-xss-" + UUID.randomUUID();
    var response = send(
      owner,
      "POST",
      "",
      body("Reflection", "<script>alert('x')</script>")
    );

    assertEquals(201, response.statusCode());
    assertFalse(response.body().contains("<script>"));
    assertTrue(response.body().contains("&lt;script&gt;"));
    assertFalse(response.body().contains("public"));
    assertTrue(response.body().contains("\"visibility\":\"PRIVATE\""));
  }

  @Test
  void validationRejectsBlankContent() throws Exception {
    assertEquals(
      400,
      send(
        "journal-validation-" + UUID.randomUUID(),
        "POST",
        "",
        body("   ", "   ")
      ).statusCode()
    );
  }

  private HttpResponse<String> send(
    String token,
    String method,
    String suffix,
    String body
  ) throws Exception {
    var builder = HttpRequest
      .newBuilder(
        URI.create("http://localhost:" + port + "/api/v1/journal" + suffix)
      )
      .header("Authorization", "Bearer " + token);
    if (body != null) builder.header("Content-Type", "application/json");
    builder.method(
      method,
      body == null
        ? HttpRequest.BodyPublishers.noBody()
        : HttpRequest.BodyPublishers.ofString(body)
    );
    return HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
  }

  private String body(String title, String content) {
    return """
      {"title":%s,"content":%s}
      """.formatted(json(title), json(content));
  }

  private String json(String value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }
}
