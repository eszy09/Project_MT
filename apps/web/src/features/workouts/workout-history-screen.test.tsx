import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkoutHistoryScreen } from "./workout-history-screen";

const mocks = vi.hoisted(() => ({
  loadWorkoutHistoryAction: vi.fn(),
  loadWorkoutDetailAction: vi.fn(),
}));

vi.mock("./history-actions", () => mocks);

const workout = {
  id: "11111111-1111-4111-8111-111111111111",
  startedAt: "2026-07-06T10:00:00Z",
  completedAt: "2026-07-06T11:00:00Z",
  durationSeconds: 3600,
  notes: "Strength session",
  exerciseCount: 1,
  setCount: 2,
  completedSetCount: 2,
  completedVolumeKg: 1040,
};

beforeEach(() => {
  mocks.loadWorkoutHistoryAction.mockReset();
  mocks.loadWorkoutDetailAction.mockReset();
});

describe("WorkoutHistoryScreen", () => {
  it("renders the empty and correlated error states", () => {
    const { unmount } = render(
      <WorkoutHistoryScreen
        initialPage={{ items: [] }}
        filters={{}}
        formValues={{}}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /no completed workouts found/i }),
    ).toBeVisible();

    unmount();
    render(
      <WorkoutHistoryScreen
        initialPage={{ items: [] }}
        filters={{}}
        formValues={{}}
        initialError={{
          message: "History unavailable.",
          requestId: "request-id",
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("request-id");
  });

  it("loads the next cursor page without replacing existing history", async () => {
    mocks.loadWorkoutHistoryAction.mockResolvedValue({
      success: true,
      page: {
        items: [{ ...workout, id: "second", completedVolumeKg: 500 }],
      },
    });
    render(
      <WorkoutHistoryScreen
        initialPage={{ items: [workout], nextCursor: "cursor-1" }}
        filters={{ exerciseCode: "back-squat" }}
        formValues={{ exercise: "back-squat" }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /load more workouts/i }),
    );

    await waitFor(() =>
      expect(mocks.loadWorkoutHistoryAction).toHaveBeenCalledWith(
        { exerciseCode: "back-squat" },
        "cursor-1",
      ),
    );
    expect(screen.getByText("1,040 kg·reps")).toBeVisible();
    expect(screen.getByText("500 kg·reps")).toBeVisible();
  });

  it("loads ordered workout details only when expanded", async () => {
    mocks.loadWorkoutDetailAction.mockResolvedValue({
      success: true,
      workout: {
        id: workout.id,
        startedAt: workout.startedAt,
        completedAt: workout.completedAt,
        durationSeconds: 3600,
        exercises: [
          {
            position: 1,
            exerciseCode: "back-squat",
            displayName: "Back Squat",
            sets: [
              {
                position: 1,
                weightKg: 100,
                repetitions: 5,
                completedAt: "2026-07-06T10:20:00Z",
              },
            ],
          },
        ],
      },
    });
    render(
      <WorkoutHistoryScreen
        initialPage={{ items: [workout] }}
        filters={{}}
        formValues={{}}
      />,
    );

    fireEvent.click(screen.getByText("1,040 kg·reps"));

    expect(
      await screen.findByRole("heading", { name: /1. back squat/i }),
    ).toBeVisible();
    expect(mocks.loadWorkoutDetailAction).toHaveBeenCalledWith(workout.id);
    expect(screen.getByRole("cell", { name: "100 kg" })).toBeVisible();
  });
});
