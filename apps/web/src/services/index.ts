export {
  OnboardingApiError,
  completeOnboarding,
  getOnboardingDraft,
  saveBodyContextStage,
  saveGoalsStage,
  saveProfileStage,
} from "./onboarding-api";
export { logApiFailure } from "./telemetry";

export type {
  ExperienceLevel,
  OnboardingDraft,
  PrimaryGoal,
  TargetArea,
} from "./onboarding-api";
