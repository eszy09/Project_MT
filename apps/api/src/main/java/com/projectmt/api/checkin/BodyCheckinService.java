package com.projectmt.api.checkin;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.*;
import java.math.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class BodyCheckinService {

  static final String ALGORITHM_VERSION = "body-proportions-v1";
  private static final BigDecimal INCH_TO_CM = new BigDecimal("2.54");

  private final CurrentUserService users;
  private final BodyCheckinRepository checkins;

  BodyCheckinService(CurrentUserService users, BodyCheckinRepository checkins) {
    this.users = users;
    this.checkins = checkins;
  }

  @Transactional
  BodyCheckin create(BodyCheckinCommand command) {
    BodyCheckinCommand normalized = normalizeAndValidate(command);
    UUID userId = users.requireCurrentUser().id();
    UUID checkinId = checkins.insert(userId, normalized);
    checkins.insertDerived(userId, checkinId, derive(normalized));
    return checkins.find(userId, checkinId).orElseThrow();
  }

  @Transactional(readOnly = true)
  List<BodyCheckin> list() {
    return checkins.list(users.requireCurrentUser().id());
  }

  @Transactional(readOnly = true)
  BodyCheckin get(UUID id) {
    return checkins.find(users.requireCurrentUser().id(), id)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  private BodyCheckinCommand normalizeAndValidate(BodyCheckinCommand command) {
    List<ApiFieldError> errors = new ArrayList<>();
    Measurement weight = measurement(command.weight(), Set.of("kg", "lb"), "weight", errors);
    Measurement chest = measurement(command.chest(), Set.of("cm", "in"), "chest", errors);
    Measurement waist = measurement(command.waist(), Set.of("cm", "in"), "waist", errors);
    Measurement hips = measurement(command.hips(), Set.of("cm", "in"), "hips", errors);
    Measurement arm = measurement(command.arm(), Set.of("cm", "in"), "arm", errors);
    Measurement thigh = measurement(command.thigh(), Set.of("cm", "in"), "thigh", errors);

    range(weight, "weight", new BigDecimal("20"), new BigDecimal("635"), errors);
    range(chest, "chest", new BigDecimal("30"), new BigDecimal("250"), errors);
    range(waist, "waist", new BigDecimal("30"), new BigDecimal("250"), errors);
    range(hips, "hips", new BigDecimal("30"), new BigDecimal("250"), errors);
    range(arm, "arm", new BigDecimal("10"), new BigDecimal("100"), errors);
    range(thigh, "thigh", new BigDecimal("15"), new BigDecimal("150"), errors);

    if (weight == null && command.bodyFatPercent() == null && chest == null
      && waist == null && hips == null && arm == null && thigh == null) {
      errors.add(new ApiFieldError(
        "measurements",
        "REQUIRED",
        "At least one body measurement is required."
      ));
    }
    if (!errors.isEmpty()) {
      throw new ApiValidationException("One or more measurements are outside plausible ranges.", errors);
    }
    return new BodyCheckinCommand(
      command.measuredAt(),
      weight,
      scaled(command.bodyFatPercent()),
      chest,
      waist,
      hips,
      arm,
      thigh,
      text(command.notes())
    );
  }

  private Measurement measurement(
    Measurement value,
    Set<String> allowedUnits,
    String field,
    List<ApiFieldError> errors
  ) {
    if (value == null) return null;
    String unit = value.unit().toLowerCase(Locale.ROOT);
    if (!allowedUnits.contains(unit)) {
      errors.add(new ApiFieldError(field + ".unit", "INVALID", "The unit is not valid for this measurement."));
    }
    return new Measurement(scaled(value.value()), unit);
  }

  private void range(
    Measurement measurement,
    String field,
    BigDecimal minimumCanonical,
    BigDecimal maximumCanonical,
    List<ApiFieldError> errors
  ) {
    if (measurement == null) return;
    BigDecimal canonical = canonical(measurement);
    if (canonical.compareTo(minimumCanonical) < 0 || canonical.compareTo(maximumCanonical) > 0) {
      errors.add(new ApiFieldError(field + ".value", "OUT_OF_RANGE", "The measurement is outside the documented plausible range."));
    }
  }

  private DerivedBodyParameters derive(BodyCheckinCommand command) {
    return new DerivedBodyParameters(
      null,
      ALGORITHM_VERSION,
      ratio(command.chest(), new BigDecimal("100")),
      ratio(command.waist(), new BigDecimal("85")),
      ratio(command.hips(), new BigDecimal("100")),
      ratio(command.arm(), new BigDecimal("35")),
      ratio(command.thigh(), new BigDecimal("58")),
      null
    );
  }

  private BigDecimal ratio(Measurement measurement, BigDecimal referenceCm) {
    if (measurement == null) return null;
    return canonical(measurement).divide(referenceCm, 5, RoundingMode.HALF_UP);
  }

  private BigDecimal canonical(Measurement measurement) {
    return switch (measurement.unit()) {
      case "lb" -> measurement.value().multiply(new BigDecimal("0.45359237"));
      case "in" -> measurement.value().multiply(INCH_TO_CM);
      default -> measurement.value();
    };
  }

  private BigDecimal scaled(BigDecimal value) {
    return value == null ? null : value.stripTrailingZeros();
  }

  private String text(String value) {
    if (value == null) return null;
    String normalized = value.strip();
    return normalized.isEmpty() ? null : normalized;
  }
}
