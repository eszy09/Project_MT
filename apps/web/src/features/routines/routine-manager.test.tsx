import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoutineManager } from "./routine-manager";

const mocks = vi.hoisted(() => ({
  saveRoutineAction: vi.fn(),
  changeRoutineStateAction: vi.fn(),
}));
vi.mock("./routine-actions", () => mocks);

beforeEach(() => {
  mocks.saveRoutineAction.mockReset();
  mocks.changeRoutineStateAction.mockReset();
});

describe("RoutineManager", () => {
  it("creates a routine and exposes an independent workout start link", async () => {
    mocks.saveRoutineAction.mockResolvedValue({
      success: true,
      routine: {
        id: "routine-id",
        name: "Push day",
        muscleGroup: "CHEST",
        version: 1,
        exercises: [],
      },
    });
    render(<RoutineManager initialRoutines={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/routine name/i), {
      target: { value: "Push day" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create routine/i }));
    expect(
      await screen.findByRole("heading", { name: "Push day" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute(
      "href",
      "/workouts/active?routineId=routine-id",
    );
  });

  it("archives before exposing permanent deletion", async () => {
    mocks.changeRoutineStateAction.mockResolvedValue({ success: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <RoutineManager
        initialRoutines={[
          {
            id: "routine-id",
            name: "Leg day",
            muscleGroup: "LEGS",
            version: 1,
            exercises: [],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() =>
      expect(mocks.changeRoutineStateAction).toHaveBeenCalledWith(
        "routine-id",
        1,
        "archive",
      ),
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  it("edits exercise ordering before saving", async () => {
    mocks.saveRoutineAction.mockResolvedValue({
      success: true,
      routine: {
        id: "ordered-routine",
        name: "Ordered day",
        muscleGroup: "FULL_BODY",
        version: 1,
        exercises: [],
      },
    });
    render(<RoutineManager initialRoutines={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/routine name/i), {
      target: { value: "Ordered day" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add exercise/i }));
    fireEvent.change(screen.getByRole("combobox", { name: /exercise 2/i }), {
      target: { value: "barbell-bench-press" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /move exercise 2 up/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /create routine/i }));

    await waitFor(() => expect(mocks.saveRoutineAction).toHaveBeenCalled());
    const input = mocks.saveRoutineAction.mock.calls[0][0];
    expect(
      input.routine.exercises.map(
        (exercise: { exerciseCode: string }) => exercise.exerciseCode,
      ),
    ).toEqual(["barbell-bench-press", "back-squat"]);
  });

  it("cancels destructive actions when confirmation is declined", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <RoutineManager
        initialRoutines={[
          {
            id: "routine-id",
            name: "Protected",
            muscleGroup: "LEGS",
            version: 1,
            exercises: [],
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(mocks.changeRoutineStateAction).not.toHaveBeenCalled();
  });
});
