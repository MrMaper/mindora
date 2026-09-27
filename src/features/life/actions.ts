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
import { isHubArea, taskWhereExcludeHub } from "@/lib/project-namespace";
import {
  FOCUS_SLOT_COUNT,
  isTodayFocusCandidate,
  normalizeFocusSlots,
  serializeFocusSlots,
} from "@/features/life/focus-slots";

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

function resolveDue(dateKey?: string, time?: string | null): Date | null {
  if (!dateKey) return null;
  const due = parseLocalDate(dateKey);
  if (time && /^(\d{2}):(\d{2})$/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);
    if (hours <= 23 && minutes <= 59) due.setHours(hours, minutes, 0, 0);
  }
  return due;
}

export async function quickCapture(input: {
  title: string;
  area?: LifeArea;
  recurrence?: RecurrenceInterval;
  dueDate?: string;
  time?: string | null;
}): Promise<ActionResult & { data?: { id: string } }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان خالی است" };

  const { teamId } = await ensurePersonalWorkspace(session.user.id);
  const area = input.area ?? "LIFE";
  const projectId = projectIdForArea(session.user.id, area);

  const recurrence = input.recurrence ?? "NONE";
  const due = resolveDue(input.dueDate, input.time);
  const task = await db.task.create({
    data: {
      title,
      status: due ? "TODO" : "BACKLOG",
      priority: "NONE",
      type: "TASK",
      area,
      recurrence,
      recurrenceSeriesId:
        recurrence !== "NONE" ? newRecurrenceSeriesId() : null,
      dueDate: due,
      projectId,
      teamId,
      createdById: session.user.id,
      assignedToId: session.user.id,
    },
    select: { id: true },
  });

  revalidateLife();
  return { success: true, data: { id: task.id } };
}

export async function completePersonalTask(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };

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
  if (!existing) return { success: false, error: "کار پیدا نشد" };

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

async function readFocusSlots(userId: string): Promise<(string | null)[]> {
  const todayKey = toDateKey(new Date());
  const prefs = await db.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      todayFocusDate: todayKey,
      todayFocusIds: [],
    },
    update: {},
    select: { todayFocusDate: true, todayFocusIds: true },
  });
  if (prefs.todayFocusDate !== todayKey) return [null, null, null];
  return normalizeFocusSlots(prefs.todayFocusIds);
}

async function writeFocusSlots(userId: string, slots: (string | null)[]) {
  const todayKey = toDateKey(new Date());
  const todayFocusIds = serializeFocusSlots(slots);
  await db.userPreferences.update({
    where: { userId },
    data: { todayFocusDate: todayKey, todayFocusIds },
  });
}

async function loadOwnedTasks(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db.task.findMany({
    where: {
      id: { in: ids },
      OR: [
        { assignedToId: userId },
        { createdById: userId, assignedToId: null },
      ],
    },
    select: {
      id: true,
      status: true,
      dueDate: true,
      area: true,
      project: { select: { area: true } },
    },
  });
}

function canAddToTodayFocus(
  task: {
    status: string;
    dueDate: Date | null;
    area: LifeArea | null;
    project: { area: LifeArea | null } | null;
  },
  todayKey: string,
) {
  if (isHubArea(task.area) || isHubArea(task.project?.area)) return false;
  return isTodayFocusCandidate(task, todayKey);
}

export async function setTodayFocus(ids: string[]): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") {
    return { success: false, error: "اولویت امروز برای فضای شخصی است" };
  }

  const slots = normalizeFocusSlots(ids.slice(0, FOCUS_SLOT_COUNT));
  const real = slots.filter((id): id is string => !!id);
  if (new Set(real).size !== real.length) {
    return { success: false, error: "هر کار فقط در یک اولویت می‌نشیند" };
  }

  const previous = await readFocusSlots(session.user.id);
  const kept = new Set(previous.filter((id): id is string => !!id));
  const added = real.filter(id => !kept.has(id));
  const owned = await loadOwnedTasks(session.user.id, real);
  if (owned.length !== new Set(real).size) {
    return { success: false, error: "کار پیدا نشد" };
  }
  const todayKey = toDateKey(startOfDay());
  const ownedById = new Map(owned.map(task => [task.id, task]));
  if (added.some(id => !canAddToTodayFocus(ownedById.get(id)!, todayKey))) {
    return { success: false, error: "فقط کار عقب‌افتاده، کار امروز، یا کار بدون زمان را می‌توان اولویت کرد" };
  }

  await writeFocusSlots(session.user.id, slots);
  revalidateLife();
  return { success: true };
}

export async function toggleTodayFocus(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const slots = await readFocusSlots(session.user.id);
  const existing = slots.indexOf(taskId);
  if (existing >= 0) {
    slots[existing] = null;
  } else {
    const [task] = await loadOwnedTasks(session.user.id, [taskId]);
    if (!task) return { success: false, error: "کار پیدا نشد" };
    if (!canAddToTodayFocus(task, toDateKey(startOfDay()))) {
      return { success: false, error: "فقط کار عقب‌افتاده، کار امروز، یا کار بدون زمان را می‌توان اولویت کرد" };
    }
    const hole = slots.indexOf(null);
    if (hole < 0) {
      return { success: false, error: "حداکثر ۳ اولویت برای امروز" };
    }
    slots[hole] = taskId;
  }

  await writeFocusSlots(session.user.id, slots);
  revalidateLife();
  return { success: true };
}

export async function logFocusSession(input: {
  taskId: string;
  minutes: number;
}): Promise<ActionResult & { data?: { hours: number } }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") {
    return { success: false, error: "جلسه تمرکز برای فضای شخصی است" };
  }

  const minutes = Math.round(input.minutes);
  if (minutes < 1) return { success: true, data: { hours: 0 } };
  if (minutes > 180) return { success: false, error: "جلسه طولانی‌تر از ۳ ساعت نیست" };

  const task = await db.task.findFirst({
    where: {
      id: input.taskId,
      OR: [
        { assignedToId: session.user.id },
        { createdById: session.user.id, assignedToId: null },
      ],
    },
    select: { id: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };

  const hours = Math.round((minutes / 60) * 100) / 100;
  const workLog = await db.workLog.create({
    data: {
      taskId: task.id,
      userId: session.user.id,
      hours,
      date: parseLocalDate(toDateKey(new Date())),
      description: "جلسه تمرکز",
    },
  });

  await db.activityLog.create({
    data: {
      entity: "work_log",
      entityId: workLog.id,
      action: "created",
      performedBy: session.user.id,
      newValue: { hours, description: "جلسه تمرکز" },
    },
  });

  revalidateLife(["/work-logs", "/reporting"]);
  return { success: true, data: { hours } };
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
  if (!existing) return { success: false, error: "کار پیدا نشد" };

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
