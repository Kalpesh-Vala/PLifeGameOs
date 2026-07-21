export type HabitCadence = "daily";

export type HabitView = {
  id: string;
  title: string;
  notes: string | null;
  cadence: HabitCadence;
  skillId: string | null;
  skillName: string | null;
  xpReward: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  /** Completion date keys within the recent window, for the heatmap. */
  recentEntries: string[];
  totalCompletions: number;
  createdAt: string;
};

export const HABIT_XP = 15;
