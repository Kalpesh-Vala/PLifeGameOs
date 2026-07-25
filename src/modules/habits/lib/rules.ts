/**
 * Rules and tunable constants for the disciplined, time-based habit system.
 * Pure and client-safe.
 */

export type Difficulty = "easy" | "medium" | "hard";
export type Priority = "low" | "medium" | "high";
export type Recurrence = "daily" | "weekly";

/**
 * A habit's outcome for a given day.
 * - upcoming: scheduled today, deadline not passed, not done yet
 * - on-time: completed on/before the scheduled time
 * - late: completed after the deadline (partial credit within grace, else none)
 * - missed: deadline + grace passed with no check-in
 * - rest: not scheduled today (weekly habit on an off day)
 */
export type HabitStatus =
  | "upcoming"
  | "on-time"
  | "late"
  | "missed"
  | "rest";

export const DIFFICULTY_DEFAULTS: Record<
  Difficulty,
  { xp: number; penalty: number }
> = {
  easy: { xp: 10, penalty: 5 },
  medium: { xp: 20, penalty: 10 },
  hard: { xp: 35, penalty: 20 },
};

export const PRIORITY_BONUS: Record<Priority, number> = {
  low: 0,
  medium: 5,
  high: 10,
};

/** XP factor when completed late but within the grace period. */
export const LATE_GRACE_XP_FACTOR = 0.5;

/** Discipline score deltas (score is clamped 0-100). */
export const DISCIPLINE_DELTA = {
  onTime: 2,
  lateGrace: -2,
  lateBeyond: -5,
  missed: -8,
  allOnTimeBonus: 5,
} as const;

/** Bonus for completing every scheduled habit on time in a day. */
export const ALL_ON_TIME_XP = 50;

export const DEFAULT_GRACE_MIN = 30;

/** Streak multiplier: grows every 7-day milestone, capped at 3x. */
export function streakMultiplier(streak: number): number {
  return Math.min(3, 1 + Math.floor(streak / 7) * 0.5);
}

/** Whether a habit is scheduled on the given weekday (0=Sun..6=Sat). */
export function isScheduledOnDow(
  recurrence: Recurrence,
  weeklyDays: number[],
  dow: number,
): boolean {
  if (recurrence === "daily") return true;
  return weeklyDays.includes(dow);
}

/** Parses "HH:mm" into minutes since midnight, or null. */
export function timeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const m = time.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Display metadata for each status (Tailwind classes). */
export const STATUS_META: Record<
  HabitStatus,
  { label: string; text: string; bg: string; ring: string }
> = {
  "on-time": {
    label: "On time",
    text: "text-success",
    bg: "bg-success/15",
    ring: "ring-success/40",
  },
  upcoming: {
    label: "Upcoming",
    text: "text-info",
    bg: "bg-info/15",
    ring: "ring-info/40",
  },
  late: {
    label: "Late",
    text: "text-warning",
    bg: "bg-warning/15",
    ring: "ring-warning/40",
  },
  missed: {
    label: "Missed",
    text: "text-destructive",
    bg: "bg-destructive/15",
    ring: "ring-destructive/40",
  },
  rest: {
    label: "Rest day",
    text: "text-muted-foreground",
    bg: "bg-muted",
    ring: "ring-border",
  },
};

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
