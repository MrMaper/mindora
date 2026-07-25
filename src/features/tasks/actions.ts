"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/schemas/tasks";
import { getTaskById } from "./queries";
import { notify } from "@/lib/notify";
import type { TaskDetail } from "./types";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

function parseLabelIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

async function logActivity(opts: {
  entityId: string;
  action: string;
  performedBy: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await db.activityLog.create({
    data: {
      entity: "task",
      entityId: opts.entityId,
      action: opts.action,
      performedBy: opts.performedBy,
      oldValue: opts.oldValue === undefined ? undefined : (opts.oldValue as object),
      newValue: opts.newValue === undefined ? undefined : (opts.newValue as object),
    },
  });
}

// ─── Create task ────────────────────────────────────────────────────────

export async function createTask(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const parsed = createTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Get user's first team (default team)
  const membership = await db.teamMember.findFirst({
    where: { userId: session.user.id },
    select: { teamId: true },
  });
  if (!membership) return { success: false, error: "User is not a member of any team." };

  const labelIds = parseLabelIds(parsed.data.labelIds);

  const task = await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      type: parsed.data.type,
      assignedToId: parsed.data.assignedToId || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      createdById: session.user.id,
      teamId: membership.teamId,
      labels: { create: labelIds.map(labelId => ({ labelId })) },
    },
  });

  await logActivity({
    entityId: task.id,
    action: "created",
    performedBy: session.user.id,
    newValue: { title: task.title, status: task.status, priority: task.priority },
  });

  if (task.assignedToId && task.assignedToId !== session.user.id) {
    await notify({
      userId: task.assignedToId,
      type: "TASK_ASSIGNED",
      title: `You were assigned to "${task.title}"`,
      data: { taskId: task.id },
    });
  }

  revalidatePath("/tasks");
  return { success: true, data: { id: task.id } };
}

// ─── Update task ────────────────────────────────────────────────────────

export async function updateTask(id: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const existing = await db.task.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      assignedToId: true,
      dueDate: true,
      labels: { select: { labelId: true } },
    },
  });
  if (!existing) return { success: false, error: "Task not found." };

  // Authorization: only admin or assignee can edit
  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return { success: false, error: "Only the assignee or an admin can edit this task." };
  }

  const labelIds = parseLabelIds(parsed.data.labelIds);
  const nextDueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  const nextAssignedToId = parsed.data.assignedToId || null;

  await db.task.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      type: parsed.data.type,
      assignedToId: nextAssignedToId,
      dueDate: nextDueDate,
      labels: {
        deleteMany: {},
        create: labelIds.map(labelId => ({ labelId })),
      },
    },
  });

  const assigneeChanged = (existing.assignedToId ?? null) !== nextAssignedToId;
  const statusChanged = existing.status !== parsed.data.status;
  const dueDateChanged = (existing.dueDate?.getTime() ?? null) !== (nextDueDate?.getTime() ?? null);

  if (statusChanged) {
    await logActivity({
      entityId: id,
      action: "status_changed",
      performedBy: session.user.id,
      oldValue: { status: existing.status },
      newValue: { status: parsed.data.status },
    });
  }

  if (assigneeChanged) {
    await logActivity({
      entityId: id,
      action: "assigned",
      performedBy: session.user.id,
      oldValue: { assignedToId: existing.assignedToId },
      newValue: { assignedToId: nextAssignedToId },
    });
  }

  // ─── Notifications ──────────────────────────────────────────────
  if (assigneeChanged && nextAssignedToId && nextAssignedToId !== session.user.id) {
    await notify({
      userId: nextAssignedToId,
      type: "TASK_ASSIGNED",
      title: `You were assigned to "${parsed.data.title}"`,
      data: { taskId: id },
    });
  } else if (statusChanged && nextAssignedToId && nextAssignedToId !== session.user.id) {
    await notify({
      userId: nextAssignedToId,
      type: "STATUS_CHANGED",
      title: `Status changed to ${parsed.data.status.replace("_", " ")} on "${parsed.data.title}"`,
      data: { taskId: id },
    });
  }

  if (dueDateChanged && nextAssignedToId && nextAssignedToId !== session.user.id) {
    await notify({
      userId: nextAssignedToId,
      type: "TASK_UPDATED",
      title: `Due date changed on "${parsed.data.title}"`,
      data: { taskId: id },
    });
  }

  const existingLabelIds = existing.labels.map(l => l.labelId).sort();
  const nextLabelIds = [...labelIds].sort();
  const labelsChanged =
    existingLabelIds.length !== nextLabelIds.length ||
    existingLabelIds.some((id, i) => id !== nextLabelIds[i]);

  const fieldsChanged =
    existing.title !== parsed.data.title ||
    (existing.description ?? "") !== (parsed.data.description ?? "") ||
    existing.priority !== parsed.data.priority ||
    existing.type !== parsed.data.type ||
    dueDateChanged ||
    labelsChanged;

  if (fieldsChanged) {
    await logActivity({
      entityId: id,
      action: "updated",
      performedBy: session.user.id,
      oldValue: {
        title: existing.title,
        priority: existing.priority,
        type: existing.type,
        dueDate: existing.dueDate,
      },
      newValue: {
        title: parsed.data.title,
        priority: parsed.data.priority,
        type: parsed.data.type,
        dueDate: nextDueDate,
      },
    });
  }

  revalidatePath("/tasks");
  return { success: true };
}

// ─── Update task status (used by drag/drop or quick status change) ───────

export async function updateTaskStatus(id: string, status: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const existing = await db.task.findUnique({
    where: { id },
    select: { status: true, title: true, assignedToId: true },
  });
  if (!existing) return { success: false, error: "Task not found." };

  // Authorization: only admin or assignee can change status
  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return { success: false, error: "Only the assignee or an admin can change task status." };
  }

  await db.task.update({ where: { id }, data: { status: status as never } });

  if (existing.status !== status) {
    await logActivity({
      entityId: id,
      action: "status_changed",
      performedBy: session.user.id,
      oldValue: { status: existing.status },
      newValue: { status },
    });

    if (existing.assignedToId && existing.assignedToId !== session.user.id) {
      await notify({
        userId: existing.assignedToId,
        type: "STATUS_CHANGED",
        title: `Status changed to ${status.replace("_", " ")} on "${existing.title}"`,
        data: { taskId: id },
      });
    }
  }

  revalidatePath("/tasks");
  return { success: true };
}

// ─── Fetch full task detail (for client-side drawer loading) ─────────────

export async function getTaskDetailAction(id: string): Promise<TaskDetail | null> {
  const session = await auth();
  if (!session?.user) return null;
  return getTaskById(id);
}

// ─── Delete task ────────────────────────────────────────────────────────

export async function deleteTask(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const existing = await db.task.findUnique({ where: { id }, select: { id: true, assignedToId: true } });
  if (!existing) return { success: false, error: "Task not found." };

  // Authorization: only admin or assignee can delete
  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return { success: false, error: "Only the assignee or an admin can delete this task." };
  }

  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}
