export type ExerciseCatalogItem = {
  code: string;
  name: string;
  category: string;
};

export const exerciseCatalog: readonly ExerciseCatalogItem[] = [
  {
    code: "back-squat",
    name: "Back Squat",
    category: "Legs",
  },
  {
    code: "barbell-bench-press",
    name: "Barbell Bench Press",
    category: "Chest",
  },
  {
    code: "barbell-row",
    name: "Barbell Row",
    category: "Back",
  },
  {
    code: "deadlift",
    name: "Deadlift",
    category: "Posterior chain",
  },
  {
    code: "lat-pulldown",
    name: "Lat Pulldown",
    category: "Back",
  },
  {
    code: "leg-press",
    name: "Leg Press",
    category: "Legs",
  },
  {
    code: "overhead-press",
    name: "Overhead Press",
    category: "Shoulders",
  },
  {
    code: "pull-up",
    name: "Pull-up",
    category: "Back",
  },
  {
    code: "romanian-deadlift",
    name: "Romanian Deadlift",
    category: "Hamstrings",
  },
  {
    code: "seated-cable-row",
    name: "Seated Cable Row",
    category: "Back",
  },
  {
    code: "standing-calf-raise",
    name: "Standing Calf Raise",
    category: "Calves",
  },
  {
    code: "walking-lunge",
    name: "Walking Lunge",
    category: "Legs",
  },
];
