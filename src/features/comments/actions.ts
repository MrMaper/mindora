"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createCommentSchema, updateCommentSchema } from "@/schemas/comments";
import { getComments } from "./queries";
import { notify } from "@/lib/notify";
import { sendBaleTaskNotification, sendBaleCommentNotification } from "@/features/external/bots/bale/notifications";
import { EDIT_WINDOW_MS } from "./types";
import type { CommentRow } from "./types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function logActivity(opts: {
  entityId: string;
  action: string;
  performedBy: string;
  newValue?: unknown;
}) {
  await db.activityLog.create({
    data: {
      entity: "task",
      entityId: opts.entityId,
      action: opts.action,
      performedBy: opts.performedBy,
      newValue: opts.newValue === undefined ? undefined : (opts.newValue as object),
    },
  });
}

export async function getCommentsAction(taskId: string): Promise<CommentRow[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getComments(taskId);
}

export async function createComment(taskId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = createCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, assignedToId: true, createdById: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };

  const mentionIds = new Set<string>();
  for (const raw of formData.getAll("mentions")) {
    const value = String(raw);
    const sep = value.lastIndexOf(":");
    if (sep <= 0) continue;
    const userId = value.slice(sep + 1).trim();
    // Only allow mentioning people already on this task (no cross-user discovery).
    if (
      userId &&
      userId !== session.user.id &&
      (userId === task.assignedToId || userId === task.createdById)
    ) {
      mentionIds.add(userId);
    }
  }

  await db.comment.create({
    data: { taskId, userId: session.user.id, body: parsed.data.body },
  });

  await logActivity({
    entityId: taskId,
    action: "commented",
    performedBy: session.user.id,
  });

  for (const userId of mentionIds) {
    await notify({
      userId,
      type: "MENTION",
      title: `منشن در «${task.title}»`,
      body: parsed.data.body.slice(0, 140),
      data: { taskId },
    });
  }

  const recipients = new Set(
    [task.assignedToId, task.createdById].filter(Boolean) as string[],
  );
  recipients.delete(session.user.id);
  for (const userId of mentionIds) recipients.delete(userId);

  for (const userId of recipients) {
    await notify({
      userId,
      type: "TASK_COMMENTED",
      title: `دیدگاه جدید در «${task.title}»`,
      body: parsed.data.body.slice(0, 140),
      data: { taskId },
    });

    await sendBaleCommentNotification(userId, {
      id: taskId,
      title: task.title,
      commentBody: parsed.data.body,
    });
  }

  for (const userId of mentionIds) {
    await sendBaleCommentNotification(userId, {
      id: taskId,
      title: task.title,
      commentBody: parsed.data.body,
    });
  }

  await sendBaleTaskNotification("commented", {
    id: taskId,
    title: task.title,
    commentBody: parsed.data.body,
  });

  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function updateComment(commentId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const parsed = updateCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, createdAt: true },
  });
  if (!comment) return { success: false, error: "دیدگاه یافت نشد" };
  if (comment.userId !== session.user.id) {
    return { success: false, error: "شما فقط می‌توانید دیدگاه‌های خود را ویرایش کنید" };
  }
  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return { success: false, error: "این دیدگاه دیگر قابل ویرایش نیست" };
  }

  await db.comment.update({ where: { id: commentId }, data: { body: parsed.data.body } });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (!comment) return { success: false, error: "دیدگاه یافت نشد" };
  if (comment.userId !== session.user.id) {
    return { success: false, error: "شما فقط می‌توانید دیدگاه‌های خود را حذف کنید" };
  }

  await db.comment.delete({ where: { id: commentId } });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}
