"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { createCommentSchema, updateCommentSchema } from "@/schemas/comments";
import { getComments } from "./queries";
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
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const parsed = createCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const task = await db.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return { success: false, error: "Task not found." };

  await db.comment.create({
    data: { taskId, userId: session.user.id, body: parsed.data.body },
  });

  await logActivity({
    entityId: taskId,
    action: "commented",
    performedBy: session.user.id,
  });

  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function updateComment(commentId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const parsed = updateCommentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, createdAt: true },
  });
  if (!comment) return { success: false, error: "Comment not found." };
  if (comment.userId !== session.user.id) {
    return { success: false, error: "You can only edit your own comments." };
  }
  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return { success: false, error: "This comment can no longer be edited." };
  }

  await db.comment.update({ where: { id: commentId }, data: { body: parsed.data.body } });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
  if (!comment) return { success: false, error: "Comment not found." };
  if (comment.userId !== session.user.id) {
    return { success: false, error: "You can only delete your own comments." };
  }

  await db.comment.delete({ where: { id: commentId } });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}
