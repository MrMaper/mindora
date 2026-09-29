import { addDays, parseLocalDate, toDateKey } from "@/lib/life";
import type { RecurrenceInterval } from "@/types/db";

function dayDiff(aKey: string, bKey: string): number {
  const a = parseLocalDate(aKey).getTime();
  const b = parseLocalDate(bKey).getTime();
  return Math.round((b - a) / 86_400_000);
}

function uniqueSorted(dateKeys: string[]): string[] {
  return [...new Set(dateKeys.filter(Boolean))].sort();
}

/** Longest consecutive run for daily habits (calendar days). */
function bestDailyRun(sorted: string[]): number {
  if (sorted.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap = dayDiff(sorted[i - 1]!, sorted[i]!);
    if (gap === 0) continue;
    if (gap === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/** Current daily streak ending at lastDone if that day is today or yesterday. */
function currentDailyStreak(sorted: string[], todayKey: string): number {
  if (sorted.length === 0) return 0;
  const last = sorted[sorted.length - 1]!;
  const gapFromToday = dayDiff(last, todayKey);
  // Active streak only if last done is today or yesterday
  if (gapFromToday > 1) return 0;

  let streak = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (dayDiff(sorted[i]!, sorted[i + 1]!) === 1) streak += 1;
    else break;
  }
  return streak;
}

function bestWeeklyRun(sorted: string[]): number {
  if (sorted.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap = dayDiff(sorted[i - 1]!, sorted[i]!);
    if (gap === 0) continue;
    if (gap > 0 && gap <= 7) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function currentWeeklyStreak(sorted: string[], todayKey: string): number {
  if (sorted.length === 0) return 0;
  const last = sorted[sorted.length - 1]!;
  const weekAgoKey = toDateKey(addDays(parseLocalDate(todayKey), -7));
  if (last < weekAgoKey) return 0;

  let streak = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const gap = dayDiff(sorted[i]!, sorted[i + 1]!);
    if (gap > 0 && gap <= 7) streak += 1;
    else break;
  }
  return streak;
}

/**
 * Recompute streak stats from remaining logs.
 * Fixes bestStreak staying high after undoing today's only check-in.
 */
export function computeHabitStreaks(
  dateKeys: string[],
  todayKey: string,
  cadence: RecurrenceInterval = "DAILY",
): { streak: number; bestStreak: number; lastDoneDate: string | null } {
  const sorted = uniqueSorted(dateKeys);
  if (sorted.length === 0) {
    return { streak: 0, bestStreak: 0, lastDoneDate: null };
  }

  const weekly = cadence === "WEEKLY";
  const bestStreak = weekly ? bestWeeklyRun(sorted) : bestDailyRun(sorted);
  const streak = weekly
    ? currentWeeklyStreak(sorted, todayKey)
    : currentDailyStreak(sorted, todayKey);

  return {
    streak,
    bestStreak,
    lastDoneDate: sorted[sorted.length - 1] ?? null,
  };
}
