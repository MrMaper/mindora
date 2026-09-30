"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import {
  addDays,
  startOfDay,
  startOfWeek,
  toDateKey,
} from "@/lib/life";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { computeHabitStreaks } from "@/features/habits/streaks";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

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

function revalidateHabits() {
  revalidatePath("/dashboard");
  revalidatePath("/habits");
}

export async function listHabitsAction(input?: {
  archived?: boolean;
}): Promise<HabitItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  const todayKey = toDateKey(new Date());
  const archivedOnly = input?.archived === true;
  const rows = await db.habit.findMany({
    where: {
      userId: session.user.id,
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

export interface HabitHeatDay {
  dateKey: string;
  count: number;
}

/** Last ~20 weeks of completion counts (all habits or one). */
export async function getHabitHeatmapAction(input?: {
  habitId?: string | null;
  weeks?: number;
}): Promise<HabitHeatDay[]> {
  const session = await auth();
  if (!session?.user) return [];

  const weeks = Math.min(52, Math.max(8, input?.weeks ?? 20));
  const today = startOfDay(new Date());
  // Align grid to week start (Sat), then go back `weeks` columns
  const endWeek = startOfWeek(today);
  const start = addDays(endWeek, -(weeks - 1) * 7);
  const startKey = toDateKey(start);
  const endKey = toDateKey(today);

  const habitFilter =
    input?.habitId && input.habitId !== "all"
      ? { habitId: input.habitId, habit: { userId: session.user.id } }
      : {
          habit: {
            userId: session.user.id,
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

  // Full Sat-aligned grid (future days in the current week stay count 0)
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

export async function createHabitAction(input: {
  title: string;
  area?: LifeArea | null;
  cadence?: RecurrenceInterval;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان لازم است" };
  const cadence =
    input.cadence === "WEEKLY" || input.cadence === "DAILY"
      ? input.cadence
      : "DAILY";

  const habit = await db.habit.create({
    data: {
      userId: session.user.id,
      title,
      area: input.area ?? null,
      cadence,
    },
    select: { id: true },
  });
  revalidateHabits();
  return { success: true, data: { id: habit.id } };
}

export async function archiveHabitAction(habitId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const habit = await db.habit.findFirst({
    where: { id: habitId, userId: session.user.id },
    select: { id: true },
  });
  if (!habit) return { success: false, error: "عادت پیدا نشد" };
  await db.habit.update({
    where: { id: habitId },
    data: { archivedAt: new Date() },
  });
  revalidateHabits();
  return { success: true };
}

export async function restoreHabitAction(habitId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const habit = await db.habit.findFirst({
    where: {
      id: habitId,
      userId: session.user.id,
      archivedAt: { not: null },
    },
    select: { id: true },
  });
  if (!habit) return { success: false, error: "عادت بایگانی‌شده پیدا نشد" };
  await db.habit.update({
    where: { id: habitId },
    data: { archivedAt: null },
  });
  revalidateHabits();
  return { success: true };
}

export async function updateHabitAction(input: {
  habitId: string;
  title: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان لازم است" };
  const habit = await db.habit.findFirst({
    where: { id: input.habitId, userId: session.user.id },
    select: { id: true },
  });
  if (!habit) return { success: false, error: "عادت پیدا نشد" };
  await db.habit.update({
    where: { id: input.habitId },
    data: { title },
  });
  revalidateHabits();
  return { success: true };
}

export async function deleteHabitAction(habitId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const habit = await db.habit.findFirst({
    where: { id: habitId, userId: session.user.id },
    select: { id: true },
  });
  if (!habit) return { success: false, error: "عادت پیدا نشد" };
  await db.habit.delete({ where: { id: habitId } });
  revalidateHabits();
  return { success: true };
}

export async function toggleHabitDoneAction(
  habitId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const habit = await db.habit.findFirst({
    where: { id: habitId, userId: session.user.id, archivedAt: null },
    select: {
      id: true,
      cadence: true,
    },
  });
  if (!habit) return { success: false, error: "عادت پیدا نشد" };

  const todayKey = toDateKey(new Date());
  const existing = await db.habitLog.findUnique({
    where: {
      habitId_dateKey: { habitId, dateKey: todayKey },
    },
    select: { id: true },
  });

  if (existing) {
    await db.habitLog.delete({ where: { id: existing.id } });
    const remaining = await db.habitLog.findMany({
      where: { habitId },
      select: { dateKey: true },
      orderBy: { dateKey: "asc" },
    });
    const stats = computeHabitStreaks(
      remaining.map(l => l.dateKey),
      todayKey,
      habit.cadence,
    );
    await db.habit.update({
      where: { id: habitId },
      data: {
        streak: stats.streak,
        bestStreak: stats.bestStreak,
        lastDoneDate: stats.lastDoneDate,
      },
    });
    revalidateHabits();
    return { success: true, data: { done: false } };
  }

  await db.habitLog.create({
    data: { habitId, dateKey: todayKey },
  });

  const allLogs = await db.habitLog.findMany({
    where: { habitId },
    select: { dateKey: true },
    orderBy: { dateKey: "asc" },
  });
  const stats = computeHabitStreaks(
    allLogs.map(l => l.dateKey),
    todayKey,
    habit.cadence,
  );
  await db.habit.update({
    where: { id: habitId },
    data: {
      streak: stats.streak,
      bestStreak: stats.bestStreak,
      lastDoneDate: stats.lastDoneDate,
    },
  });

  revalidateHabits();
  return { success: true, data: { done: true, streak: stats.streak } };
}
