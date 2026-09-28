import { prisma as db } from "@/lib/db";
import { nextRecurrenceDate, startOfDay } from "@/lib/life";
import type { RecurrenceInterval } from "@/types/db";
import { randomUUID } from "crypto";

export function newRecurrenceSeriesId(): string {
  return randomUUID();
}

function endsBeforeOrOn(
  due: Date | null,
  endsAt: Date | null | undefined,
): boolean {
  if (!due || !endsAt) return false;
  return startOfDay(due).getTime() > startOfDay(endsAt).getTime();
}

export async function spawnNextIfRecurring(taskId: string, userId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      title: true,
      description: true,
      priority: true,
      type: true,
      area: true,
      recurrence: true,
      recurrenceSeriesId: true,
      recurrenceEndsAt: true,
      dueDate: true,
      durationMinutes: true,
      projectId: true,
      teamId: true,
    },
  });
  if (!task || task.recurrence === "NONE") return;

  const nextDue = nextRecurrenceDate(task.dueDate, task.recurrence);
  if (!nextDue) return;
  if (endsBeforeOrOn(nextDue, task.recurrenceEndsAt)) return;

  const seriesId = task.recurrenceSeriesId ?? newRecurrenceSeriesId();
  if (!task.recurrenceSeriesId) {
    await db.task.update({
      where: { id: taskId },
      data: { recurrenceSeriesId: seriesId },
    });
  }

  await db.task.create({
    data: {
      title: task.title,
      description: task.description,
      status: "TODO",
      priority: task.priority,
      type: task.type,
      area: task.area,
      recurrence: task.recurrence,
      recurrenceSeriesId: seriesId,
      recurrenceEndsAt: task.recurrenceEndsAt,
      dueDate: nextDue,
      durationMinutes: task.durationMinutes,
      projectId: task.projectId,
      teamId: task.teamId,
      createdById: userId,
      assignedToId: userId,
    },
  });
}

export async function skipRecurrenceOccurrence(
  taskId: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      recurrence: true,
      recurrenceEndsAt: true,
      dueDate: true,
      assignedToId: true,
      createdById: true,
      status: true,
    },
  });
  if (!task) return { ok: false, error: "کار پیدا نشد" };
  if (task.recurrence === "NONE") {
    return { ok: false, error: "این کار تکراری نیست" };
  }
  if (task.assignedToId !== userId && task.createdById !== userId) {
    return { ok: false, error: "اجازه ندارید" };
  }
  if (task.status === "DONE") {
    return { ok: false, error: "کار تمام‌شده را نمی‌توان رد کرد" };
  }

  const nextDue = nextRecurrenceDate(task.dueDate, task.recurrence);
  if (!nextDue || endsBeforeOrOn(nextDue, task.recurrenceEndsAt)) {
    await db.task.update({
      where: { id: taskId },
      data: { recurrence: "NONE", recurrenceEndsAt: null },
    });
    return { ok: true };
  }

  await db.task.update({
    where: { id: taskId },
    data: { dueDate: nextDue },
  });
  return { ok: true };
}

export async function updateRecurrenceSeries(
  taskId: string,
  userId: string,
  input: {
    recurrence: RecurrenceInterval;
    recurrenceEndsAt?: string | null;
    applyToSeries?: boolean;
  },
): Promise<{ ok: boolean; error?: string }> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      recurrenceSeriesId: true,
      assignedToId: true,
      createdById: true,
      recurrence: true,
    },
  });
  if (!task) return { ok: false, error: "کار پیدا نشد" };
  if (task.assignedToId !== userId && task.createdById !== userId) {
    return { ok: false, error: "اجازه ندارید" };
  }

  let endsAt: Date | null = null;
  if (input.recurrenceEndsAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.recurrenceEndsAt)) {
      return { ok: false, error: "تاریخ پایان نامعتبر است" };
    }
    const [y, m, d] = input.recurrenceEndsAt.split("-").map(Number);
    endsAt = new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  const seriesId =
    task.recurrenceSeriesId ??
    (input.recurrence !== "NONE" ? newRecurrenceSeriesId() : null);

  const data = {
    recurrence: input.recurrence,
    recurrenceEndsAt: input.recurrence === "NONE" ? null : endsAt,
    recurrenceSeriesId:
      input.recurrence === "NONE" ? task.recurrenceSeriesId : seriesId,
  };

  if (
    input.applyToSeries &&
    seriesId &&
    input.recurrence !== "NONE"
  ) {
    await db.task.updateMany({
      where: {
        recurrenceSeriesId: seriesId,
        status: { not: "DONE" },
      },
      data,
    });
  } else {
    await db.task.update({ where: { id: taskId }, data });
  }

  return { ok: true };
}

export async function stopRecurrenceSeries(
  taskId: string,
  userId: string,
  applyToSeries = true,
): Promise<{ ok: boolean; error?: string }> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      recurrenceSeriesId: true,
      assignedToId: true,
      createdById: true,
    },
  });
  if (!task) return { ok: false, error: "کار پیدا نشد" };
  if (task.assignedToId !== userId && task.createdById !== userId) {
    return { ok: false, error: "اجازه ندارید" };
  }

  if (applyToSeries && task.recurrenceSeriesId) {
    await db.task.updateMany({
      where: {
        recurrenceSeriesId: task.recurrenceSeriesId,
        status: { not: "DONE" },
      },
      data: { recurrence: "NONE", recurrenceEndsAt: null },
    });
  } else {
    await db.task.update({
      where: { id: taskId },
      data: { recurrence: "NONE", recurrenceEndsAt: null },
    });
  }
  return { ok: true };
}
