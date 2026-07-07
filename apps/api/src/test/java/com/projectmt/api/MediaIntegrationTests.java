package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmt.api.support.MediaStorageTestConfiguration;
import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
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
import org.springframework.context.annotation.Import;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(
  {
    PostgresTestConfiguration.class,
    TestSecurityConfiguration.class,
    MediaStorageTestConfiguration.class,
  }
)
class MediaIntegrationTests {

  private static final HttpClient HTTP = HttpClient.newHttpClient();
  private final ObjectMapper json = new ObjectMapper();

  @LocalServerPort
  int port;

  @Autowired
  MediaStorageTestConfiguration.TestMediaStorage storage;

  @Test
  void signedUploadOperationsArePrivateAndOwnerScoped() throws Exception {
    String owner = "media-" + UUID.randomUUID();
    var created = send(
      owner,
      "POST",
      "/upload-operations",
      body("front progress.png", "image/png", 512_000, true)
    );

    assertEquals(201, created.statusCode());
    var node = json.readTree(created.body());
    String id = node.path("asset").path("id").asText();
    assertEquals("UPLOAD_PENDING", node.path("asset").path("status").asText());
    assertEquals(
      "USER_CONTROLLED_DELETE",
      node.path("asset").path("retentionPolicy").asText()
    );
    assertEquals("PUT", node.path("method").asText());
    assertEquals(
      "image/png",
      node.path("headers").path("Content-Type").asText()
    );
    assertTrue(node.path("uploadUrl").asText().contains("/users/"));
    assertFalse(created.body().contains("objectKey"));

    assertEquals(200, send(owner, "GET", "/" + id, null).statusCode());
    assertEquals(
      404,
      send("attacker-" + UUID.randomUUID(), "GET", "/" + id, null)
        .statusCode()
    );
  }

  @Test
  void validationRequiresConsentSupportedTypeAndSize() throws Exception {
    String owner = "media-validation-" + UUID.randomUUID();
    assertEquals(
      400,
      send(
        owner,
        "POST",
        "/upload-operations",
        body("photo.png", "image/png", 128, false)
      ).statusCode()
    );
    assertEquals(
      400,
      send(
        owner,
        "POST",
        "/upload-operations",
        body("script.svg", "image/svg+xml", 128, true)
      ).statusCode()
    );
    assertEquals(
      400,
      send(
        owner,
        "POST",
        "/upload-operations",
        body("large.pdf", "application/pdf", 20_000_000, true)
      ).statusCode()
    );
  }

  @Test
  void deletionRemovesMetadataAndStorageObjectForOwner() throws Exception {
    String owner = "media-delete-" + UUID.randomUUID();
    var created = send(
      owner,
      "POST",
      "/upload-operations",
      body("report.pdf", "application/pdf", 42_000, true)
    );
    String id = json
      .readTree(created.body())
      .path("asset")
      .path("id")
      .asText();

    assertEquals(200, send(owner, "POST", "/" + id + "/complete", null).statusCode());
    assertEquals(204, send(owner, "DELETE", "/" + id, null).statusCode());
    assertEquals(404, send(owner, "GET", "/" + id, null).statusCode());
    assertEquals(1, storage.deletedObjectKeys().size());
    assertTrue(storage.deletedObjectKeys().iterator().next().contains("/media/"));
  }

  private HttpResponse<String> send(
    String token,
    String method,
    String suffix,
    String body
  ) throws Exception {
    var builder = HttpRequest
      .newBuilder(
        URI.create("http://localhost:" + port + "/api/v1/media" + suffix)
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

  private String body(
    String filename,
    String contentType,
    long sizeBytes,
    boolean consentAccepted
  ) {
    return """
      {"filename":%s,"contentType":%s,"sizeBytes":%d,"consentAccepted":%s}
      """.formatted(
        json(filename),
        json(contentType),
        sizeBytes,
        consentAccepted
      );
  }

  private String json(String value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }
}
