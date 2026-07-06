package com.projectmt.api.routine;

import com.projectmt.api.shared.api.ApiPaths;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping(path=ApiPaths.V1+"/routines",produces=MediaType.APPLICATION_JSON_VALUE)
public class RoutineController {
  private final RoutineService routines;
  public RoutineController(RoutineService routines){this.routines=routines;}

  @PostMapping(consumes=MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public RoutineResponse create(@Valid @RequestBody RoutineRequest request){
    return RoutineResponse.from(routines.create(request.command()));
  }
  @GetMapping public List<RoutineResponse> list(
    @RequestParam(defaultValue="false") boolean includeArchived){
    return routines.list(includeArchived).stream().map(RoutineResponse::from).toList();
  }
  @GetMapping("/{id}") public RoutineResponse get(@PathVariable UUID id){
    return RoutineResponse.from(routines.get(id));
  }
  @PutMapping(path="/{id}",consumes=MediaType.APPLICATION_JSON_VALUE)
  public RoutineResponse update(@PathVariable UUID id,
    @RequestParam @Min(1) int version,@Valid @RequestBody RoutineRequest request){
    return RoutineResponse.from(routines.update(id,version,request.command()));
  }
  @PostMapping("/{id}/archive") public RoutineResponse archive(
    @PathVariable UUID id,@RequestParam @Min(1) int version){
    return RoutineResponse.from(routines.archive(id,version,true));
  }
  @PostMapping("/{id}/restore") public RoutineResponse restore(
    @PathVariable UUID id,@RequestParam @Min(1) int version){
    return RoutineResponse.from(routines.archive(id,version,false));
  }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id){routines.delete(id);}

  public record RoutineRequest(
    @NotBlank @Size(max=100) String name,
    @Size(max=1000) String description,
    @NotNull @Pattern(regexp="CHEST|BACK|SHOULDERS|ARMS|LEGS|FULL_BODY|OTHER")
    String muscleGroup,
    @NotEmpty @Size(max=100) List<@Valid RoutineExerciseRequest> exercises
  ){ RoutineCommand command(){return new RoutineCommand(name,description,muscleGroup,
    exercises.stream().map(RoutineExerciseRequest::command).toList());}}
  public record RoutineExerciseRequest(
    @NotBlank @Size(max=100) @Pattern(regexp="[a-z0-9][a-z0-9._-]*") String exerciseCode,
    @NotBlank @Size(max=150) String displayName,
    @Size(max=1000) String notes,
    @NotEmpty @Size(max=100) List<@Valid RoutineSetRequest> sets
  ){RoutineExerciseCommand command(){return new RoutineExerciseCommand(exerciseCode,
    displayName,notes,sets.stream().map(RoutineSetRequest::command).toList());}}
  public record RoutineSetRequest(
    @DecimalMin("0.000") @DecimalMax("2000.000") BigDecimal targetWeightKg,
    @Min(1) @Max(1000) int targetRepetitions,
    @Size(max=500) String notes
  ){RoutineSetCommand command(){return new RoutineSetCommand(targetWeightKg,targetRepetitions,notes);}}

  public record RoutineResponse(UUID id,String name,String description,String muscleGroup,
    int version,java.time.Instant archivedAt,java.time.Instant createdAt,
    java.time.Instant updatedAt,List<RoutineExerciseResponse> exercises){
    static RoutineResponse from(RoutineView view){return new RoutineResponse(view.id(),
      view.name(),view.description(),view.muscleGroup(),view.version(),view.archivedAt(),
      view.createdAt(),view.updatedAt(),view.exercises().stream().map(RoutineExerciseResponse::from).toList());}}
  public record RoutineExerciseResponse(int position,String exerciseCode,String displayName,
    String notes,List<RoutineSetResponse> sets){
    static RoutineExerciseResponse from(RoutineExerciseView view){return new RoutineExerciseResponse(
      view.position(),view.exerciseCode(),view.displayName(),view.notes(),
      view.sets().stream().map(RoutineSetResponse::from).toList());}}
  public record RoutineSetResponse(int position,BigDecimal targetWeightKg,
    int targetRepetitions,String notes){
    static RoutineSetResponse from(RoutineSetView view){return new RoutineSetResponse(
      view.position(),view.targetWeightKg(),view.targetRepetitions(),view.notes());}}
}
