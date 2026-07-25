export const WORKOUT_TYPES = [
  "Strength",
  "Cardio",
  "Running",
  "Cycling",
  "Walking",
  "Swimming",
  "Yoga",
  "Sports",
  "Other",
] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export type FitnessDayView = {
  date: string;
  weightKg: number | null;
  waterMl: number;
  sleepHours: number | null;
  calories: number | null;
};

export type WorkoutView = {
  id: string;
  date: string;
  type: string;
  durationMin: number;
  note: string | null;
  createdAt: string;
};

export type FitnessToday = {
  day: FitnessDayView;
  workouts: WorkoutView[];
};

export type WeightPoint = { date: string; weightKg: number };

export const WORKOUT_XP = 20;
export const WATER_GOAL_ML = 2500;
export const WATER_STEP_ML = 250;
