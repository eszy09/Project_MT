import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OnboardingDraft } from "@/services";
import { OnboardingFlow } from "./onboarding-flow";

vi.mock("./actions", () => ({
  saveProfileAction: vi.fn(),
  saveGoalsAction: vi.fn(),
  saveBodyContextAction: vi.fn(),
  completeOnboardingAction: vi.fn(),
}));

const draft: OnboardingDraft = {
  id: "profile-id",
  displayName: "Taylor",
  primaryGoal: "BUILD_MUSCLE",
  targetAreas: ["BACK", "LEGS"],
  experienceLevel: "INTERMEDIATE",
  heightCm: 178.5,
  weightKg: 79.2,
  onboardingStep: 4,
  completed: false,
  completedAt: null,
  updatedAt: "2026-07-05T00:00:00Z",
};

describe("OnboardingFlow", () => {
  it("distinguishes required profile information", () => {
    render(
      <OnboardingFlow
        draft={null}
        fallbackDisplayName="New athlete"
        step={1}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: /how should we address you/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("(required)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("New athlete")).toBeInTheDocument();
  });

  it("explains why optional body measurements are requested", () => {
    render(<OnboardingFlow draft={draft} fallbackDisplayName="" step={3} />);

    expect(screen.getAllByText("(optional)")).toHaveLength(3);
    expect(screen.getByText(/why we ask/i)).toBeInTheDocument();
    expect(
      screen.getByText(/private, optional, and are not used to diagnose/i),
    ).toBeInTheDocument();
  });

  it("reviews the persisted goal and target areas", () => {
    render(<OnboardingFlow draft={draft} fallbackDisplayName="" step={4} />);

    expect(screen.getByText("Build muscle")).toBeInTheDocument();
    expect(screen.getByText("Back, Legs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete setup/i }),
    ).toBeInTheDocument();
  });
});
