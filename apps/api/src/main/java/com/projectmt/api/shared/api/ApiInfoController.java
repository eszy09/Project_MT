package com.projectmt.api.shared.api;

import com.projectmt.api.shared.web.RequestIdFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
  path = ApiPaths.V1,
  produces = MediaType.APPLICATION_JSON_VALUE
)
@Tag(name = "API information")
public final class ApiInfoController {

  @GetMapping
  @Operation(
    summary = "Get API information",
    description = "Confirms the active Project_MT API version."
  )
  @ApiResponse(
    responseCode = "200",
    description = "API information returned successfully.",
    headers = @Header(
      name = RequestIdFilter.HEADER_NAME,
      description = "Identifier used to correlate the request."
    ),
    content = @Content(
      schema = @Schema(implementation = ApiInfoResponse.class)
    )
  )
  public ApiInfoResponse getApiInfo() {
    return new ApiInfoResponse("Project_MT API", "v1");
  }

  @Schema(name = "ApiInfoResponse")
  public record ApiInfoResponse(
    String name,
    String version
  ) {}
}