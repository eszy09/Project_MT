import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActiveWorkoutScreen } from "./active-workout-screen";

const startedAt = "2026-07-06T10:00:00Z";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ActiveWorkoutScreen", () => {
  it("adds, searches, reorders, and removes exercises", () => {
    render(<ActiveWorkoutScreen startedAt={startedAt} />);

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
      screen.getByRole("button", { name: /remove overhead press/i }),
    );
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Overhead Press",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows accessible completion validation", () => {
    render(<ActiveWorkoutScreen startedAt={startedAt} />);

    fireEvent.click(screen.getByRole("button", { name: /complete workout/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /add at least one exercise/i,
    );
  });

  it("protects unsaved work from refresh and internal navigation", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ActiveWorkoutScreen startedAt={startedAt} />);

    fireEvent.click(screen.getByRole("button", { name: /browse exercises/i }));
    fireEvent.click(screen.getByRole("button", { name: /back squat/i }));

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
    render(<ActiveWorkoutScreen startedAt={startedAt} />);

    fireEvent.click(screen.getByRole("button", { name: /browse exercises/i }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
