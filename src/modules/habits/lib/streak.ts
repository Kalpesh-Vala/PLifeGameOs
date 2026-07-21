import { dateKey } from "@/lib/date";
import { subDays, parseISO, differenceInCalendarDays } from "date-fns";

/**
 * Computes current and longest daily streaks from a set of completion date
 * keys (YYYY-MM-DD). The current streak counts consecutive days ending today
 * or yesterday (so a streak isn't "broken" until a full day is missed).
 */
export function computeStreaks(
  entries: string[],
  today: string = dateKey(),
): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 };

  const unique = [...new Set(entries)].sort(); // ascending

  // Longest run of consecutive calendar days.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const gap = differenceInCalendarDays(
      parseISO(unique[i]),
      parseISO(unique[i - 1]),
    );
    if (gap === 1) run += 1;
    else if (gap > 1) run = 1;
    longest = Math.max(longest, run);
  }

  // Current streak: walk backwards from today (or yesterday).
  const set = new Set(unique);
  const yesterday = dateKey(subDays(parseISO(today), 1));
  let cursor: string;
  if (set.has(today)) cursor = today;
  else if (set.has(yesterday)) cursor = yesterday;
  else return { current: 0, longest };

  let current = 0;
  while (set.has(cursor)) {
    current += 1;
    cursor = dateKey(subDays(parseISO(cursor), 1));
  }

  return { current, longest: Math.max(longest, current) };
}
