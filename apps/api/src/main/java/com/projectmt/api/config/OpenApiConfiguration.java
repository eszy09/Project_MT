package com.projectmt.api.config;

import com.projectmt.api.shared.api.ApiPaths;
import com.projectmt.api.shared.api.ApiProblem;
import com.projectmt.api.shared.web.RequestIdFilter;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.headers.Header;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;

@Configuration(proxyBeanMethods = false)
public class OpenApiConfiguration {

  @Bean
  OpenAPI projectMtOpenApi() {
    Components components = new Components();

    ModelConverters
      .getInstance()
      .readAll(ApiProblem.class)
      .forEach(components::addSchemas);

    components
      .addResponses(
        "ValidationProblem",
        problemResponse("The request failed validation.")
      )
      .addResponses(
        "UnauthenticatedProblem",
        problemResponse("Authentication is required.")
      )
      .addResponses(
        "AccessDeniedProblem",
        problemResponse("The user cannot access this resource.")
      )
      .addResponses(
        "ResourceNotFoundProblem",
        problemResponse("The requested resource was not found.")
      )
      .addResponses(
        "ConflictProblem",
        problemResponse("The request conflicts with current state.")
      )
      .addResponses(
        "InternalProblem",
        problemResponse("An unexpected internal error occurred.")
      );

    return new OpenAPI()
      .info(
        new Info()
          .title("Project_MT API")
          .description("Backend API for Project_MT.")
          .version("v1")
      )
      .components(components);
  }

  @Bean
  GroupedOpenApi versionOneOpenApi() {
    return GroupedOpenApi
      .builder()
      .group("v1")
      .pathsToMatch(ApiPaths.V1, ApiPaths.V1 + "/**")
      .build();
  }

  private ApiResponse problemResponse(String description) {
    io.swagger.v3.oas.models.media.Schema<?> problemSchema =
      new io.swagger.v3.oas.models.media.Schema<>()
        .$ref("#/components/schemas/ApiProblem");

    return new ApiResponse()
      .description(description)
      .addHeaderObject(
        RequestIdFilter.HEADER_NAME,
        new Header()
          .description("Identifier used to correlate the request.")
          .schema(new StringSchema())
      )
      .content(
        new Content().addMediaType(
          MediaType.APPLICATION_PROBLEM_JSON_VALUE,
          new io.swagger.v3.oas.models.media.MediaType()
            .schema(problemSchema)
        )
      );
  }
}
