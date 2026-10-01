import { prisma as db } from "@/lib/db";
import { spawnNextIfRecurring } from "@/features/life/recurrence";
import { syncResearchLinksFromTaskStatus } from "@/features/research/sync-links";
import { sendMessage } from "./actions";

const DONE_WORDS = new Set(["تمام", "تموم", "done"]);

export function isDoneReply(text: string): boolean {
  return DONE_WORDS.has(text.trim().toLowerCase());
}

export async function completeFromBaleReply(
  chatId: number,
  text: string,
  replyToMessageId?: number,
): Promise<void> {
  const chat = String(chatId);
  const user = await db.user.findFirst({
    where: { baleUserId: chat },
    select: { id: true },
  });
  if (!user) {
    await sendMessage({
      chat_id: chatId,
      text: "اول حسابت را با /email وصل کن.",
    });
    return;
  }

  const outbound = replyToMessageId
    ? await db.baleOutbound.findFirst({
        where: { chatId: chat, messageId: replyToMessageId },
        orderBy: { createdAt: "desc" },
      })
    : null;

  let taskId = outbound?.taskId ?? null;
  if (!taskId) {
    const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recent = await db.baleOutbound.findMany({
      where: { chatId: chat, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const openIds = [...new Set(recent.map((row) => row.taskId))];
    const open = await db.task.findMany({
      where: {
        id: { in: openIds },
        status: { not: "DONE" },
        OR: [{ assignedToId: user.id }, { assignedToId: null, createdById: user.id }],
      },
      select: { id: true },
    });
    if (open.length === 1) taskId = open[0].id;
    else if (open.length > 1) {
      await sendMessage({
        chat_id: chatId,
        text: "چند کار باز است. روی همان پیام موعد جواب بده: تمام",
      });
      return;
    }
  }

  if (!taskId) {
    await sendMessage({
      chat_id: chatId,
      text: "پیام بازی برای تمام کردن نیست. روی پیام موعد جواب بده: تمام",
    });
    return;
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, status: true, assignedToId: true, createdById: true },
  });
  const owns =
    task &&
    (task.assignedToId === user.id ||
      (task.assignedToId == null && task.createdById === user.id));
  if (!task || !owns) {
    await sendMessage({ chat_id: chatId, text: "این کار مال این حساب نیست." });
    return;
  }
  if (task.status === "DONE") {
    await sendMessage({ chat_id: chatId, text: `«${task.title}» از قبل تمام شده.` });
    return;
  }

  await db.task.update({
    where: { id: task.id },
    data: {
      status: "DONE",
      waitingOn: false,
      completedAt: new Date(),
    },
  });
  await db.activityLog.create({
    data: {
      entity: "task",
      entityId: task.id,
      action: "status_changed",
      performedBy: user.id,
      oldValue: { status: task.status },
      newValue: { status: "DONE", via: "bale" },
    },
  });
  await syncResearchLinksFromTaskStatus(task.id, "DONE");
  try {
    await spawnNextIfRecurring(task.id, user.id);
  } catch (error) {
    console.error("spawnNextIfRecurring after Bale DONE failed", error);
  }
  await sendMessage({ chat_id: chatId, text: `«${task.title}» تمام شد.` });
}
