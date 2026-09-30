"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { skipRecurrenceOccurrence, stopRecurrenceSeries, updateRecurrenceSeries, newRecurrenceSeriesId } from "@/features/life/recurrence";
import {
  addDays,
  dueFromWallClock,
  endOfDay,
  endOfWeek,
  moveDueToDay,
  parseLocalDate,
  planningStatusFromDue,
  resolveBoardPlanningStatus,
  startOfDay,
  toDateKey,
  withDateOnly,
} from "@/lib/life";
import type { LifeArea, RecurrenceInterval } from "@/types/db";
import { ensurePersonalWorkspace, projectIdForArea } from "./workspace";
import { getCalendarTasks } from "./queries";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import {
  FOCUS_SLOT_COUNT,
  isTodayFocusCandidate,
  normalizeFocusSlots,
  serializeFocusSlots,
} from "@/features/life/focus-slots";
import { personalTaskOwnership, canAccessPersonalTask } from "@/lib/task-access";

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

function resolveDue(
  dateKey?: string,
  time?: string | null,
  /** `Date#getTimezoneOffset()` from the client; keeps wall clock on UTC servers. */
  timezoneOffsetMinutes?: number,
): Date | null {
  if (!dateKey) return null;
  const hasOffset =
    typeof timezoneOffsetMinutes === "number" &&
    Number.isFinite(timezoneOffsetMinutes);
  if (time && /^(\d{2}):(\d{2})$/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);
    if (hours! <= 23 && minutes! <= 59) {
      if (hasOffset) {
        return dueFromWallClock(dateKey, hours!, minutes!, timezoneOffsetMinutes!);
      }
      const due = parseLocalDate(dateKey);
      due.setHours(hours!, minutes!, 0, 0);
      return due;
    }
  }
  // Date-only → local noon sentinel in the caller's TZ (not the server's).
  if (hasOffset) {
    return dueFromWallClock(dateKey, 12, 0, timezoneOffsetMinutes!);
  }
  return parseLocalDate(dateKey);
}

export async function quickCapture(input: {
  title: string;
  area?: LifeArea;
  recurrence?: RecurrenceInterval;
  dueDate?: string;
  time?: string | null;
  durationMinutes?: number | null;
  timezoneOffsetMinutes?: number;
}): Promise<ActionResult & { data?: { id: string } }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان خالی است" };

  const { teamId } = await ensurePersonalWorkspace(session.user.id);
  const area = input.area ?? "LIFE";
  const projectId = projectIdForArea(session.user.id, area);

  const recurrence = input.recurrence ?? "NONE";
  const due = resolveDue(input.dueDate, input.time, input.timezoneOffsetMinutes);
  const durationMinutes =
    due && input.time && input.durationMinutes && input.durationMinutes > 0
      ? Math.min(24 * 60, Math.round(input.durationMinutes))
      : null;
  const task = await db.task.create({
    data: {
      title,
      status: planningStatusFromDue(due),
      priority: "NONE",
      type: "TASK",
      area,
      recurrence,
      recurrenceSeriesId:
        recurrence !== "NONE" ? newRecurrenceSeriesId() : null,
      dueDate: due,
      durationMinutes,
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
  // Same status path as board/drawer so Done lands in Kanban «تمام» and stays DONE.
  const { updateTaskStatus } = await import("@/features/tasks/actions");
  const result = await updateTaskStatus(taskId, "DONE");
  if (result.success) revalidateLife(["/research"]);
  return result;
}

export async function planTaskThisWeek(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: { dueDate: true, durationMinutes: true },
  });
  if (!existing) return { success: false, error: "کار پیدا نشد" };

  const weekEnd = endOfWeek(new Date());
  const dueDate = moveDueToDay(
    existing.dueDate,
    toDateKey(weekEnd),
    existing.durationMinutes,
  );

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

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      assignedToId: true,
      createdById: true,
      dueDate: true,
      durationMinutes: true,
    },
  });
  if (!existing) return { success: false, error: "کار پیدا نشد" };

  const allowed =
    session.user.role === "ADMIN" ||
    existing.assignedToId === session.user.id ||
    existing.createdById === session.user.id;
  if (!allowed) return { success: false, error: "اجازه ویرایش ندارید" };

  const dueDate = moveDueToDay(
    existing.dueDate,
    toDateKey(new Date()),
    existing.durationMinutes,
  );

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
  const todayKey = toDateKey(todayStart);

  const mine = {
    OR: [
      { assignedToId: session.user.id },
      { createdById: session.user.id, assignedToId: null },
    ],
  };

  const rows = await db.task.findMany({
    where: {
      ...mine,
      ...taskWhereExcludeHub(),
      status: { not: "DONE" },
      dueDate: { gte: yesterdayStart, lte: yesterdayEnd },
    },
    select: { id: true, dueDate: true, durationMinutes: true },
  });

  for (const row of rows) {
    await db.task.update({
      where: { id: row.id },
      data: {
        status: "TODO",
        dueDate: moveDueToDay(row.dueDate, todayKey, row.durationMinutes),
      },
    });
  }

  revalidateLife();
  return { success: true, data: { moved: rows.length } };
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
      AND: [{ id: { in: ids } }, personalTaskOwnership(userId)],
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
  time?: string | null,
  dueAtIso?: string | null,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateKey)) {
    return { success: false, error: "تاریخ نامعتبر است" };
  }

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: {
      assignedToId: true,
      createdById: true,
      dueDate: true,
      durationMinutes: true,
      status: true,
    },
  });
  if (!existing) return { success: false, error: "کار پیدا نشد" };

  if (
    !canAccessPersonalTask(session.user.id, session.user.role, existing)
  ) {
    return { success: false, error: "اجازه ویرایش ندارید" };
  }

  let nextDue: Date;
  if (dueAtIso) {
    nextDue = new Date(dueAtIso);
    if (Number.isNaN(nextDue.getTime())) {
      return { success: false, error: "تاریخ نامعتبر است" };
    }
  } else if (time && /^(\d{2}):(\d{2})$/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);
    nextDue = parseLocalDate(dueDateKey);
    nextDue.setHours(hours!, minutes!, 0, 0);
  } else if (time === "") {
    nextDue = withDateOnly(parseLocalDate(dueDateKey));
  } else {
    nextDue = moveDueToDay(
      existing.dueDate,
      dueDateKey,
      existing.durationMinutes,
    );
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      dueDate: nextDue,
      ...(time === "" ? { durationMinutes: null } : {}),
      status: resolveBoardPlanningStatus(existing.status, nextDue),
    },
  });

  revalidateLife();
  return { success: true };
}

