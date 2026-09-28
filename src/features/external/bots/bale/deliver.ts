import { prisma as db } from "@/lib/db";
import { sendMessage } from "./actions";
import { appOrigin } from "./config";

export function baleAppOrigin(): string {
  return appOrigin() || "http://localhost:3000";
}

export function escapeBale(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export async function deliverBale(input: {
  chatId: string | number;
  text: string;
  kind: string;
  taskId?: string;
  parseMode?: "Markdown" | "HTML";
}): Promise<boolean> {
  const chatId = String(input.chatId);
  const preview = input.text.replace(/\s+/g, " ").slice(0, 180);
  const result = await sendMessage({
    chat_id: input.chatId,
    text: input.text,
    parse_mode: input.parseMode,
  });

  await db.baleDelivery.create({
    data: {
      kind: input.kind,
      chatId,
      ok: result.success,
      error: result.success ? null : (result.error ?? "send-failed").slice(0, 300),
      preview,
    },
  });

  const stale = await db.baleDelivery.findMany({
    orderBy: { createdAt: "desc" },
    skip: 40,
    select: { id: true },
  });
  if (stale.length > 0) {
    await db.baleDelivery.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
  }

  if (result.success && input.taskId && result.data?.message_id) {
    await db.baleOutbound.create({
      data: {
        chatId,
        messageId: result.data.message_id,
        taskId: input.taskId,
        kind: input.kind,
      },
    });
  }

  if (!result.success) console.error("Bale send failed:", result.error);
  return result.success;
}
