"use server";

import dotenv from "dotenv";
import { sendMessage } from "@/features/external/bots/bale/actions";
import { SendMessageParams } from "@/features/external/bots/bale/types";
import { prisma as db } from "@/lib/db";

dotenv.config({ path: ".env" });

const BALE_UPDATES_CHAT = process.env.BALE_CHANNELS_TASKS_TEST;

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function formatTaskLink(taskId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/tasks/${taskId}`;
}

export async function sendBaleTaskNotification(
  action:
    | "created"
    | "updated"
    | "status_changed"
    | "assigned"
    | "commented"
    | "logged_work",
  task: {
    id: string;
    title: string;
    status?: string;
    priority?: string;
    assigneeName?: string;
    creatorName?: string;
    commentBody?: string;
    changedFields?: Record<string, { old: unknown; new: unknown }>;
    workLog?: {
      hours: number;
      date: string;
      assignee?: string;
      project?: string;
      description?: string;
    };
  },
): Promise<void> {
  let message = "";

  switch (action) {
    case "created":
      message = `🆕 *افزودن کارخواسته*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.status) message += `وضعیت: \`${escapeMarkdown(task.status)}\`\n`;
      if (task.priority)
        message += `اولویت: \`${escapeMarkdown(task.priority)}\`\n`;
      if (task.assigneeName)
        message += `عامل: ${escapeMarkdown(task.assigneeName)}\n`;
      message += `\n[برو به تسک](${formatTaskLink(task.id)})`;
      break;

    case "updated":
      message = `✏️ *بروزرسانی کارخواسته*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.changedFields) {
        const fieldLabels: Record<string, string> = {
          title: "عنوان",
          description: "توضیحات",
          status: "وضعیت",
          priority: "اولویت",
          type: "نوع",
          dueDate: "تاریخ سررسید",
          projectId: "پروژه",
          assignedToId: "عامل",
          labels: "برچسب‌ها",
        };
        for (const [field, values] of Object.entries(task.changedFields)) {
          const fieldLabel =
            fieldLabels[field] ||
            field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          message += `${fieldLabel}: ${escapeMarkdown(String(values.old))} ← ${escapeMarkdown(String(values.new))}\n`;
        }
      }
      message += `\n[برو به تسک](${formatTaskLink(task.id)})`;
      break;

    case "status_changed":
      message = `🔄 *وضعیت تغییر کرد*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.changedFields?.status) {
        message += `وضعیت: \`${escapeMarkdown(String(task.changedFields.status.old))}\` ← \`${escapeMarkdown(String(task.changedFields.status.new))}\`\n`;
      }
      message += `\n[برو به تسک](${formatTaskLink(task.id)})`;
      break;

    case "assigned":
      message = `👤 *کارخواسته تخصیص یافت*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.assigneeName) {
        message += `*به: ${escapeMarkdown(task.assigneeName)}*\n`;
      }
      message += `\n[برو به تسک](${formatTaskLink(task.id)})`;
      break;

    case "commented":
      message = `💬 *نظر جدید*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.commentBody) {
        const truncated =
          task.commentBody.length > 200
            ? task.commentBody.slice(0, 200) + "..."
            : task.commentBody;
        message += `\n${escapeMarkdown(truncated)}\n`;
      }
      message += `\n[برو به تسک](${formatTaskLink(task.id)})`;
      break;

    case "logged_work":
      message = `⏱️ *وقت کار گزارش شد*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.workLog) {
        message += task.workLog.assignee
          ? `*عامل:* ${escapeMarkdown(task.workLog.assignee)}\n`
          : "";
        message += task.workLog.project
          ? `*پروژه:* ${escapeMarkdown(task.workLog.project)}\n`
          : "";
        message += `*ساعت:* ${escapeMarkdown(String(task.workLog.hours))}\n`;
        message += `*تاریخ:* ${escapeMarkdown(task.workLog.date)}\n`;
        if (task.workLog.description) {
          const truncated =
            task.workLog.description.length > 200
              ? task.workLog.description.slice(0, 200) + "..."
              : task.workLog.description;
          message += `*توضیحات:* ${escapeMarkdown(truncated)}\n`;
        }
      }
      message += `\n[برو به تسک](${formatTaskLink(task.id)})`;
      break;
  }

  const data = {
    chat_id: BALE_UPDATES_CHAT as string,
    text: message,
    parse_mode: "Markdown",
  } satisfies SendMessageParams;

  // console.log("Bale notification:", data);

  const result = await sendMessage(data);

  if (!result.success) {
    console.error("Failed to send Bale notification:", result.error);
  }
}

export async function sendBaleAssignmentNotification(
  assigneeId: string,
  task: {
    id: string;
    title: string;
    status?: string;
    priority?: string;
  }
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: assigneeId },
    select: { baleUserId: true, name: true },
  });

  if (!user?.baleUserId) return;

  const message = `📋 *New Task Assigned*

*${escapeMarkdown(task.title)}*
${task.status ? `Status: \`${escapeMarkdown(task.status)}\`\n` : ""}${task.priority ? `Priority: \`${escapeMarkdown(task.priority)}\`\n` : ""}
[View Task](${formatTaskLink(task.id)})`;

  const data = {
    chat_id: user.baleUserId,
    text: message,
    parse_mode: "Markdown",
  } satisfies SendMessageParams;

  const result = await sendMessage(data);

  if (!result.success) {
    console.error("Failed to send Bale assignment notification:", result.error);
  }
}

export async function sendBaleStatusChangeNotification(
  assigneeId: string,
  task: {
    id: string;
    title: string;
    oldStatus: string;
    newStatus: string;
  }
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: assigneeId },
    select: { baleUserId: true },
  });

  if (!user?.baleUserId) return;

  const message = `🔄 *Status Changed*

*${escapeMarkdown(task.title)}*
Status: \`${escapeMarkdown(task.oldStatus)}\` → \`${escapeMarkdown(task.newStatus)}\`
[View Task](${formatTaskLink(task.id)})`;

  const data = {
    chat_id: user.baleUserId,
    text: message,
    parse_mode: "Markdown",
  } satisfies SendMessageParams;

  const result = await sendMessage(data);

  if (!result.success) {
    console.error("Failed to send Bale status change notification:", result.error);
  }
}

export async function sendBaleCommentNotification(
  assigneeId: string,
  task: {
    id: string;
    title: string;
    commentBody: string;
  }
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: assigneeId },
    select: { baleUserId: true },
  });

  if (!user?.baleUserId) return;

  const truncated = task.commentBody.length > 200
    ? task.commentBody.slice(0, 200) + "..."
    : task.commentBody;

  const message = `💬 *New Comment*

*${escapeMarkdown(task.title)}*
${escapeMarkdown(truncated)}
[View Task](${formatTaskLink(task.id)})`;

  const data = {
    chat_id: user.baleUserId,
    text: message,
    parse_mode: "Markdown",
  } satisfies SendMessageParams;

  const result = await sendMessage(data);

  if (!result.success) {
    console.error("Failed to send Bale comment notification:", result.error);
  }
}