/** Set exact clock and/or duration (week/day grid drag + resize). */
export async function rescheduleTaskSchedule(
  taskId: string,
  input: {
    dueDateKey: string;
    time: string;
    /** Client-local instant (ISO). Preferred so UTC servers keep the wall clock. */
    dueAtIso?: string;
    durationMinutes?: number | null;
  },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDateKey)) {
    return { success: false, error: "تاریخ نامعتبر است" };
  }
  if (!/^(\d{2}):(\d{2})$/.test(input.time)) {
    return { success: false, error: "ساعت نامعتبر است" };
  }

  const existing = await db.task.findUnique({
    where: { id: taskId },
    select: { assignedToId: true, createdById: true, status: true },
  });
  if (!existing) return { success: false, error: "کار پیدا نشد" };

  if (
    !canAccessPersonalTask(session.user.id, session.user.role, existing)
  ) {
    return { success: false, error: "اجازه ویرایش ندارید" };
  }

  let nextDue: Date;
  if (input.dueAtIso) {
    nextDue = new Date(input.dueAtIso);
    if (Number.isNaN(nextDue.getTime())) {
      return { success: false, error: "تاریخ نامعتبر است" };
    }
  } else {
    const [hours, minutes] = input.time.split(":").map(Number);
    nextDue = parseLocalDate(input.dueDateKey);
    nextDue.setHours(hours!, minutes!, 0, 0);
  }

  let durationMinutes: number | null | undefined = input.durationMinutes;
  if (durationMinutes !== undefined && durationMinutes !== null) {
    if (durationMinutes <= 0) durationMinutes = null;
    else durationMinutes = Math.min(24 * 60, Math.round(durationMinutes));
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      dueDate: nextDue,
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      status: resolveBoardPlanningStatus(existing.status, nextDue),
    },
  });

  revalidateLife();
  return { success: true };
}

/**
 * Align Inbox ↔ This Week from due dates for personal (non-hub) tasks only.
 * PhD / Language pipeline stages are never remapped by due date.
 * Far-dated This Week cards with a due after this week go back to Inbox.
 * Legacy scrum columns (Feedback / Testing / Waiting) fold into In Progress.
 * Does not touch undated This Week cards (manual plan).
 */
export async function syncPlanningStatusesForUser(userId: string): Promise<void> {
  if (!userId) return;
  const weekEnd = endOfWeek(new Date());
  const mine = {
    OR: [
      { assignedToId: userId },
      { createdById: userId, assignedToId: null },
    ],
  };
  const lifeOnly = { AND: [mine, taskWhereExcludeHub()] };

  async function updateIfAny(
    where: Parameters<typeof db.task.updateMany>[0]["where"],
    data: Parameters<typeof db.task.updateMany>[0]["data"],
  ) {
    const hit = await db.task.findFirst({ where, select: { id: true } });
    if (!hit) return;
    await db.task.updateMany({ where, data });
  }

  await Promise.all([
    updateIfAny(
      {
        AND: [
          mine,
          { status: { in: ["REVIEW", "TESTING", "BLOCKED"] } },
        ],
      },
      { status: "IN_PROGRESS" },
    ),
    updateIfAny(
      {
        AND: [
          lifeOnly,
          { status: "BACKLOG" },
          { waitingOn: false },
          { dueDate: { not: null, lte: weekEnd } },
        ],
      },
      { status: "TODO" },
    ),
    updateIfAny(
      {
        AND: [
          lifeOnly,
          { status: "TODO" },
          { dueDate: { gt: weekEnd } },
        ],
      },
      { status: "BACKLOG" },
    ),
    // Waiting follow-ups stay parked in Inbox until cleared.
    updateIfAny(
      {
        AND: [
          lifeOnly,
          { waitingOn: true },
          { status: { in: ["TODO"] } },
        ],
      },
      { status: "BACKLOG" },
    ),
  ]);
}
