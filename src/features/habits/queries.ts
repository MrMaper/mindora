import { prisma as db } from "@/lib/db";
import {
  addDays,
  startOfDay,
  startOfWeek,
  toDateKey,
} from "@/lib/life";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { HABIT_HEATMAP_WEEKS } from "@/features/habits/constants";

export interface HabitItem {
  id: string;
  title: string;
  area: LifeArea | null;
  cadence: RecurrenceInterval;
  streak: number;
  bestStreak: number;
  lastDoneDate: string | null;
  doneToday: boolean;
  archived: boolean;
}

export interface HabitHeatDay {
  dateKey: string;
  count: number;
}

export async function listHabitsForUser(
  userId: string,
  input?: { archived?: boolean },
): Promise<HabitItem[]> {
  const todayKey = toDateKey(new Date());
  const archivedOnly = input?.archived === true;
  const rows = await db.habit.findMany({
    where: {
      userId,
      archivedAt: archivedOnly ? { not: null } : null,
    },
    orderBy: archivedOnly
      ? [{ archivedAt: "desc" }]
      : [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      area: true,
      cadence: true,
      streak: true,
      bestStreak: true,
      lastDoneDate: true,
      archivedAt: true,
      logs: {
        where: { dateKey: todayKey },
        select: { id: true },
        take: 1,
      },
    },
  });
  return rows.map(h => ({
    id: h.id,
    title: h.title,
    area: h.area,
    cadence: h.cadence,
    streak: h.streak,
    bestStreak: h.bestStreak,
    lastDoneDate: h.lastDoneDate,
    doneToday: h.logs.length > 0,
    archived: h.archivedAt != null,
  }));
}

/** Sat-aligned completion counts for the heatmap. */
export async function getHabitHeatmapForUser(
  userId: string,
  input?: { habitId?: string | null; weeks?: number },
): Promise<HabitHeatDay[]> {
  const weeks = Math.min(
    HABIT_HEATMAP_WEEKS,
    Math.max(8, input?.weeks ?? HABIT_HEATMAP_WEEKS),
  );
  const today = startOfDay(new Date());
  const endWeek = startOfWeek(today);
  const start = addDays(endWeek, -(weeks - 1) * 7);
  const startKey = toDateKey(start);
  const endKey = toDateKey(today);

  const habitFilter =
    input?.habitId && input.habitId !== "all"
      ? { habitId: input.habitId, habit: { userId } }
      : {
          habit: {
            userId,
            archivedAt: null,
          },
        };

  const logs = await db.habitLog.findMany({
    where: {
      ...habitFilter,
      dateKey: { gte: startKey, lte: endKey },
    },
    select: { dateKey: true },
  });

  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.dateKey, (counts.get(log.dateKey) ?? 0) + 1);
  }

  const days: HabitHeatDay[] = [];
  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i);
    const key = toDateKey(d);
    days.push({
      dateKey: key,
      count: d > today ? 0 : (counts.get(key) ?? 0),
    });
  }
  return days;
}
