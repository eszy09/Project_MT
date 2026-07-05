import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuthenticationErrorPage from "./page";

describe("AuthenticationErrorPage", () => {
  it("provides a safe sign-in recovery action", () => {
    render(<AuthenticationErrorPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /session may have expired/i,
    );
    expect(
      screen.getByRole("link", { name: /start a new sign-in/i }),
    ).toHaveAttribute("href", "/auth/login?returnTo=%2Fdashboard");
  });
});
