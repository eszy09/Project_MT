package com.projectmt.api.checkin;

import java.sql.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class BodyCheckinRepository {

  private final JdbcClient jdbc;

  BodyCheckinRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  UUID insert(UUID userId, BodyCheckinCommand command) {
    return jdbc.sql("""
      INSERT INTO body_checkins (
        user_id, measured_at, weight_value, weight_unit, body_fat_percent,
        chest_value, chest_unit, waist_value, waist_unit, hips_value, hips_unit,
        arm_value, arm_unit, thigh_value, thigh_unit, notes
      ) VALUES (
        :userId, :measuredAt, :weightValue, :weightUnit, :bodyFat,
        :chestValue, :chestUnit, :waistValue, :waistUnit, :hipsValue, :hipsUnit,
        :armValue, :armUnit, :thighValue, :thighUnit, :notes
      ) RETURNING id
      """)
      .param("userId", userId).param("measuredAt", Timestamp.from(command.measuredAt()))
      .param("weightValue", value(command.weight())).param("weightUnit", unit(command.weight()))
      .param("bodyFat", command.bodyFatPercent())
      .param("chestValue", value(command.chest())).param("chestUnit", unit(command.chest()))
      .param("waistValue", value(command.waist())).param("waistUnit", unit(command.waist()))
      .param("hipsValue", value(command.hips())).param("hipsUnit", unit(command.hips()))
      .param("armValue", value(command.arm())).param("armUnit", unit(command.arm()))
      .param("thighValue", value(command.thigh())).param("thighUnit", unit(command.thigh()))
      .param("notes", command.notes())
      .query(UUID.class).single();
  }

  void insertDerived(UUID userId, UUID checkinId, DerivedBodyParameters parameters) {
    jdbc.sql("""
      INSERT INTO derived_body_parameters (
        user_id, source_checkin_id, algorithm_version, torso_scale, waist_scale,
        hip_scale, arm_scale, thigh_scale
      ) VALUES (
        :userId, :checkinId, :version, :torso, :waist, :hip, :arm, :thigh
      )
      """)
      .param("userId", userId).param("checkinId", checkinId)
      .param("version", parameters.algorithmVersion())
      .param("torso", parameters.torsoScale()).param("waist", parameters.waistScale())
      .param("hip", parameters.hipScale()).param("arm", parameters.armScale())
      .param("thigh", parameters.thighScale()).update();
  }

  List<BodyCheckin> list(UUID userId) {
    return jdbc.sql("""
      SELECT id FROM body_checkins
      WHERE user_id=:userId ORDER BY measured_at DESC, id DESC
      """)
      .param("userId", userId).query(UUID.class).list().stream()
      .map(id -> find(userId, id).orElseThrow()).toList();
  }

  Optional<BodyCheckin> find(UUID userId, UUID id) {
    return jdbc.sql("""
      SELECT c.*, d.id AS derived_id, d.algorithm_version, d.torso_scale,
        d.waist_scale, d.hip_scale, d.arm_scale, d.thigh_scale,
        d.created_at AS derived_created_at
      FROM body_checkins c
      JOIN derived_body_parameters d
        ON d.source_checkin_id=c.id AND d.user_id=c.user_id
      WHERE c.id=:id AND c.user_id=:userId
      """)
      .param("id", id).param("userId", userId)
      .query((rs, row) -> map(rs)).optional();
  }

  private BodyCheckin map(ResultSet rs) throws SQLException {
    return new BodyCheckin(
      rs.getObject("id", UUID.class),
      rs.getTimestamp("measured_at").toInstant(),
      measurement(rs, "weight"),
      rs.getBigDecimal("body_fat_percent"),
      measurement(rs, "chest"),
      measurement(rs, "waist"),
      measurement(rs, "hips"),
      measurement(rs, "arm"),
      measurement(rs, "thigh"),
      rs.getString("notes"),
      rs.getTimestamp("created_at").toInstant(),
      new DerivedBodyParameters(
        rs.getObject("derived_id", UUID.class),
        rs.getString("algorithm_version"),
        rs.getBigDecimal("torso_scale"),
        rs.getBigDecimal("waist_scale"),
        rs.getBigDecimal("hip_scale"),
        rs.getBigDecimal("arm_scale"),
        rs.getBigDecimal("thigh_scale"),
        rs.getTimestamp("derived_created_at").toInstant()
      )
    );
  }

  private Measurement measurement(ResultSet rs, String prefix) throws SQLException {
    var value = rs.getBigDecimal(prefix + "_value");
    return value == null ? null : new Measurement(value, rs.getString(prefix + "_unit"));
  }

  private Object value(Measurement measurement) {
    return measurement == null ? null : measurement.value();
  }

  private String unit(Measurement measurement) {
    return measurement == null ? null : measurement.unit();
  }
}
