"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createWorkLogSchema, updateWorkLogSchema } from "@/schemas/work-logs";
import type { ActionResult } from "@/features/tasks/actions";
import type { WorkLogRow, WorkLogDetail } from "./types";

async function logActivity(opts: {
  entityId: string;
  action: string;
  performedBy: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await db.activityLog.create({
    data: {
      entity: "work_log",
      entityId: opts.entityId,
      action: opts.action,
      performedBy: opts.performedBy,
      oldValue: opts.oldValue === undefined ? undefined : (opts.oldValue as object),
      newValue: opts.newValue === undefined ? undefined : (opts.newValue as object),
    },
  });
}

export async function createWorkLog(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = createWorkLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const task = await db.task.findUnique({
    where: { id: parsed.data.taskId },
    select: { id: true, title: true, assignedToId: true, projectId: true },
  });
  if (!task) return { success: false, error: "تسک یافت نشد" };

  const isAdmin = session.user.role === "ADMIN";
  const isAssignee = task.assignedToId === session.user.id;

  if (!isAdmin && !isAssignee) {
    return { success: false, error: "تنها عامل تسک می‌تواند لاگ کاری ثبت کند" };
  }

  const workLog = await db.workLog.create({
    data: {
      taskId: parsed.data.taskId,
      userId: session.user.id,
      hours: parsed.data.hours,
      date: new Date(parsed.data.date),
      description: parsed.data.description || null,
    },
  });

  await logActivity({
    entityId: workLog.id,
    action: "created",
    performedBy: session.user.id,
    newValue: { hours: workLog.hours, date: workLog.date, description: workLog.description },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${task.id}`);
  return { success: true, data: { id: workLog.id } };
}

export async function updateWorkLog(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = updateWorkLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const existing = await db.workLog.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      taskId: true,
      userId: true,
      hours: true,
      date: true,
      description: true,
      task: { select: { title: true, assignedToId: true, projectId: true } },
    },
  });
  if (!existing) return { success: false, error: "لاگ کاری یافت نشد" };

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = existing.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { success: false, error: "تنها صاحب لاگ یا ادمین می‌تواند آن را ویرایش کند" };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.hours !== undefined) updateData.hours = parsed.data.hours;
  if (parsed.data.date !== undefined) updateData.date = new Date(parsed.data.date);
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description || null;

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "هیچ تغییری برای اعمال وجود ندارد" };
  }

  await db.workLog.update({
    where: { id: parsed.data.id },
    data: updateData,
  });

  await logActivity({
    entityId: parsed.data.id,
    action: "updated",
    performedBy: session.user.id,
    oldValue: { hours: existing.hours, date: existing.date, description: existing.description },
    newValue: updateData,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${existing.taskId}`);
  return { success: true };
}

export async function deleteWorkLog(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.workLog.findUnique({
    where: { id },
    select: { id: true, taskId: true, userId: true, hours: true, date: true, description: true },
  });
  if (!existing) return { success: false, error: "لاگ کاری یافت نشد" };

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = existing.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { success: false, error: "تنها صاحب لاگ یا ادمین می‌تواند آن را حذف کند" };
  }

  await db.workLog.delete({ where: { id } });

  await logActivity({
    entityId: id,
    action: "deleted",
    performedBy: session.user.id,
    oldValue: { hours: existing.hours, date: existing.date, description: existing.description },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${existing.taskId}`);
  return { success: true };
}

export async function getWorkLogDetailAction(id: string): Promise<WorkLogDetail | null> {
  const session = await auth();
  if (!session?.user) return null;
  const { getWorkLogById } = await import("./queries");
  return getWorkLogById(id);
}