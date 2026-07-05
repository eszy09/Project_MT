import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthControls } from "./auth-controls";

describe("AuthControls", () => {
  it("offers sign-in when there is no session", () => {
    render(<AuthControls user={null} />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(
      screen.queryByRole("link", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

  it("shows the user and sign-out when authenticated", () => {
    render(
      <AuthControls
        user={{
          name: "Test Athlete",
          email: "athlete@example.com",
        }}
      />,
    );

    expect(screen.getByText("Test Athlete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign out" })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
  });
});
