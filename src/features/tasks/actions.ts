"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/schemas/tasks";
import { getTaskById } from "./queries";
import { notify } from "@/lib/notify";
import { sendBaleTaskNotification } from "@/features/external/bots/bale/notifications";
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
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
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
      oldValue:
        opts.oldValue === undefined ? undefined : (opts.oldValue as object),
      newValue:
        opts.newValue === undefined ? undefined : (opts.newValue as object),
    },
  });
}

// ─── Create task ────────────────────────────────────────────────────────

export async function createTask(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = createTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Get user's first team (default team)
  const membership = await db.teamMember.findFirst({
    where: { userId: session.user.id },
    select: { teamId: true },
  });
  if (!membership) return { success: false, error: "کاربر عضو هیچ تیمی نیست" };

  // Validate project access if projectId is provided
  const projectId = parsed.data.projectId || null;
  if (projectId) {
    const projectMember = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    });
    if (!projectMember) {
      return { success: false, error: "شما به این پروژه دسترسی ندارید" };
    }
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
      projectId,
      createdById: session.user.id,
      teamId: membership.teamId,
      labels: { create: labelIds.map(labelId => ({ labelId })) },
    },
  });

  await logActivity({
    entityId: task.id,
    action: "created",
    performedBy: session.user.id,
    newValue: {
      title: task.title,
      status: task.status,
      priority: task.priority,
    },
  });

  if (task.assignedToId && task.assignedToId !== session.user.id) {
    await notify({
      userId: task.assignedToId,
      type: "TASK_ASSIGNED",
      title: `شما به «${task.title}» واگذار شدید`,
      data: { taskId: task.id },
    });
  }

  // Send Bale notification
  const assignee = await db.user.findUnique({
    where: { id: task.assignedToId ?? "" },
    select: { name: true },
  });
  await sendBaleTaskNotification("created", {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assigneeName: assignee?.name,
  });

  revalidatePath("/tasks");
  return { success: true, data: { id: task.id } };
}

// ─── Update task ────────────────────────────────────────────────────────

export async function updateTask(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

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
      projectId: true,
      labels: { select: { labelId: true } },
    },
  });
  if (!existing) return { success: false, error: "تسک یافت نشد" };

  // Validate project access if projectId is provided
  const projectId = parsed.data.projectId || null;
  if (projectId && projectId !== existing.projectId) {
    const projectMember = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    });
    if (!projectMember) {
      return { success: false, error: "شما به این پروژه دسترسی ندارید" };
    }
  }

  // Authorization: only admin or assignee can edit
  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return {
      success: false,
      error: "تنها عامل یا ادمین می‌تواند این تسک را ویرایش کند",
    };
  }

  const labelIds = parseLabelIds(parsed.data.labelIds);
  const nextDueDate = parsed.data.dueDate
    ? new Date(parsed.data.dueDate)
    : null;
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
      projectId,
      labels: {
        deleteMany: {},
        create: labelIds.map(labelId => ({ labelId })),
      },
    },
  });

  const assigneeChanged = (existing.assignedToId ?? null) !== nextAssignedToId;
  const statusChanged = existing.status !== parsed.data.status;
  const dueDateChanged =
    (existing.dueDate?.getTime() ?? null) !== (nextDueDate?.getTime() ?? null);
  const projectChanged = (existing.projectId ?? null) !== projectId;

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

  if (projectChanged) {
    await logActivity({
      entityId: id,
      action: "project_changed",
      performedBy: session.user.id,
      oldValue: { projectId: existing.projectId },
      newValue: { projectId },
    });
  }

  // ─── Notifications ──────────────────────────────────────────────
  if (
    assigneeChanged &&
    nextAssignedToId &&
    nextAssignedToId !== session.user.id
  ) {
    await notify({
      userId: nextAssignedToId,
      type: "TASK_ASSIGNED",
      title: `شما به «${parsed.data.title}» واگذار شدید`,
      data: { taskId: id },
    });
  } else if (
    statusChanged &&
    nextAssignedToId &&
    nextAssignedToId !== session.user.id
  ) {
    await notify({
      userId: nextAssignedToId,
      type: "STATUS_CHANGED",
      title: `وضعیت به «${parsed.data.status.replace("_", " ")}» در «${parsed.data.title}» تغییر کرد`,
      data: { taskId: id },
    });
  }

  if (
    dueDateChanged &&
    nextAssignedToId &&
    nextAssignedToId !== session.user.id
  ) {
    await notify({
      userId: nextAssignedToId,
      type: "TASK_UPDATED",
      title: `تاریخ سررسید در «${parsed.data.title}» تغییر کرد`,
      data: { taskId: id },
    });
  }

  // Send Bale notifications
  const assignee = nextAssignedToId
    ? await db.user.findUnique({
        where: { id: nextAssignedToId },
        select: { name: true },
      })
    : null;

  if (statusChanged) {
    await sendBaleTaskNotification("status_changed", {
      id,
      title: parsed.data.title,
      changedFields: {
        status: { old: existing.status, new: parsed.data.status },
      },
    });
  }

  if (assigneeChanged) {
    await sendBaleTaskNotification("assigned", {
      id,
      title: parsed.data.title,
      assigneeName: assignee?.name,
    });
  }

  const changedFields: Record<string, { old: unknown; new: unknown }> = {};
  if (existing.title !== parsed.data.title)
    changedFields.title = { old: existing.title, new: parsed.data.title };
  if (existing.priority !== parsed.data.priority)
    changedFields.priority = {
      old: existing.priority,
      new: parsed.data.priority,
    };
  if (existing.type !== parsed.data.type)
    changedFields.type = { old: existing.type, new: parsed.data.type };
  if (dueDateChanged)
    changedFields.dueDate = { old: existing.dueDate, new: nextDueDate };

  if (Object.keys(changedFields).length > 0) {
    await sendBaleTaskNotification("updated", {
      id,
      title: parsed.data.title,
      changedFields,
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

export async function updateTaskStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.task.findUnique({
    where: { id },
    select: { status: true, title: true, assignedToId: true },
  });
  if (!existing) return { success: false, error: "تسک یافت نشد" };

  // Authorization: only admin or assignee can change status
  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return {
      success: false,
      error: "تنها عامل یا ادمین می‌تواند وضعیت تسک را تغییر دهد",
    };
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
        title: `وضعیت به «${status.replace("_", " ")}» در «${existing.title}» تغییر کرد`,
        data: { taskId: id },
      });
    }

    await sendBaleTaskNotification("status_changed", {
      id,
      title: existing.title,
      changedFields: {
        status: { old: existing.status, new: status },
      },
    });
  }

  revalidatePath("/tasks");
  return { success: true };
}

// ─── Fetch full task detail (for client-side drawer loading) ─────────────

export async function getTaskDetailAction(
  id: string,
): Promise<TaskDetail | null> {
  const session = await auth();
  if (!session?.user) return null;
  return getTaskById(id);
}

// ─── Delete task ────────────────────────────────────────────────────────

export async function deleteTask(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.task.findUnique({
    where: { id },
    select: { id: true, assignedToId: true },
  });
  if (!existing) return { success: false, error: "تسک یافت نشد" };

  // Authorization: only admin or assignee can delete
  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = existing.assignedToId === session.user.id;
  if (!isAdmin && !isAssignee) {
    return {
      success: false,
      error: "تنها عامل یا ادمین می‌تواند این تسک را حذف کند",
    };
  }

  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}
