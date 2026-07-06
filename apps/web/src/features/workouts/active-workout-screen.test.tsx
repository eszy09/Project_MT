import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveWorkoutScreen } from "./active-workout-screen";
import {
  loadActiveWorkoutDraft,
  saveActiveWorkoutDraft,
} from "./active-workout-storage";
import {
  activeWorkoutReducer,
  createActiveWorkoutState,
} from "./active-workout-state";
import { exerciseCatalog } from "./exercise-catalog";

const mocks = vi.hoisted(() => ({
  completeWorkoutAction: vi.fn(),
  loadPreviousPerformanceAction: vi.fn(),
}));

vi.mock("./actions", () => ({
  completeWorkoutAction: mocks.completeWorkoutAction,
  loadPreviousPerformanceAction: mocks.loadPreviousPerformanceAction,
}));

const startedAt = "2026-07-06T10:00:00Z";
const completionKey = "completion-key-123";
const draftOwnerKey = "owner-key-123";

function renderScreen() {
  return render(
    <ActiveWorkoutScreen
      startedAt={startedAt}
      completionKey={completionKey}
      draftOwnerKey={draftOwnerKey}
    />,
  );
}

function addBackSquat() {
  fireEvent.click(screen.getByRole("button", { name: /browse exercises/i }));
  fireEvent.click(screen.getByRole("button", { name: /back squat/i }));
}

function completeBackSquatSet() {
  fireEvent.change(
    screen.getByRole("spinbutton", {
      name: /back squat set 1 weight in kilograms/i,
    }),
    { target: { value: "100" } },
  );
  fireEvent.change(
    screen.getByRole("spinbutton", {
      name: /back squat set 1 repetitions/i,
    }),
    { target: { value: "5" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: /complete back squat set 1/i }),
  );
}

function storeCompletedBackSquatDraft() {
  let state = createActiveWorkoutState(startedAt, completionKey);
  state = activeWorkoutReducer(state, {
    type: "exercise-added",
    exercise: exerciseCatalog[0],
    id: "recovered-exercise",
    setId: "recovered-set",
  });

  for (const [field, value] of [
    ["weightKg", "100"],
    ["repetitions", "5"],
  ] as const) {
    state = activeWorkoutReducer(state, {
      type: "set-value-changed",
      exerciseId: "recovered-exercise",
      setId: "recovered-set",
      field,
      value,
    });
  }

  state = activeWorkoutReducer(state, {
    type: "set-completion-toggled",
    exerciseId: "recovered-exercise",
    setId: "recovered-set",
    completedAt: "2026-07-06T10:10:00Z",
  });

  saveActiveWorkoutDraft(draftOwnerKey, state);
}

