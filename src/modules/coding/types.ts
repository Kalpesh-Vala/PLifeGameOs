export const CODING_PLATFORMS = [
  "LeetCode",
  "Codeforces",
  "HackerRank",
  "CodeChef",
  "GeeksforGeeks",
  "AtCoder",
  "Other",
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const CODING_XP: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

export type CodingProblemView = {
  id: string;
  title: string;
  platform: string;
  difficulty: Difficulty;
  topic: string | null;
  url: string | null;
  note: string | null;
  solvedOn: string;
  createdAt: string;
};

export type CodingStats = {
  total: number;
  byDifficulty: Record<Difficulty, number>;
  byPlatform: { platform: string; count: number }[];
  currentStreak: number;
  solveHeatmap: Record<string, number>;
};
