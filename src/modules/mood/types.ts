import type { MoodLevel } from "@/modules/mood/lib/scale";

export type MoodEntryView = {
  date: string;
  mood: MoodLevel;
  energy: number | null;
  note: string | null;
};

export type MoodTrendPoint = {
  date: string;
  mood: number | null;
  energy: number | null;
};

export const MOOD_XP = 10;
