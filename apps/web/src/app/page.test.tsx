import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("introduces the Project_MT product", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /human-first training dashboard/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/set-by-set logging/i)).toBeInTheDocument();
  });
});
