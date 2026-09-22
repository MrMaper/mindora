"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { spawnNextIfRecurring, skipRecurrenceOccurrence, stopRecurrenceSeries, updateRecurrenceSeries, newRecurrenceSeriesId } from "@/features/life/recurrence";
import {
  addDays,
  endOfDay,
  endOfWeek,
  parseLocalDate,
  startOfDay,
  toDateKey,
} from "@/lib/life";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { ensurePersonalWorkspace, projectIdForArea } from "./workspace";
import { getCalendarTasks } from "./queries";
import { taskWhereExcludeHub } from "@/lib/project-namespace";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Only surfaces that show life tasks / habits — avoid blanket research/work-logs. */
function revalidateLife(extra: string[] = []) {
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/kanban");
  revalidatePath("/review");
  for (const path of extra) revalidatePath(path);
}

export async function loadCalendarRange(fromIso: string, toIso: string) {
  const session = await auth();
  if (!session?.user) return [];
  return getCalendarTasks(session.user.id, new Date(fromIso), new Date(toIso));
}

export async function quickCapture(input: {
  title: string;
  area?: LifeArea;
  recurrence?: RecurrenceInterval;
  dueDate?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان خالی است" };

  const { teamId } = await ensurePersonalWorkspace(session.user.id);
  const area = input.area ?? "LIFE";
  const projectId = projectIdForArea(area);

  const recurrence = input.recurrence ?? "NONE";
  await db.task.create({
    data: {
      title,
      status: input.dueDate ? "TODO" : "BACKLOG",
      priority: "NONE",
      type: "TASK",
      area,
      recurrence,
      recurrenceSeriesId:
        recurrence !== "NONE" ? newRecurrenceSeriesId() : null,
      dueDate: input.dueDate ? parseLocalDate(input.dueDate) : null,
      projectId,
      teamId,
      createdById: session.user.id,
      assignedToId: session.user.id,
    },
  });

  revalidateLife();
  return { success: true };
}

export async function completePersonalTask(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  });
  if (!task) return { success: false, error: "تسک یافت نشد" };

  await db.task.update({
    where: { id: taskId },
    data: { status: "DONE" },
  });

  await spawnNextIfRecurring(taskId, session.user.id);

  revalidateLife();
  return { success: true };
}

export async function planTaskThisWeek(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const weekEnd = endOfWeek(new Date());
  const dueDate = parseLocalDate(toDateKey(weekEnd));

  await db.task.update({
    where: { id: taskId },
    data: {
      status: "TODO",
      dueDate,
    },
  });

  revalidateLife();
  return { success: true };
}

export async function planTaskForToday(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const dueDate = parseLocalDate(toDateKey(new Date()));
  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, assignedToId: true, createdById: true },
  });
  if (!existing) return { success: false, error: "تسک یافت نشد" };

  const allowed =
    session.user.role === "ADMIN" ||
    existing.assignedToId === session.user.id ||
    existing.createdById === session.user.id;
  if (!allowed) return { success: false, error: "اجازه ویرایش ندارید" };

  await db.task.update({
    where: { id: taskId },
    data: { status: "TODO", dueDate },
  });

  revalidateLife();
  return { success: true };
}

export async function moveYesterdayToToday(): Promise<ActionResult & { data?: { moved: number } }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const todayStart = startOfDay();
  const yesterdayStart = addDays(todayStart, -1);
  const yesterdayEnd = endOfDay(yesterdayStart);
  const dueDate = parseLocalDate(toDateKey(todayStart));

  const mine = {
    OR: [
      { assignedToId: session.user.id },
      { createdById: session.user.id, assignedToId: null },
    ],
  };

  const result = await db.task.updateMany({
    where: {
      ...mine,
      ...taskWhereExcludeHub(),
      status: { not: "DONE" },
      dueDate: { gte: yesterdayStart, lte: yesterdayEnd },
    },
    data: { status: "TODO", dueDate },
  });

  revalidateLife();
  return { success: true, data: { moved: result.count } };
}

const MAX_FOCUS = 3;

export async function toggleTodayFocus(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const todayKey = toDateKey(new Date());
  const prefs = await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      todayFocusDate: todayKey,
      todayFocusIds: [],
    },
    update: {},
    select: { todayFocusDate: true, todayFocusIds: true },
  });

  let ids =
    prefs.todayFocusDate === todayKey ? [...prefs.todayFocusIds] : [];

  if (ids.includes(taskId)) {
    ids = ids.filter(id => id !== taskId);
  } else {
    if (ids.length >= MAX_FOCUS) {
      return { success: false, error: "حداکثر ۳ اولویت برای امروز" };
    }
    ids.push(taskId);
  }

  await db.userPreferences.update({
    where: { userId: session.user.id },
    data: { todayFocusDate: todayKey, todayFocusIds: ids },
  });

  revalidateLife();
  return { success: true };
}

export async function stopTaskRecurrence(
  taskId: string,
  applyToSeries = true,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const result = await stopRecurrenceSeries(
    taskId,
    session.user.id,
    applyToSeries,
  );
  if (!result.ok) return { success: false, error: result.error };

  revalidateLife();
  return { success: true };
}

export async function skipTaskRecurrence(
  taskId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const result = await skipRecurrenceOccurrence(taskId, session.user.id);
  if (!result.ok) return { success: false, error: result.error };

  revalidateLife();
  return { success: true };
}

export async function updateTaskRecurrenceSeriesAction(input: {
  taskId: string;
  recurrence: RecurrenceInterval;
  recurrenceEndsAt?: string | null;
  applyToSeries?: boolean;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const result = await updateRecurrenceSeries(input.taskId, session.user.id, {
    recurrence: input.recurrence,
    recurrenceEndsAt: input.recurrenceEndsAt,
    applyToSeries: input.applyToSeries ?? true,
  });
  if (!result.ok) return { success: false, error: result.error };

  revalidateLife();
  return { success: true };
}

export async function rescheduleTaskDueDate(
  taskId: string,
  dueDateKey: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateKey)) {
    return { success: false, error: "تاریخ نامعتبر است" };
  }

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: { assignedToId: true, dueDate: true },
  });
  if (!existing) return { success: false, error: "تسک یافت نشد" };

  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return { success: false, error: "اجازه ویرایش ندارید" };
  }

  const nextDue = parseLocalDate(dueDateKey);
  await db.task.update({
    where: { id: taskId },
    data: { dueDate: nextDue },
  });

  revalidateLife();
  return { success: true };
}
