import { format, subDays } from "date-fns";

/** Local date key in YYYY-MM-DD form. */
export function dateKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** Date key for the day before the given date. */
export function yesterdayKey(date: Date = new Date()): string {
  return dateKey(subDays(date, 1));
}
