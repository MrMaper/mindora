import { prisma as db } from "@/lib/db";
import { spawnNextIfRecurring } from "@/features/life/recurrence";
import { canAccessPersonalTask } from "@/lib/task-access";
import type { TaskStatus } from "@/types/db";
import { completedAtWrite } from "@/features/tasks/completed-at";

export type ApplyStatusResult =
  | {
      ok: true;
      changed: boolean;
      previousStatus: TaskStatus;
      nextStatus: TaskStatus;
      title: string;
      assignedToId: string | null;
      area: string | null;
    }
  | { ok: false; error: string };

/**
 * Shared status write for Today «تمام», focus slots, board, and drawer.
 * Not a server action — call only from authenticated server actions.
 * Research sync + notifications stay in the caller.
 */
export async function applyTaskStatusChange(input: {
  taskId: string;
  userId: string;
  role: string | undefined;
  status: TaskStatus;
}): Promise<ApplyStatusResult> {
  const existing = await db.task.findUnique({
    where: { id: input.taskId },
    select: {
      status: true,
      title: true,
      assignedToId: true,
      createdById: true,
      waitingOn: true,
      area: true,
      project: { select: { area: true } },
    },
  });
  if (!existing) return { ok: false, error: "کار پیدا نشد" };

  if (!canAccessPersonalTask(input.userId, input.role, existing)) {
    return { ok: false, error: "به این کار دسترسی ندارید" };
  }

  let nextStatus: TaskStatus = input.status;
  if (
    existing.waitingOn &&
    nextStatus !== "DONE" &&
    nextStatus !== "IN_PROGRESS"
  ) {
    nextStatus = "BACKLOG";
  }

  const area = existing.area ?? existing.project?.area ?? null;

  if (existing.status === nextStatus) {
    return {
      ok: true,
      changed: false,
      previousStatus: existing.status,
      nextStatus,
      title: existing.title,
      assignedToId: existing.assignedToId,
      area,
    };
  }

  await db.task.update({
    where: { id: input.taskId },
    data: {
      status: nextStatus,
      ...(nextStatus === "DONE" ? { waitingOn: false } : {}),
      ...(completedAtWrite(existing.status, nextStatus) ?? {}),
    },
  });

  try {
    await db.activityLog.create({
      data: {
        entity: "task",
        entityId: input.taskId,
        action: "status_changed",
        performedBy: input.userId,
        oldValue: { status: existing.status },
        newValue: { status: nextStatus },
      },
    });
  } catch (error) {
    console.error("activityLog after status change failed", error);
  }

  if (nextStatus === "DONE") {
    try {
      await spawnNextIfRecurring(input.taskId, input.userId);
    } catch (error) {
      console.error("spawnNextIfRecurring after DONE failed", error);
    }
  }

  return {
    ok: true,
    changed: true,
    previousStatus: existing.status,
    nextStatus,
    title: existing.title,
    assignedToId: existing.assignedToId,
    area,
  };
}
