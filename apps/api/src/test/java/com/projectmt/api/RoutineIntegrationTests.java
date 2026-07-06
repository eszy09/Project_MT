package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.http.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

@SpringBootTest(webEnvironment=WebEnvironment.RANDOM_PORT)
@Import({PostgresTestConfiguration.class,TestSecurityConfiguration.class})
class RoutineIntegrationTests {
  private static final HttpClient HTTP=HttpClient.newHttpClient();
  private final ObjectMapper json=new ObjectMapper();
  @LocalServerPort int port;

  @Test void crudOrderingOwnershipAndOptimisticLocking() throws Exception {
    String owner="routine-"+UUID.randomUUID();
    var created=send(owner,"POST","",body("Push routine","80"));
    assertEquals(201,created.statusCode());
    var node=json.readTree(created.body());
    String id=node.path("id").asText();
    assertEquals(1,node.path("version").asInt());
    assertEquals("barbell-bench-press",node.path("exercises").get(0).path("exerciseCode").asText());
    assertEquals(2,node.path("exercises").get(0).path("sets").size());

    assertEquals(200,send(owner,"GET","",null).statusCode());
    assertEquals(404,send("attacker-"+UUID.randomUUID(),"GET","/"+id,null).statusCode());

    var updated=send(owner,"PUT","/"+id+"?version=1",body("Updated routine","90"));
    assertEquals(200,updated.statusCode());
    assertEquals(2,json.readTree(updated.body()).path("version").asInt());
    assertEquals(409,send(owner,"PUT","/"+id+"?version=1",body("Stale","95")).statusCode());

    assertEquals(409,send(owner,"DELETE","/"+id,null).statusCode());
    var archived=send(owner,"POST","/"+id+"/archive?version=2",null);
    assertEquals(200,archived.statusCode());
    assertFalse(send(owner,"GET","",null).body().contains(id));
    assertTrue(send(owner,"GET","?includeArchived=true",null).body().contains(id));
    assertEquals(204,send(owner,"DELETE","/"+id,null).statusCode());
    assertEquals(404,send(owner,"GET","/"+id,null).statusCode());
  }

  @Test void validationRejectsEmptyTemplates() throws Exception {
    String invalid=body("Invalid","80").replace(
      "\"sets\":[{\"targetWeightKg\":80,\"targetRepetitions\":8},{\"targetRepetitions\":10}]",
      "\"sets\":[]");
    assertEquals(400,send("validation-"+UUID.randomUUID(),"POST","",invalid).statusCode());
  }

  private HttpResponse<String> send(String token,String method,String suffix,String body)
    throws Exception {
    var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v1/routines"+suffix))
      .header("Authorization","Bearer "+token);
    if(body!=null) builder.header("Content-Type","application/json");
    builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body));
    return HTTP.send(builder.build(),HttpResponse.BodyHandlers.ofString());
  }
  private String body(String name,String weight){return """
    {"name":"%s","description":"Main session","muscleGroup":"CHEST","exercises":[
      {"exerciseCode":"barbell-bench-press","displayName":"Barbell Bench Press",
       "sets":[{"targetWeightKg":%s,"targetRepetitions":8},{"targetRepetitions":10}]},
      {"exerciseCode":"overhead-press","displayName":"Overhead Press",
       "sets":[{"targetWeightKg":40,"targetRepetitions":8}]}
    ]}
    """.formatted(name,weight);}
}
