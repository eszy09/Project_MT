package com.projectmt.api.checkin;

import com.projectmt.api.shared.api.ApiPaths;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping(path = ApiPaths.V1 + "/checkins", produces = MediaType.APPLICATION_JSON_VALUE)
public class BodyCheckinController {

  private final BodyCheckinService checkins;

  public BodyCheckinController(BodyCheckinService checkins) {
    this.checkins = checkins;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public BodyCheckinResponse create(@Valid @RequestBody BodyCheckinRequest request) {
    return BodyCheckinResponse.from(checkins.create(request.command()));
  }

  @GetMapping
  public List<BodyCheckinResponse> list() {
    return checkins.list().stream().map(BodyCheckinResponse::from).toList();
  }

  @GetMapping("/{id}")
  public BodyCheckinResponse get(@PathVariable UUID id) {
    return BodyCheckinResponse.from(checkins.get(id));
  }

  public record MeasurementRequest(
    @NotNull @DecimalMin("0.001") BigDecimal value,
    @NotBlank @Pattern(regexp = "kg|lb|cm|in") String unit
  ) {
    Measurement measurement() {
      return new Measurement(value, unit);
    }
  }

  public record BodyCheckinRequest(
    @NotNull @PastOrPresent Instant measuredAt,
    @Valid MeasurementRequest weight,
    @DecimalMin("2.00") @DecimalMax("75.00") BigDecimal bodyFatPercent,
    @Valid MeasurementRequest chest,
    @Valid MeasurementRequest waist,
    @Valid MeasurementRequest hips,
    @Valid MeasurementRequest arm,
    @Valid MeasurementRequest thigh,
    @Size(max = 1000) String notes
  ) {
    BodyCheckinCommand command() {
      return new BodyCheckinCommand(
        measuredAt,
        measurement(weight),
        bodyFatPercent,
        measurement(chest),
        measurement(waist),
        measurement(hips),
        measurement(arm),
        measurement(thigh),
        notes
      );
    }

    private static Measurement measurement(MeasurementRequest request) {
      return request == null ? null : request.measurement();
    }
  }

  public record MeasurementResponse(BigDecimal value, String unit) {
    static MeasurementResponse from(Measurement measurement) {
      return measurement == null
        ? null
        : new MeasurementResponse(measurement.value(), measurement.unit());
    }
  }

  public record DerivedParametersResponse(
    UUID id,
    String algorithmVersion,
    BigDecimal torsoScale,
    BigDecimal waistScale,
    BigDecimal hipScale,
    BigDecimal armScale,
    BigDecimal thighScale,
    Instant createdAt
  ) {
    static DerivedParametersResponse from(DerivedBodyParameters parameters) {
      return new DerivedParametersResponse(
        parameters.id(),
        parameters.algorithmVersion(),
        parameters.torsoScale(),
        parameters.waistScale(),
        parameters.hipScale(),
        parameters.armScale(),
        parameters.thighScale(),
        parameters.createdAt()
      );
    }
  }

  public record BodyCheckinResponse(
    UUID id,
    Instant measuredAt,
    MeasurementResponse weight,
    BigDecimal bodyFatPercent,
    MeasurementResponse chest,
    MeasurementResponse waist,
    MeasurementResponse hips,
    MeasurementResponse arm,
    MeasurementResponse thigh,
    String notes,
    Instant createdAt,
    DerivedParametersResponse derivedParameters
  ) {
    static BodyCheckinResponse from(BodyCheckin checkin) {
      return new BodyCheckinResponse(
        checkin.id(),
        checkin.measuredAt(),
        MeasurementResponse.from(checkin.weight()),
        checkin.bodyFatPercent(),
        MeasurementResponse.from(checkin.chest()),
        MeasurementResponse.from(checkin.waist()),
        MeasurementResponse.from(checkin.hips()),
        MeasurementResponse.from(checkin.arm()),
        MeasurementResponse.from(checkin.thigh()),
        checkin.notes(),
        checkin.createdAt(),
        DerivedParametersResponse.from(checkin.derivedParameters())
      );
    }
  }
}
