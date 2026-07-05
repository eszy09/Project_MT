import type { ExperienceLevel, PrimaryGoal, TargetArea } from "@/services";

export const primaryGoalOptions: ReadonlyArray<{
  value: PrimaryGoal;
  label: string;
  description: string;
}> = [
  {
    value: "BUILD_MUSCLE",
    label: "Build muscle",
    description: "Prioritize progressive resistance training and recovery.",
  },
  {
    value: "LOSE_FAT",
    label: "Lose fat",
    description: "Balance strength work, activity, and sustainable progress.",
  },
  {
    value: "IMPROVE_STRENGTH",
    label: "Improve strength",
    description: "Focus on measurable performance in key movement patterns.",
  },
  {
    value: "GENERAL_FITNESS",
    label: "General fitness",
    description: "Build a balanced, consistent training foundation.",
  },
];

export const targetAreaOptions: ReadonlyArray<{
  value: TargetArea;
  label: string;
}> = [
  { value: "CHEST", label: "Chest" },
  { value: "BACK", label: "Back" },
  { value: "SHOULDERS", label: "Shoulders" },
  { value: "ARMS", label: "Arms" },
  { value: "CORE", label: "Core" },
  { value: "GLUTES", label: "Glutes" },
  { value: "LEGS", label: "Legs" },
  { value: "FULL_BODY", label: "Full body" },
];

export const experienceLevelOptions: ReadonlyArray<{
  value: ExperienceLevel;
  label: string;
}> = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function primaryGoalLabel(goal: PrimaryGoal) {
  return (
    primaryGoalOptions.find((option) => option.value === goal)?.label ?? goal
  );
}

export function targetAreaLabel(area: TargetArea) {
  return (
    targetAreaOptions.find((option) => option.value === area)?.label ?? area
  );
}
