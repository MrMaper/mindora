"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { toDateKey } from "@/lib/life";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { computeHabitStreaks } from "@/features/habits/streaks";
import {
  getHabitHeatmapForUser,
  listHabitsForUser,
  type HabitHeatDay,
  type HabitItem,
} from "@/features/habits/queries";

export type { HabitHeatDay, HabitItem };

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
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
  return listHabitsForUser(session.user.id, input);
}

export async function getHabitHeatmapAction(input?: {
  habitId?: string | null;
  weeks?: number;
}): Promise<HabitHeatDay[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getHabitHeatmapForUser(session.user.id, input);
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
  area?: LifeArea | null;
  cadence?: RecurrenceInterval;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان لازم است" };
  const habit = await db.habit.findFirst({
    where: { id: input.habitId, userId: session.user.id },
    select: { id: true, cadence: true },
  });
  if (!habit) return { success: false, error: "عادت پیدا نشد" };

  const cadence =
    input.cadence === "WEEKLY" || input.cadence === "DAILY"
      ? input.cadence
      : undefined;
  let area: LifeArea | null | undefined = undefined;
  if (input.area !== undefined) {
    area =
      input.area === "PHD" ||
      input.area === "WORK" ||
      input.area === "LIFE" ||
      input.area === "LANG"
        ? input.area
        : null;
  }

  const data: {
    title: string;
    cadence?: RecurrenceInterval;
    area?: LifeArea | null;
    streak?: number;
    bestStreak?: number;
  } = { title };
  if (cadence) data.cadence = cadence;
  if (area !== undefined) data.area = area;

  if (cadence && cadence !== habit.cadence) {
    const todayKey = toDateKey(new Date());
    const logs = await db.habitLog.findMany({
      where: { habitId: input.habitId },
      select: { dateKey: true },
      orderBy: { dateKey: "asc" },
    });
    const stats = computeHabitStreaks(
      logs.map(l => l.dateKey),
      todayKey,
      cadence,
    );
    data.streak = stats.streak;
    data.bestStreak = stats.bestStreak;
  }

  await db.habit.update({
    where: { id: input.habitId },
    data,
  });
  revalidateHabits();
  return {
    success: true,
    data: {
      streak: data.streak,
      bestStreak: data.bestStreak,
    },
  };
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
    return {
      success: true,
      data: {
        done: false,
        streak: stats.streak,
        bestStreak: stats.bestStreak,
      },
    };
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
  return {
    success: true,
    data: {
      done: true,
      streak: stats.streak,
      bestStreak: stats.bestStreak,
    },
  };
}
