"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { uploadAttachment as uploadToStorage } from "@/lib/storage";
import { getAttachments } from "./queries";
import type { AttachmentRow } from "./types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function logActivity(opts: { entityId: string; action: string; performedBy: string; newValue?: unknown }) {
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

export async function getAttachmentsAction(taskId: string): Promise<AttachmentRow[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getAttachments(taskId);
}

export async function uploadAttachment(taskId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const task = await db.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return { success: false, error: "Task not found." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { success: false, error: "No file selected." };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: "File must be smaller than 10 MB." };

  const url = await uploadToStorage(file, taskId);
  if (!url) {
    return { success: false, error: "Storage is not configured. Add S3 environment variables to enable attachments." };
  }

  await db.attachment.create({ data: { taskId, url, filename: file.name } });

  await logActivity({ entityId: taskId, action: "attachment_added", performedBy: session.user.id, newValue: { filename: file.name } });

  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  await db.attachment.delete({ where: { id: attachmentId } });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}
