"use server";

import { getBaleRuntime, type BaleRuntime } from "@/features/external/bots/bale/config";
import { baleAppOrigin, deliverBale, escapeBale } from "@/features/external/bots/bale/deliver";
import { prisma as db } from "@/lib/db";

function escapeMarkdown(text: string): string {
  return escapeBale(text);
}

function formatTaskLink(taskId: string): string {
  return `${baleAppOrigin()}/tasks/${taskId}`;
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
      message = `🆕 *کار تازه*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.status) message += `وضعیت: \`${escapeMarkdown(task.status)}\`\n`;
      if (task.priority)
        message += `اولویت: \`${escapeMarkdown(task.priority)}\`\n`;
      if (task.assigneeName)
        message += `فرد: ${escapeMarkdown(task.assigneeName)}\n`;
      message += `\n[برو به کار](${formatTaskLink(task.id)})`;
      break;

    case "updated":
      message = `✏️ *کار به‌روز شد*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.changedFields) {
        const fieldLabels: Record<string, string> = {
          title: "عنوان",
          description: "توضیحات",
          status: "وضعیت",
          priority: "اولویت",
          type: "نوع",
          dueDate: "تاریخ سررسید",
          projectId: "مسیر",
          assignedToId: "فرد",
          labels: "برچسب‌ها",
        };
        for (const [field, values] of Object.entries(task.changedFields)) {
          const fieldLabel =
            fieldLabels[field] ||
            field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          message += `${fieldLabel}: ${escapeMarkdown(String(values.old))} ← ${escapeMarkdown(String(values.new))}\n`;
        }
      }
      message += `\n[برو به کار](${formatTaskLink(task.id)})`;
      break;

    case "status_changed":
      message = `🔄 *وضعیت تغییر کرد*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.changedFields?.status) {
        message += `وضعیت: \`${escapeMarkdown(String(task.changedFields.status.old))}\` ← \`${escapeMarkdown(String(task.changedFields.status.new))}\`\n`;
      }
      message += `\n[برو به کار](${formatTaskLink(task.id)})`;
      break;

    case "assigned":
      message = `👤 *کار سپرده شد*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.assigneeName) {
        message += `*به: ${escapeMarkdown(task.assigneeName)}*\n`;
      }
      message += `\n[برو به کار](${formatTaskLink(task.id)})`;
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
      message += `\n[برو به کار](${formatTaskLink(task.id)})`;
      break;

    case "logged_work":
      message = `⏱️ *وقت کار گزارش شد*\n`;
      message += `*${escapeMarkdown(task.title)}*\n`;
      if (task.workLog) {
        message += task.workLog.assignee
          ? `*فرد:* ${escapeMarkdown(task.workLog.assignee)}\n`
          : "";
        message += task.workLog.project
          ? `*مسیر:* ${escapeMarkdown(task.workLog.project)}\n`
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
      message += `\n[برو به کار](${formatTaskLink(task.id)})`;
      break;
  }

  try {
    const runtime = await getBaleRuntime();
    if (!runtime.enabled || !runtime.notifyChannel || !runtime.tasksChannelId) return;
    if (!channelAllows(runtime, action)) return;

    await deliverBale({
      chatId: runtime.tasksChannelId,
      text: message,
      kind: `channel:${action}`,
      taskId: task.id,
      parseMode: "Markdown",
    });
  } catch (error) {
    console.error("Failed to send Bale notification:", error);
  }
}

function channelAllows(
  runtime: BaleRuntime,
  action:
    | "created"
    | "updated"
    | "status_changed"
    | "assigned"
    | "commented"
    | "logged_work",
) {
  switch (action) {
    case "created":
      return runtime.notifyCreated;
    case "updated":
      return runtime.notifyUpdated;
    case "status_changed":
      return runtime.notifyStatus;
    case "assigned":
      return runtime.notifyAssigned;
    case "commented":
      return runtime.notifyComment;
    case "logged_work":
      return runtime.notifyWorkLog;
  }
}

export async function sendBaleAssignmentNotification(
  assigneeId: string,
  task: {
    id: string;
    title: string;
    status?: string;
    priority?: string;
  },
): Promise<void> {
  const message = `📋 *کار به تو سپرده شد*

*${escapeMarkdown(task.title)}*
${task.status ? `وضعیت: \`${escapeMarkdown(task.status)}\`\n` : ""}${task.priority ? `اولویت: \`${escapeMarkdown(task.priority)}\`\n` : ""}
[برو به کار](${formatTaskLink(task.id)})`;

  await deliverDm(assigneeId, "notifyDmAssigned", "notifyTaskAssigned", message, {
    kind: "assigned",
    taskId: task.id,
  });
}

export async function sendBaleStatusChangeNotification(
  assigneeId: string,
  task: {
    id: string;
    title: string;
    oldStatus: string;
    newStatus: string;
  },
): Promise<void> {
  const message = `🔄 *وضعیت عوض شد*

*${escapeMarkdown(task.title)}*
وضعیت: \`${escapeMarkdown(task.oldStatus)}\` → \`${escapeMarkdown(task.newStatus)}\`
[برو به کار](${formatTaskLink(task.id)})`;

  await deliverDm(assigneeId, "notifyDmStatus", "notifyStatusChanged", message, {
    kind: "status",
    taskId: task.id,
  });
}

export async function sendBaleCommentNotification(
  assigneeId: string,
  task: {
    id: string;
    title: string;
    commentBody: string;
  },
): Promise<void> {
  const truncated =
    task.commentBody.length > 200
      ? task.commentBody.slice(0, 200) + "..."
      : task.commentBody;

  const message = `💬 *دیدگاه تازه*

*${escapeMarkdown(task.title)}*
${escapeMarkdown(truncated)}
[برو به کار](${formatTaskLink(task.id)})`;

  await deliverDm(assigneeId, "notifyDmComment", "notifyTaskCommented", message, {
    kind: "comment",
    taskId: task.id,
  });
}

export async function sendBaleDueChangeNotification(
  userId: string,
  task: { id: string; title: string; dueLabel: string },
): Promise<void> {
  const message = `📅 *سررسید عوض شد*

*${escapeMarkdown(task.title)}*
سررسید: ${escapeMarkdown(task.dueLabel)}
[برو به کار](${formatTaskLink(task.id)})

روی همین پیام جواب بده: تمام`;

  await deliverDm(userId, "notifyDueChange", "notifyTaskUpdated", message, {
    kind: "due",
    taskId: task.id,
  });
}

async function deliverDm(
  userId: string,
  flag: "notifyDmAssigned" | "notifyDmStatus" | "notifyDmComment" | "notifyDueChange",
  pref:
    | "notifyTaskAssigned"
    | "notifyStatusChanged"
    | "notifyTaskCommented"
    | "notifyTaskUpdated",
  text: string,
  meta: { kind: string; taskId: string },
) {
  try {
    const runtime = await getBaleRuntime();
    if (!runtime.enabled || !runtime[flag]) return;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        baleUserId: true,
        preferences: {
          select: {
            notifications: true,
            notifyTaskAssigned: true,
            notifyStatusChanged: true,
            notifyTaskCommented: true,
            notifyTaskUpdated: true,
          },
        },
      },
    });
    if (!user?.baleUserId) return;
    if (user.preferences?.notifications === false) return;
    if (user.preferences && user.preferences[pref] === false) return;
    await deliverBale({
      chatId: user.baleUserId,
      text,
      kind: meta.kind,
      taskId: meta.taskId,
      parseMode: "Markdown",
    });
  } catch (error) {
    console.error("Failed to send Bale DM:", error);
  }
}
