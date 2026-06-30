"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/schemas/tasks";
import { getTaskById } from "./queries";
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
      labels: { create: labelIds.map(labelId => ({ labelId })) },
    },
  });

  await logActivity({
    entityId: task.id,
    action: "created",
    performedBy: session.user.id,
    newValue: { title: task.title, status: task.status, priority: task.priority },
  });

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

  if (existing.status !== parsed.data.status) {
    await logActivity({
      entityId: id,
      action: "status_changed",
      performedBy: session.user.id,
      oldValue: { status: existing.status },
      newValue: { status: parsed.data.status },
    });
  }

  if ((existing.assignedToId ?? null) !== nextAssignedToId) {
    await logActivity({
      entityId: id,
      action: "assigned",
      performedBy: session.user.id,
      oldValue: { assignedToId: existing.assignedToId },
      newValue: { assignedToId: nextAssignedToId },
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
    (existing.dueDate?.getTime() ?? null) !== (nextDueDate?.getTime() ?? null) ||
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

  const existing = await db.task.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return { success: false, error: "Task not found." };

  await db.task.update({ where: { id }, data: { status: status as never } });

  if (existing.status !== status) {
    await logActivity({
      entityId: id,
      action: "status_changed",
      performedBy: session.user.id,
      oldValue: { status: existing.status },
      newValue: { status },
    });
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

  const existing = await db.task.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { success: false, error: "Task not found." };

  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}
