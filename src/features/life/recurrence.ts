import { prisma as db } from "@/lib/db";
import {
  nextRecurrenceDate,
  planningStatusFromDue,
  resolvePersonalTaskPlanningStatus,
  startOfDay,
} from "@/lib/life";
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
      docs: { select: { docId: true } },
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

  // Idempotent: do not spawn a second live sibling after undo→DONE again.
  const openSibling = await db.task.findFirst({
    where: {
      recurrenceSeriesId: seriesId,
      status: { not: "DONE" },
      id: { not: taskId },
    },
    select: { id: true },
  });
  if (openSibling) return;

  // Hub pipeline stages must not be derived from due (Idea stays BACKLOG).
  const status = resolvePersonalTaskPlanningStatus(
    task.area === "PHD" || task.area === "LANG"
      ? "BACKLOG"
      : planningStatusFromDue(nextDue),
    nextDue,
    { area: task.area },
  );

  await db.$transaction(async tx => {
    const created = await tx.task.create({
      data: {
        title: task.title,
        description: task.description,
        status,
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
      select: { id: true },
    });

    // Move DocTask links to the live occurrence so research continuity follows.
    if (task.docs.length > 0) {
      await tx.docTask.deleteMany({
        where: {
          taskId,
          docId: { in: task.docs.map(link => link.docId) },
        },
      });
      await tx.docTask.createMany({
        data: task.docs.map(link => ({
          docId: link.docId,
          taskId: created.id,
        })),
        skipDuplicates: true,
      });
    }
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
      area: true,
      waitingOn: true,
    },
  });
  if (!task) return { ok: false, error: "کار پیدا نشد" };
  if (task.recurrence === "NONE") {
    return { ok: false, error: "این کار تکراری نیست" };
  }
  if (
    task.assignedToId !== userId &&
    !(task.createdById === userId && task.assignedToId == null)
  ) {
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

  const status = resolvePersonalTaskPlanningStatus(task.status, nextDue, {
    area: task.area,
    waitingOn: task.waitingOn,
  });

  await db.task.update({
    where: { id: taskId },
    data: { dueDate: nextDue, status },
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
  if (
    task.assignedToId !== userId &&
    !(task.createdById === userId && task.assignedToId == null)
  ) {
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
        AND: [
          { recurrenceSeriesId: seriesId },
          { status: { not: "DONE" } },
          {
            OR: [
              { assignedToId: userId },
              { createdById: userId, assignedToId: null },
            ],
          },
        ],
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
  if (
    task.assignedToId !== userId &&
    !(task.createdById === userId && task.assignedToId == null)
  ) {
    return { ok: false, error: "اجازه ندارید" };
  }

  if (applyToSeries && task.recurrenceSeriesId) {
    await db.task.updateMany({
      where: {
        AND: [
          { recurrenceSeriesId: task.recurrenceSeriesId },
          { status: { not: "DONE" } },
          {
            OR: [
              { assignedToId: userId },
              { createdById: userId, assignedToId: null },
            ],
          },
        ],
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
