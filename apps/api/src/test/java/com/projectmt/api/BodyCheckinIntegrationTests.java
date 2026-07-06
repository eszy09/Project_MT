package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.http.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({PostgresTestConfiguration.class, TestSecurityConfiguration.class})
class BodyCheckinIntegrationTests {

  private static final HttpClient HTTP = HttpClient.newHttpClient();
  private final ObjectMapper json = new ObjectMapper();

  @LocalServerPort
  int port;

  @Autowired
  JdbcTemplate jdbc;

  @Test
  void persistsRawUnitsAndTraceableDerivedParameters() throws Exception {
    String owner = token("checkin-owner");
    var response = send(owner, "POST", "", """
      {
        "measuredAt":"2026-07-01T08:30:00Z",
        "weight":{"value":176.4,"unit":"lb"},
        "bodyFatPercent":18.2,
        "chest":{"value":40.2,"unit":"in"},
        "waist":{"value":86,"unit":"cm"},
        "notes":"Morning check-in"
      }
      """);

    assertEquals(201, response.statusCode());
    JsonNode body = json.readTree(response.body());
    UUID id = UUID.fromString(body.path("id").asText());
    assertEquals("lb", body.path("weight").path("unit").asText());
    assertEquals(176.4, body.path("weight").path("value").asDouble(), 0.001);
    assertTrue(body.path("hips").isNull());
    assertEquals("body-proportions-v1",
      body.path("derivedParameters").path("algorithmVersion").asText());
    assertTrue(body.path("derivedParameters").path("torsoScale").isNumber());
    assertTrue(body.path("derivedParameters").path("hipScale").isNull());

    assertEquals("lb", jdbc.queryForObject(
      "SELECT weight_unit FROM body_checkins WHERE id=?", String.class, id));
    assertEquals(id, jdbc.queryForObject(
      "SELECT source_checkin_id FROM derived_body_parameters WHERE source_checkin_id=?",
      UUID.class, id));
    assertEquals("body-proportions-v1", jdbc.queryForObject(
      "SELECT algorithm_version FROM derived_body_parameters WHERE source_checkin_id=?",
      String.class, id));
  }

  @Test
  void acceptsPartialCheckinsWithoutNullCalculationFailures() throws Exception {
    String owner = token("partial-owner");
    var created = send(owner, "POST", "", """
      {"measuredAt":"2026-07-01T08:30:00Z","waist":{"value":34,"unit":"in"}}
      """);

    assertEquals(201, created.statusCode());
    JsonNode body = json.readTree(created.body());
    assertTrue(body.path("weight").isNull());
    assertTrue(body.path("derivedParameters").path("torsoScale").isNull());
    assertTrue(body.path("derivedParameters").path("waistScale").isNumber());
    assertEquals(200, send(owner, "GET", "", null).statusCode());
  }

  @Test
  void crossUserAndMissingCheckinsHaveTheSameNotFoundContract() throws Exception {
    String owner = token("private-owner");
    String attacker = token("private-attacker");
    var created = send(owner, "POST", "", """
      {"measuredAt":"2026-07-01T08:30:00Z","weight":{"value":80,"unit":"kg"}}
      """);
    UUID id = UUID.fromString(json.readTree(created.body()).path("id").asText());

    var crossUser = send(attacker, "GET", "/" + id, null);
    var missing = send(attacker, "GET", "/" + UUID.randomUUID(), null);

    assertEquals(404, crossUser.statusCode());
    assertEquals(404, missing.statusCode());
    assertTrue(crossUser.body().contains("\"code\":\"RESOURCE_NOT_FOUND\""));
    assertTrue(missing.body().contains("\"code\":\"RESOURCE_NOT_FOUND\""));
    assertFalse(send(attacker, "GET", "", null).body().contains(id.toString()));
  }

  @Test
  void rejectsMissingAndImplausibleMeasurements() throws Exception {
    var empty = send(token("empty"), "POST", "", """
      {"measuredAt":"2026-07-01T08:30:00Z","notes":"No values"}
      """);
    var implausible = send(token("range"), "POST", "", """
      {"measuredAt":"2026-07-01T08:30:00Z","waist":{"value":5,"unit":"cm"}}
      """);
    var wrongUnit = send(token("unit"), "POST", "", """
      {"measuredAt":"2026-07-01T08:30:00Z","weight":{"value":80,"unit":"cm"}}
      """);

    assertEquals(400, empty.statusCode());
    assertEquals(400, implausible.statusCode());
    assertEquals(400, wrongUnit.statusCode());
    assertTrue(implausible.body().contains("OUT_OF_RANGE"));
  }

  private HttpResponse<String> send(String token, String method, String suffix, String body)
    throws Exception {
    var request = HttpRequest.newBuilder(
      URI.create("http://localhost:" + port + "/api/v1/checkins" + suffix))
      .header("Authorization", "Bearer " + token)
      .header("X-Request-ID", "checkin-test");
    if (body != null) request.header("Content-Type", "application/json");
    request.method(method, body == null
      ? HttpRequest.BodyPublishers.noBody()
      : HttpRequest.BodyPublishers.ofString(body));
    return HTTP.send(request.build(), HttpResponse.BodyHandlers.ofString());
  }

  private String token(String prefix) {
    return prefix + "-" + UUID.randomUUID();
  }
}
