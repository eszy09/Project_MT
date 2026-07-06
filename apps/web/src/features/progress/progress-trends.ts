import type { BodyCheckin, WorkoutHistoryItem } from "@/services";

export type TrendPoint = {
  date: string;
  value: number;
};

export type TrendSeries = {
  id: string;
  title: string;
  unit: string;
  dateRange: string;
  points: readonly TrendPoint[];
  summary: string;
  limitedMessage: string | null;
};

export type ProgressTrends = {
  weight: TrendSeries;
  circumference: TrendSeries;
  consistency: TrendSeries;
  volume: TrendSeries;
};

const DAY_MS = 86_400_000;

export function buildProgressTrends(
  checkins: readonly BodyCheckin[],
  workouts: readonly WorkoutHistoryItem[],
  from: Date,
  to: Date,
): ProgressTrends {
  const dateRange = `${formatDate(from)} – ${formatDate(to)}`;
  const inRange = checkins
    .filter((checkin) => {
      const measuredAt = dateValue(checkin.measuredAt);
      return measuredAt >= from.getTime() && measuredAt <= to.getTime();
    })
    .toSorted(
      (left, right) => dateValue(left.measuredAt) - dateValue(right.measuredAt),
    );

  const weight = inRange.flatMap((checkin) => {
    if (!checkin.measuredAt || checkin.weight?.value === undefined) return [];
    return [
      {
        date: checkin.measuredAt,
        value: convertWeightToKg(checkin.weight.value, checkin.weight.unit),
      },
    ];
  });
  const circumference = inRange.flatMap((checkin) => {
    if (!checkin.measuredAt || checkin.waist?.value === undefined) return [];
    return [
      {
        date: checkin.measuredAt,
        value: convertLengthToCm(checkin.waist.value, checkin.waist.unit),
      },
    ];
  });

  const buckets = weeklyBuckets(from, to);
  let workoutsInRange = 0;
  for (const workout of workouts) {
    const completedAt = dateValue(workout.completedAt);
    if (completedAt < from.getTime() || completedAt > to.getTime()) continue;
    workoutsInRange += 1;
    const index = Math.min(
      buckets.length - 1,
      Math.floor((completedAt - from.getTime()) / (7 * DAY_MS)),
    );
    buckets[index].sessions += 1;
    buckets[index].volume += workout.completedVolumeKg ?? 0;
  }
  const consistency = buckets.map((bucket) => ({
    date: bucket.date,
    value: bucket.sessions,
  }));
  const volume = buckets.map((bucket) => ({
    date: bucket.date,
    value: round(bucket.volume),
  }));

  return {
    weight: measurementSeries("weight", "Weight", "kg", dateRange, weight),
    circumference: measurementSeries(
      "waist",
      "Waist circumference",
      "cm",
      dateRange,
      circumference,
    ),
    consistency: activitySeries(
      "consistency",
      "Workout consistency",
      "sessions/week",
      dateRange,
      consistency,
      workoutsInRange === 0
        ? "No completed workouts fall within this date range."
        : `${workoutsInRange} completed ${plural(workoutsInRange, "workout")} across ${buckets.length} ${plural(buckets.length, "week")}.`,
    ),
    volume: activitySeries(
      "volume",
      "Training volume",
      "kg·reps/week",
      dateRange,
      volume,
      workoutsInRange === 0
        ? "No completed workout volume falls within this date range."
        : `${formatNumber(volume.reduce((sum, point) => sum + point.value, 0))} kg·reps completed across ${buckets.length} ${plural(buckets.length, "week")}.`,
    ),
  };
}

function measurementSeries(
  id: string,
  title: string,
  unit: string,
  dateRange: string,
  points: readonly TrendPoint[],
): TrendSeries {
  if (points.length === 0) {
    return {
      id,
      title,
      unit,
      dateRange,
      points,
      summary: `No ${title.toLowerCase()} measurements are available for ${dateRange}.`,
      limitedMessage: "No data yet. Add a check-in to begin this trend.",
    };
  }
  if (points.length === 1) {
    return {
      id,
      title,
      unit,
      dateRange,
      points,
      summary: `One ${title.toLowerCase()} measurement of ${formatNumber(points[0].value)} ${unit} is available for ${dateRange}.`,
      limitedMessage:
        "Limited data: at least two measurements are needed to describe a change.",
    };
  }
  const first = points[0];
  const last = points.at(-1)!;
  const difference = round(last.value - first.value);
  const direction =
    difference > 0
      ? "increased"
      : difference < 0
        ? "decreased"
        : "was unchanged";
  const amount =
    difference === 0 ? "" : ` by ${formatNumber(Math.abs(difference))} ${unit}`;
  return {
    id,
    title,
    unit,
    dateRange,
    points,
    summary: `${title} ${direction}${amount} from ${formatNumber(first.value)} ${unit} on ${formatDate(new Date(first.date))} to ${formatNumber(last.value)} ${unit} on ${formatDate(new Date(last.date))}, based on ${points.length} measurements.`,
    limitedMessage: null,
  };
}

function activitySeries(
  id: string,
  title: string,
  unit: string,
  dateRange: string,
  points: readonly TrendPoint[],
  summary: string,
): TrendSeries {
  const nonZero = points.filter((point) => point.value > 0).length;
  return {
    id,
    title,
    unit,
    dateRange,
    points,
    summary,
    limitedMessage:
      nonZero < 2
        ? "Limited data: complete activity in at least two weeks before comparing a trend."
        : null,
  };
}

function weeklyBuckets(from: Date, to: Date) {
  const count = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / (7 * DAY_MS)),
  );
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(from.getTime() + index * 7 * DAY_MS).toISOString(),
    sessions: 0,
    volume: 0,
  }));
}

function convertWeightToKg(value: number, unit?: string) {
  return round(unit === "lb" ? value * 0.45359237 : value);
}

function convertLengthToCm(value: number, unit?: string) {
  return round(unit === "in" ? value * 2.54 : value);
}

function dateValue(value?: string) {
  return value ? new Date(value).getTime() : Number.NEGATIVE_INFINITY;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
    value,
  );
}

function plural(count: number, word: string) {
  return count === 1 ? word : `${word}s`;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
