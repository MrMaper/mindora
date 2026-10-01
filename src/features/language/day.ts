/**
 * Calendar-day helpers for language hub (FA-first → Asia/Tehran).
 * Avoids server-local midnight skew for streak / daily vocab / reminders.
 */

import { startOfZonedDay } from "@/lib/life";

export const LANG_APP_TIMEZONE = "Asia/Tehran";

/**
 * Day *key* for `LangVocabDay.day` (UTC midnight of the Tehran Y-M-D).
 * Not an absolute Tehran midnight — use `startOfAppDayInstant` for instant windows.
 */
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

/** Absolute start of the Tehran calendar day (for `lastReviewedAt` windows). */
export function startOfAppDayInstant(date: Date = new Date()): Date {
  return startOfZonedDay(date);
}

export function daysAgoApp(n: number, from: Date = new Date()): Date {
  const d = startOfAppDay(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
