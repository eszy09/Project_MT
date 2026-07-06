package com.projectmt.api.workout;

import com.projectmt.api.shared.api.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping(
  path = ApiPaths.V1 + "/workouts",
  produces = MediaType.APPLICATION_JSON_VALUE
)
public class WorkoutController {

  public static final String IDEMPOTENCY_KEY_HEADER =
    "Idempotency-Key";
  public static final String IDEMPOTENCY_REPLAYED_HEADER =
    "Idempotency-Replayed";

  private final WorkoutService workouts;

  public WorkoutController(WorkoutService workouts) {
    this.workouts = workouts;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
    summary = "Save a completed workout atomically",
    description = "Creates the session, ordered exercises, and ordered sets in one transaction."
  )
  @ApiResponses({
    @ApiResponse(responseCode = "201", description = "Workout created."),
    @ApiResponse(
      responseCode = "200",
      description = "An identical idempotent request was replayed."
    ),
    @ApiResponse(
      responseCode = "400",
      ref = "#/components/responses/ValidationProblem"
    ),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "409",
      ref = "#/components/responses/ConflictProblem"
    )
  })
  public ResponseEntity<WorkoutResponse> saveCompletedWorkout(
    @Parameter(
      description = "Stable key used to make completion retries safe.",
      required = true
    )
    @RequestHeader(IDEMPOTENCY_KEY_HEADER)
    @Pattern(
      regexp = "[A-Za-z0-9][A-Za-z0-9._:-]{7,99}",
      message = "must contain 8-100 safe identifier characters"
    )
    String idempotencyKey,

    @Valid @RequestBody WorkoutRequest request
  ) {
    WorkoutSaveResult result = workouts.saveCompletedWorkout(
      idempotencyKey,
      request.toCommand()
    );
    HttpStatus status = result.replayed()
      ? HttpStatus.OK
      : HttpStatus.CREATED;

    return ResponseEntity
      .status(status)
      .header(
        IDEMPOTENCY_REPLAYED_HEADER,
        Boolean.toString(result.replayed())
      )
      .body(WorkoutResponse.from(result.workout()));
  }

  public record WorkoutRequest(
    @NotNull
    Instant startedAt,

    @NotNull
    Instant completedAt,

    @Size(max = 2000)
    String notes,

    @NotEmpty
    @Size(max = 100)
    List<@Valid WorkoutExerciseRequest> exercises
  ) {
    WorkoutCompletionCommand toCommand() {
      return new WorkoutCompletionCommand(
        startedAt,
        completedAt,
        notes,
        exercises
          .stream()
          .map(WorkoutExerciseRequest::toCommand)
          .toList()
      );
    }
  }

  public record WorkoutExerciseRequest(
    @NotBlank
    @Size(max = 100)
    @Pattern(
      regexp = "[a-z0-9][a-z0-9._-]*",
      message = "must be a lowercase canonical identifier"
    )
    String exerciseCode,

    @NotBlank
    @Size(max = 150)
    String displayName,

    @Size(max = 1000)
    String notes,

    @NotEmpty
    @Size(max = 100)
    List<@Valid WorkoutSetRequest> sets
  ) {
    WorkoutExerciseCommand toCommand() {
      return new WorkoutExerciseCommand(
        exerciseCode,
        displayName,
        notes,
        sets.stream().map(WorkoutSetRequest::toCommand).toList()
      );
    }
  }

  public record WorkoutSetRequest(
    @NotNull
    @DecimalMin("0.000")
    @DecimalMax("2000.000")
    BigDecimal weightKg,

    @NotNull
    @Min(1)
    @Max(1000)
    Integer repetitions,

    Instant completedAt,

    @Size(max = 500)
    String notes
  ) {
    WorkoutSetCommand toCommand() {
      return new WorkoutSetCommand(
        weightKg,
        repetitions,
        completedAt,
        notes
      );
    }
  }

  public record WorkoutResponse(
    UUID id,
    String status,
    Instant startedAt,
    Instant completedAt,
    long durationSeconds,
    String notes,
    int exerciseCount,
    int setCount,
    int completedSetCount,
    Instant createdAt
  ) {
    static WorkoutResponse from(SavedWorkout workout) {
      return new WorkoutResponse(
        workout.id(),
        workout.status().name(),
        workout.startedAt(),
        workout.completedAt(),
        workout.durationSeconds(),
        workout.notes(),
        workout.exerciseCount(),
        workout.setCount(),
        workout.completedSetCount(),
        workout.createdAt()
      );
    }
  }
}
