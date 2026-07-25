/**
 * Pure scheduling logic for the escalating reminder engine. Client-safe and
 * unit-tested. Decides which single reminder "stage" (if any) is currently
 * active for a scheduled habit — never more than one at a time, so the engine
 * (with per-day de-duplication) sends a small, escalating series rather than
 * spamming every minute.
 *
 * Timeline for a habit scheduled at T with grace period G:
 *
 *   [T - HEADS_UP, T)     -> "heads-up"    a gentle warm-up
 *   [T, graceStart)       -> "due"         it's time
 *   [graceStart, final)   -> "grace"       running late, still savable
 *   [final, T + G)        -> "final-call"  last chance before it's missed
 *   >= T + G              -> null          missed (handled elsewhere)
 */

import { timeToMinutes } from "@/modules/habits/lib/rules";

export type NotificationStage = "heads-up" | "due" | "grace" | "final-call";

/** How many minutes before the scheduled time to send the heads-up. */
export const HEADS_UP_MIN = 10;

/** Target length (minutes) of the final-call window at the end of grace. */
export const FINAL_CALL_MIN = 5;

/** Minutes of "due" window when a habit has no grace period. */
export const NO_GRACE_DUE_WINDOW = 5;

export type HabitSchedule = {
  scheduledTime: string | null; // "HH:mm"
  gracePeriodMin: number;
};

/**
 * Returns the reminder stage active at `nowMin` (minutes since midnight) for a
 * habit scheduled at `scheduledMin` with `graceMin` grace, or `null` if no
 * reminder should be active right now.
 */
export function stageForMinutes(
  scheduledMin: number,
  graceMin: number,
  nowMin: number,
): NotificationStage | null {
  const grace = Math.max(0, graceMin);
  const deadline = scheduledMin + grace;

  // Too early — nothing yet.
  if (nowMin < scheduledMin - HEADS_UP_MIN) return null;

  // Warm-up window before the scheduled time.
  if (nowMin < scheduledMin) return "heads-up";

  // No grace: a short "due" window right at the scheduled time.
  if (grace <= 0) {
    return nowMin < scheduledMin + NO_GRACE_DUE_WINDOW ? "due" : null;
  }

  if (nowMin >= deadline) return null; // missed

  const graceStart = scheduledMin + Math.floor(grace / 2);
  const finalStart = deadline - Math.min(FINAL_CALL_MIN, Math.ceil(grace / 3));

  if (nowMin < graceStart) return "due";
  if (nowMin < finalStart) return "grace";
  return "final-call";
}

/**
 * Computes the active stage for a habit "now", plus minutes remaining until
 * the deadline. Returns null when the habit has no scheduled time or no
 * reminder is currently active.
 */
export function computeHabitStage(
  habit: HabitSchedule,
  now: Date = new Date(),
): { stage: NotificationStage; minutesLeft: number } | null {
  const scheduledMin = timeToMinutes(habit.scheduledTime);
  if (scheduledMin === null) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const stage = stageForMinutes(scheduledMin, habit.gracePeriodMin, nowMin);
  if (!stage) return null;

  const deadline = scheduledMin + Math.max(0, habit.gracePeriodMin);
  const minutesLeft = Math.max(0, deadline - nowMin);
  return { stage, minutesLeft };
}
