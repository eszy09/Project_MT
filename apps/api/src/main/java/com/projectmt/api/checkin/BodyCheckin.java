package com.projectmt.api.checkin;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

record Measurement(BigDecimal value, String unit) {}

record BodyCheckinCommand(
  Instant measuredAt,
  Measurement weight,
  BigDecimal bodyFatPercent,
  Measurement chest,
  Measurement waist,
  Measurement hips,
  Measurement arm,
  Measurement thigh,
  String notes
) {}

record DerivedBodyParameters(
  UUID id,
  String algorithmVersion,
  BigDecimal torsoScale,
  BigDecimal waistScale,
  BigDecimal hipScale,
  BigDecimal armScale,
  BigDecimal thighScale,
  Instant createdAt
) {}

record BodyCheckin(
  UUID id,
  Instant measuredAt,
  Measurement weight,
  BigDecimal bodyFatPercent,
  Measurement chest,
  Measurement waist,
  Measurement hips,
  Measurement arm,
  Measurement thigh,
  String notes,
  Instant createdAt,
  DerivedBodyParameters derivedParameters
) {}
