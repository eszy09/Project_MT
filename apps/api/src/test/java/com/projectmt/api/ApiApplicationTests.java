package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class ApiApplicationTests {

  @LocalServerPort
  private int port;

  @Test
  void applicationStartsAndReportsHealthy() throws Exception {
    var request = HttpRequest.newBuilder()
      .uri(URI.create("http://localhost:" + port + "/actuator/health"))
      .GET()
      .build();

    var response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());

    assertEquals(200, response.statusCode());
    assertTrue(response.body().contains("\"status\":\"UP\""));
  }
}