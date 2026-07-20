/**
 * Leveling math for the gamification engine. Pure and client-safe.
 *
 * Curve: the XP required to advance from level L to L+1 is `100 * L`.
 * Cumulative XP required to *reach* level L is therefore `50 * L * (L - 1)`.
 *
 *   Level 1 -> 2 : 100 XP      (total 100)
 *   Level 2 -> 3 : 200 XP      (total 300)
 *   Level 3 -> 4 : 300 XP      (total 600)
 *   ...
 */

export const MAX_LEVEL = 100;

/** XP needed to go from `level` to `level + 1`. */
export function xpForLevelUp(level: number): number {
  return 100 * Math.max(1, level);
}

/** Total cumulative XP required to reach `level`. */
export function totalXpForLevel(level: number): number {
  const l = Math.max(1, level);
  return 50 * l * (l - 1);
}

/** Resolve a level from a total XP amount. */
export function levelFromXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  // Invert 50*L^2 - 50*L - xp = 0 -> L = (50 + sqrt(2500 + 200*xp)) / 100
  const level = Math.floor((50 + Math.sqrt(2500 + 200 * xp)) / 100);
  return Math.min(MAX_LEVEL, Math.max(1, level));
}

export type LevelProgress = {
  level: number;
  title: string;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  isMaxLevel: boolean;
};

/** Full progress breakdown for a given total XP. */
export function getLevelProgress(totalXp: number): LevelProgress {
  const level = levelFromXp(totalXp);
  const isMaxLevel = level >= MAX_LEVEL;
  const currentThreshold = totalXpForLevel(level);
  const nextThreshold = totalXpForLevel(level + 1);
  const xpForNextLevel = nextThreshold - currentThreshold;
  const xpIntoLevel = Math.max(0, totalXp - currentThreshold);

  return {
    level,
    title: levelTitle(level),
    totalXp,
    xpIntoLevel: isMaxLevel ? xpForLevelUp(level) : xpIntoLevel,
    xpForNextLevel: isMaxLevel ? xpForLevelUp(level) : xpForNextLevel,
    progressPct: isMaxLevel
      ? 100
      : Math.round((xpIntoLevel / xpForNextLevel) * 100),
    isMaxLevel,
  };
}

const LEVEL_TITLES: { min: number; title: string }[] = [
  { min: 100, title: "Legend" },
  { min: 80, title: "Grandmaster" },
  { min: 60, title: "Architect" },
  { min: 45, title: "Expert" },
  { min: 30, title: "Engineer" },
  { min: 20, title: "Focused" },
  { min: 10, title: "Disciplined" },
  { min: 5, title: "Novice" },
  { min: 1, title: "Beginner" },
];

/** Human-friendly rank title for a level. */
export function levelTitle(level: number): string {
  return LEVEL_TITLES.find((t) => level >= t.min)?.title ?? "Beginner";
}
