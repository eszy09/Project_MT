import { describe, expect, it } from "vitest";
import { buildProgressTrends } from "./progress-trends";

const from = new Date("2026-04-01T00:00:00Z");
const to = new Date("2026-04-28T23:59:59Z");

describe("buildProgressTrends", () => {
  it("normalizes mixed measurement units and describes recorded changes", () => {
    const trends = buildProgressTrends(
      [
        {
          measuredAt: "2026-04-02T08:00:00Z",
          weight: { value: 176.37, unit: "lb" },
          waist: { value: 35, unit: "in" },
        },
        {
          measuredAt: "2026-04-20T08:00:00Z",
          weight: { value: 78, unit: "kg" },
          waist: { value: 86, unit: "cm" },
        },
      ],
      [],
      from,
      to,
    );

    expect(trends.weight.points.map((point) => point.value)).toEqual([80, 78]);
    expect(trends.weight.summary).toMatch(/decreased by 2 kg/i);
    expect(trends.circumference.points.map((point) => point.value)).toEqual([
      88.9, 86,
    ]);
    expect(trends.circumference.unit).toBe("cm");
  });

  it("aggregates completed sessions and volume into weekly buckets", () => {
    const trends = buildProgressTrends(
      [],
      [
        {
          completedAt: "2026-04-03T10:00:00Z",
          completedVolumeKg: 1000,
        },
        {
          completedAt: "2026-04-12T10:00:00Z",
          completedVolumeKg: 1250,
        },
      ],
      from,
      to,
    );

    expect(trends.consistency.points.map((point) => point.value)).toEqual([
      1, 1, 0, 0,
    ]);
    expect(trends.volume.points.map((point) => point.value)).toEqual([
      1000, 1250, 0, 0,
    ]);
    expect(trends.consistency.summary).toMatch(/2 completed workouts/i);
    expect(trends.volume.summary).toMatch(/2,250 kg·reps/i);
  });

  it("uses honest limited-data states instead of inferring a trend", () => {
    const trends = buildProgressTrends(
      [
        {
          measuredAt: "2026-04-10T08:00:00Z",
          weight: { value: 80, unit: "kg" },
        },
      ],
      [],
      from,
      to,
    );

    expect(trends.weight.limitedMessage).toMatch(/at least two measurements/i);
    expect(trends.weight.summary).toMatch(/one weight measurement/i);
    expect(trends.circumference.limitedMessage).toMatch(/no data yet/i);
    expect(trends.consistency.summary).toMatch(/no completed workouts/i);
  });
});