beforeEach(() => {
  mocks.completeWorkoutAction.mockReset();
  mocks.loadPreviousPerformanceAction.mockReset();
  mocks.loadPreviousPerformanceAction.mockResolvedValue({
    success: true,
    sets: [],
  });
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ActiveWorkoutScreen", () => {
  it("adds, searches, reorders, and removes exercises", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderScreen();

    expect(
      screen.getByRole("heading", { name: /today's workout/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/start with your first exercise/i)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /browse exercises/i }));

    const dialog = screen.getByRole("dialog", { name: /add an exercise/i });
    const search = within(dialog).getByRole("searchbox", {
      name: /search exercises/i,
    });
    expect(search).toHaveFocus();

    fireEvent.change(search, { target: { value: "overhead" } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /overhead press/i }),
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Overhead Press" }),
    ).toBeVisible();
    expect(
      screen.getByRole("spinbutton", {
        name: /overhead press set 1 weight in kilograms/i,
      }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /add exercise/i }));
    fireEvent.change(
      screen.getByRole("searchbox", { name: /search exercises/i }),
      { target: { value: "back squat" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /back squat/i }));

    fireEvent.click(
      screen.getByRole("button", { name: /move back squat up/i }),
    );

    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Back Squat", "Overhead Press"]);

    fireEvent.click(
      screen.getByRole("button", { name: /^remove overhead press$/i }),
    );
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Overhead Press",
      }),
    ).not.toBeInTheDocument();
  });

  it("edits sets, copies the prior values, and reports live volume", () => {
    renderScreen();
    addBackSquat();
    completeBackSquatSet();

    expect(screen.getAllByText("500 kg·reps")).toHaveLength(2);
    expect(
      screen.getByRole("button", {
        name: /mark incomplete back squat set 1/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /add set/i }));

    const weightInputs = screen.getAllByRole("spinbutton", {
      name: /back squat set \d weight in kilograms/i,
    });
    const repetitionInputs = screen.getAllByRole("spinbutton", {
      name: /back squat set \d repetitions/i,
    });
    expect(weightInputs[1]).toHaveValue(100);
    expect(repetitionInputs[1]).toHaveValue(5);

    fireEvent.click(
      screen.getByRole("button", { name: /remove back squat set 2/i }),
    );
    expect(
      screen.getByRole("button", { name: /remove back squat set 1/i }),
    ).toBeDisabled();
  });

  it("loads and copies previous values into today's draft", async () => {
    mocks.loadPreviousPerformanceAction.mockResolvedValue({
      success: true,
      sets: [{ position: 1, weightKg: "80", repetitions: "8" }],
    });
    renderScreen();
    addBackSquat();

    fireEvent.click(await screen.findByRole("button", { name: /80 × 8/i }));

    expect(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 weight in kilograms/i,
      }),
    ).toHaveValue(80);
    expect(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 repetitions/i,
      }),
    ).toHaveValue(8);
  });

  it("shows accessible validation and prevents invalid completion", () => {
    renderScreen();
    addBackSquat();

    fireEvent.click(
      screen.getByRole("button", { name: /complete back squat set 1/i }),
    );

    expect(screen.getByText("Enter weight.")).toBeVisible();
    expect(screen.getByText("Enter repetitions.")).toBeVisible();
    expect(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 weight in kilograms/i,
      }),
    ).toHaveAttribute("aria-invalid", "true");

    fireEvent.click(screen.getByRole("button", { name: /complete workout/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /correct the highlighted set values/i,
    );
    expect(mocks.completeWorkoutAction).not.toHaveBeenCalled();
  });

  it("saves the workout and renders the completion summary", async () => {
    mocks.completeWorkoutAction.mockResolvedValue({
      success: true,
      workout: {
        id: "workout-id",
        durationSeconds: 1200,
        exerciseCount: 1,
        completedSetCount: 1,
      },
    });
    renderScreen();
    addBackSquat();
    completeBackSquatSet();

    fireEvent.click(screen.getByRole("button", { name: /complete workout/i }));

    expect(
      await screen.findByRole("heading", { name: /session complete/i }),
    ).toBeVisible();
    expect(mocks.completeWorkoutAction).toHaveBeenCalledWith(
      expect.objectContaining({
        completionKey,
        workout: expect.objectContaining({
          startedAt,
          exercises: [
            expect.objectContaining({
              exerciseCode: "back-squat",
              sets: [
                expect.objectContaining({
                  weightKg: 100,
                  repetitions: 5,
                }),
              ],
            }),
          ],
        }),
      }),
    );
  });

  it("preserves the draft and completion key after a correlated API failure", async () => {
    mocks.completeWorkoutAction.mockResolvedValue({
      success: false,
      error: "The workout API could not be reached.",
      requestId: "api-request-id",
    });
    renderScreen();
    addBackSquat();
    completeBackSquatSet();

    fireEvent.click(screen.getByRole("button", { name: /complete workout/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /workout api could not be reached/i,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/api-request-id/i);
    expect(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 weight in kilograms/i,
      }),
    ).toHaveValue(100);

    fireEvent.click(screen.getByRole("button", { name: /complete workout/i }));
    await waitFor(() =>
      expect(mocks.completeWorkoutAction).toHaveBeenCalledTimes(2),
    );
    expect(mocks.completeWorkoutAction.mock.calls[0][0].completionKey).toBe(
      completionKey,
    );
    expect(mocks.completeWorkoutAction.mock.calls[1][0].completionKey).toBe(
      completionKey,
    );
  });

  it("resumes an interrupted draft and reuses its completion key", async () => {
    storeCompletedBackSquatDraft();
    mocks.completeWorkoutAction.mockResolvedValue({
      success: false,
      error: "Temporary API failure.",
      requestId: "retry-request-id",
    });

    renderScreen();

    const dialog = await screen.findByRole("dialog", {
      name: /resume your workout/i,
    });
    const resumeButton = within(dialog).getByRole("button", {
      name: /resume workout/i,
    });
    await waitFor(() => expect(resumeButton).toHaveFocus());

    fireEvent.click(resumeButton);

    expect(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 weight in kilograms/i,
      }),
    ).toHaveValue(100);

    fireEvent.click(screen.getByRole("button", { name: /complete workout/i }));
    await waitFor(() =>
      expect(mocks.completeWorkoutAction).toHaveBeenCalledTimes(1),
    );
    expect(mocks.completeWorkoutAction.mock.calls[0][0].completionKey).toBe(
      completionKey,
    );
  });

  it("persists active edits and offers them after a component remount", async () => {
    const firstRender = renderScreen();
    addBackSquat();
    fireEvent.change(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 weight in kilograms/i,
      }),
      { target: { value: "87.5" } },
    );

    await waitFor(() =>
      expect(loadActiveWorkoutDraft(draftOwnerKey).status).toBe("available"),
    );
    firstRender.unmount();

    renderScreen();
    const dialog = await screen.findByRole("dialog", {
      name: /resume your workout/i,
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /resume workout/i }),
    );

    expect(
      screen.getByRole("spinbutton", {
        name: /back squat set 1 weight in kilograms/i,
      }),
    ).toHaveValue(87.5);
  });

  it("discards a recovered draft explicitly", async () => {
    storeCompletedBackSquatDraft();
    renderScreen();

    const dialog = await screen.findByRole("dialog", {
      name: /resume your workout/i,
    });
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /discard recovered draft/i,
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/start with your first exercise/i)).toBeVisible();
    expect(loadActiveWorkoutDraft(draftOwnerKey)).toEqual({ status: "none" });
  });

  it("protects unsaved work from refresh and internal navigation", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderScreen();
    addBackSquat();

    const beforeUnload = new Event("beforeunload", {
      bubbles: false,
      cancelable: true,
    });
    window.dispatchEvent(beforeUnload);

    expect(beforeUnload.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("link", { name: /dashboard/i }));
    expect(confirm).toHaveBeenCalledWith(
      expect.stringMatching(/unsaved changes/i),
    );
  });

  it("closes the exercise picker with Escape", () => {
    renderScreen();

    fireEvent.click(screen.getByRole("button", { name: /browse exercises/i }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
