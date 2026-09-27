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
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const task = await db.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return { success: false, error: "کار پیدا نشد" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { success: false, error: "فایلی انتخاب نشده است" };
  if (file.size > 10 * 1024 * 1024) return { success: false, error: "فایل باید کوچکتر از ۱۰ مگابایت باشد" };

  const url = await uploadToStorage(file, taskId);
  if (!url) {
    return { success: false, error: "ذخیره‌سازی پیکربندی نشده است. متغیرهای محیطی S3 را برای فعال‌سازی پیوست‌ها اضافه کنید" };
  }

  await db.attachment.create({ data: { taskId, url, filename: file.name } });

  await logActivity({ entityId: taskId, action: "attachment_added", performedBy: session.user.id, newValue: { filename: file.name } });

  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function deleteAttachment(attachmentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const attachment = await db.attachment.findFirst({
    where: { id: attachmentId },
    select: {
      id: true,
      taskId: true,
      filename: true,
      task: {
        select: {
          assignedToId: true,
          createdById: true,
        },
      },
    },
  });
  if (!attachment) return { success: false, error: "پیوست پیدا نشد" };

  const uid = session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const ownsTask =
    attachment.task.assignedToId === uid ||
    attachment.task.createdById === uid;
  if (!isAdmin && !ownsTask) {
    return { success: false, error: "اجازه حذف این پیوست را نداری" };
  }

  await db.attachment.delete({ where: { id: attachment.id } });
  await logActivity({
    entityId: attachment.taskId,
    action: "attachment_removed",
    performedBy: uid,
    newValue: { filename: attachment.filename },
  });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}
