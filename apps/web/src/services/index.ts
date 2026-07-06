export {
  OnboardingApiError,
  completeOnboarding,
  getOnboardingDraft,
  saveBodyContextStage,
  saveGoalsStage,
  saveProfileStage,
} from "./onboarding-api";
export { logApiFailure } from "./telemetry";
export {
  WorkoutApiError,
  getPreviousPerformance,
  getWorkoutDetail,
  getWorkoutHistory,
  saveCompletedWorkout,
} from "./workout-api";

export type {
  ExperienceLevel,
  OnboardingDraft,
  PrimaryGoal,
  TargetArea,
} from "./onboarding-api";
export type {
  SavedWorkoutResponse,
  PreviousPerformance,
  WorkoutDetail,
  WorkoutCompletionInput,
  WorkoutHistoryItem,
  WorkoutHistoryPage,
} from "./workout-api";
export {
  archiveRoutine,
  createRoutine,
  deleteRoutine,
  getRoutine,
  listRoutines,
  updateRoutine,
} from "./routine-api";
export type { Routine, RoutineInput } from "./routine-api";
