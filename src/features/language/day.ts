/**
 * Calendar-day helpers for language hub (FA-first → Asia/Tehran).
 * Avoids server-local midnight skew for streak / daily vocab / reminders.
 */

export const LANG_APP_TIMEZONE = "Asia/Tehran";

/** Start of the calendar day in LANG_APP_TIMEZONE, as a UTC Date at 00:00 UTC of that Y-M-D. */
export function startOfAppDay(
  date: Date = new Date(),
  timeZone: string = LANG_APP_TIMEZONE,
): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

export function daysAgoApp(n: number, from: Date = new Date()): Date {
  const d = startOfAppDay(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
