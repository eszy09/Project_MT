package com.projectmt.api.workout;

import com.projectmt.api.shared.api.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
  path = ApiPaths.V1 + "/workouts",
  produces = MediaType.APPLICATION_JSON_VALUE
)
public class WorkoutHistoryController {

  private final WorkoutService workouts;

  public WorkoutHistoryController(WorkoutService workouts) {
    this.workouts = workouts;
  }

  @GetMapping
  @Operation(summary = "List the current user's completed workouts")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "History returned."),
    @ApiResponse(
      responseCode = "400",
      ref = "#/components/responses/ValidationProblem"
    ),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    )
  })
  public WorkoutHistoryPageResponse history(
    @RequestParam(defaultValue = "20")
    @Min(1)
    @Max(50)
    int limit,

    @RequestParam(required = false)
    @Size(max = 500)
    String cursor,

    @RequestParam(required = false)
    @Size(max = 100)
    @Pattern(regexp = "[a-z0-9][a-z0-9._-]*")
    String exerciseCode,

    @RequestParam(required = false)
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    Instant from,

    @RequestParam(required = false)
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    Instant to
  ) {
    return WorkoutHistoryPageResponse.from(
      workouts.history(limit, cursor, exerciseCode, from, to)
    );
  }

  @GetMapping("/{workoutId}")
  @Operation(summary = "Get one completed workout with ordered details")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Workout returned."),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "404",
      ref = "#/components/responses/ResourceNotFoundProblem"
    )
  })
  public WorkoutDetailResponse detail(
    @PathVariable UUID workoutId
  ) {
    return WorkoutDetailResponse.from(workouts.detail(workoutId));
  }

  @GetMapping("/previous/{exerciseCode}")
  @Operation(
    summary = "Get the latest completed performance for an exercise"
  )
  @ApiResponses({
    @ApiResponse(
      responseCode = "200",
      description = "Previous performance returned."
    ),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "404",
      ref = "#/components/responses/ResourceNotFoundProblem"
    )
  })
  public PreviousPerformanceResponse previousPerformance(
    @PathVariable
    @Size(max = 100)
    @Pattern(regexp = "[a-z0-9][a-z0-9._-]*")
    String exerciseCode
  ) {
    return PreviousPerformanceResponse.from(
      workouts.previousPerformance(exerciseCode)
    );
  }

  public record WorkoutHistoryPageResponse(
    List<WorkoutHistoryItemResponse> items,
    String nextCursor
  ) {
    static WorkoutHistoryPageResponse from(WorkoutHistoryPage page) {
      return new WorkoutHistoryPageResponse(
        page
          .items()
          .stream()
          .map(WorkoutHistoryItemResponse::from)
          .toList(),
        page.nextCursor()
      );
    }
  }

  public record WorkoutHistoryItemResponse(
    UUID id,
    Instant startedAt,
    Instant completedAt,
    long durationSeconds,
    String notes,
    int exerciseCount,
    int setCount,
    int completedSetCount,
    BigDecimal completedVolumeKg
  ) {
    static WorkoutHistoryItemResponse from(WorkoutHistoryItem item) {
      return new WorkoutHistoryItemResponse(
        item.id(),
        item.startedAt(),
        item.completedAt(),
        item.durationSeconds(),
        item.notes(),
        item.exerciseCount(),
        item.setCount(),
        item.completedSetCount(),
        item.completedVolumeKg()
      );
    }
  }

  public record WorkoutDetailResponse(
    UUID id,
    Instant startedAt,
    Instant completedAt,
    long durationSeconds,
    String notes,
    List<WorkoutExerciseDetailResponse> exercises
  ) {
    static WorkoutDetailResponse from(WorkoutDetail detail) {
      return new WorkoutDetailResponse(
        detail.id(),
        detail.startedAt(),
        detail.completedAt(),
        detail.durationSeconds(),
        detail.notes(),
        detail
          .exercises()
          .stream()
          .map(WorkoutExerciseDetailResponse::from)
          .toList()
      );
    }
  }

  public record WorkoutExerciseDetailResponse(
    int position,
    String exerciseCode,
    String displayName,
    String notes,
    List<WorkoutSetDetailResponse> sets
  ) {
    static WorkoutExerciseDetailResponse from(
      WorkoutExerciseDetail exercise
    ) {
      return new WorkoutExerciseDetailResponse(
        exercise.position(),
        exercise.exerciseCode(),
        exercise.displayName(),
        exercise.notes(),
        exercise
          .sets()
          .stream()
          .map(WorkoutSetDetailResponse::from)
          .toList()
      );
    }
  }

  public record WorkoutSetDetailResponse(
    int position,
    BigDecimal weightKg,
    int repetitions,
    Instant completedAt,
    String notes
  ) {
    static WorkoutSetDetailResponse from(WorkoutSetDetail set) {
      return new WorkoutSetDetailResponse(
        set.position(),
        set.weightKg(),
        set.repetitions(),
        set.completedAt(),
        set.notes()
      );
    }
  }

  public record PreviousPerformanceResponse(
    UUID workoutId,
    Instant completedAt,
    String exerciseCode,
    String displayName,
    List<WorkoutSetDetailResponse> sets
  ) {
    static PreviousPerformanceResponse from(
      PreviousExercisePerformance performance
    ) {
      return new PreviousPerformanceResponse(
        performance.workoutId(),
        performance.completedAt(),
        performance.exerciseCode(),
        performance.displayName(),
        performance
          .sets()
          .stream()
          .map(WorkoutSetDetailResponse::from)
          .toList()
      );
    }
  }
}
