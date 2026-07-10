import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ProgressTrendsScreen,
  TrendChart,
  type AvatarComparison,
} from "./progress-trends-screen";
import type { ProgressTrends, TrendSeries } from "./progress-trends";

const avatarComparison: AvatarComparison = {
  current: {
    source: "profile",
    measuredAt: "2026-04-30T00:00:00Z",
    heightCm: 180,
    weightKg: 79,
    bodyFatPercent: null,
    scales: {
      torso: 1,
      waist: 1,
      hip: 1,
      arm: 1,
      thigh: 1,
    },
    confidenceLabel: "Profile estimate",
    summary: "Profile height and weight provide a temporary avatar estimate.",
  },
  previous: null,
};
const populated: TrendSeries = {
  id: "weight",
  title: "Weight",
  unit: "kg",
  dateRange: "1 Apr 2026 – 30 Apr 2026",
  points: [
    { date: "2026-04-01T00:00:00Z", value: 80 },
    { date: "2026-04-30T00:00:00Z", value: 79 },
  ],
  summary: "Weight decreased by 1 kg based on two measurements.",
  limitedMessage: null,
};

describe("ProgressTrendsScreen", () => {
  it("associates every rendered chart with its visible text summary", () => {
    render(<TrendChart trend={populated} />);

    const article = screen
      .getByRole("heading", { name: "Weight" })
      .closest("article")!;
    expect(within(article).getByText("kg")).toBeVisible();
    expect(within(article).getByText(populated.dateRange)).toBeVisible();
    expect(within(article).getByRole("img")).toHaveAccessibleName(
      /weight text summary:\s*weight decreased by 1 kg/i,
    );
    expect(within(article).getByText(/text summary:/i)).toBeVisible();
  });

  it("renders limited-data and correlated error states without medical claims", () => {
    const limited: TrendSeries = {
      ...populated,
      points: [{ date: "2026-04-01T00:00:00Z", value: 80 }],
      summary: "One weight measurement is available.",
      limitedMessage: "Limited data: another measurement is required.",
    };
    const trends: ProgressTrends = {
      weight: limited,
      circumference: { ...limited, id: "waist", title: "Waist circumference" },
      consistency: {
        ...limited,
        id: "consistency",
        title: "Workout consistency",
        unit: "sessions/week",
      },
      volume: {
        ...limited,
        id: "volume",
        title: "Training volume",
        unit: "kg·reps/week",
      },
    };
    render(
      <ProgressTrendsScreen
        trends={trends}
        selectedDays={90}
        error={{ message: "Progress unavailable.", requestId: "request-25" }}
        avatarComparison={avatarComparison}
      />,
    );

    expect(screen.getAllByText(/limited data/i)).toHaveLength(4);
    expect(screen.getByRole("alert")).toHaveTextContent("request-25");
    expect(
      screen.getByText(/do not diagnose health conditions/i),
    ).toBeVisible();
    expect(screen.getByRole("combobox", { name: /date range/i })).toHaveValue(
      "90",
    );
  });
});
