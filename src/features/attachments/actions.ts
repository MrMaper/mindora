"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { uploadAttachment as uploadToStorage } from "@/lib/storage";
import { canAccessPersonalTask } from "@/lib/task-access";
import { getAttachments } from "./queries";
import type { AttachmentRow } from "./types";

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
      newValue:
        opts.newValue === undefined ? undefined : (opts.newValue as object),
    },
  });
}

export async function getAttachmentsAction(
  taskId: string,
): Promise<AttachmentRow[]> {
  const session = await auth();
  if (!session?.user) return [];

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { assignedToId: true, createdById: true },
  });
  if (
    !task ||
    !canAccessPersonalTask(session.user.id, session.user.role, task)
  ) {
    return [];
  }

  return getAttachments(taskId);
}

export async function uploadAttachment(
  taskId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, assignedToId: true, createdById: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };
  if (
    !canAccessPersonalTask(session.user.id, session.user.role, task)
  ) {
    return { success: false, error: "اجازه ویرایش ندارید" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "فایلی انتخاب نشده است" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "فایل باید کوچکتر از ۱۰ مگابایت باشد" };
  }

  const url = await uploadToStorage(file, taskId);
  if (!url) {
    return {
      success: false,
      error:
        "ذخیره‌سازی پیکربندی نشده است. متغیرهای محیطی S3 را برای فعال‌سازی پیوست‌ها اضافه کنید",
    };
  }

  await db.attachment.create({
    data: { taskId, url, filename: file.name },
  });

  await logActivity({
    entityId: taskId,
    action: "attachment_added",
    performedBy: session.user.id,
    newValue: { filename: file.name },
  });

  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}

export async function deleteAttachment(
  attachmentId: string,
): Promise<ActionResult> {
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

  if (
    !canAccessPersonalTask(
      session.user.id,
      session.user.role,
      attachment.task,
    )
  ) {
    return { success: false, error: "اجازه حذف این پیوست را نداری" };
  }

  await db.attachment.delete({ where: { id: attachment.id } });
  await logActivity({
    entityId: attachment.taskId,
    action: "attachment_removed",
    performedBy: session.user.id,
    newValue: { filename: attachment.filename },
  });
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true };
}
