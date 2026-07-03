import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("introduces the Project_MT product", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /train with context/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/reliable workout logging/i)).toBeInTheDocument();
  });
});
