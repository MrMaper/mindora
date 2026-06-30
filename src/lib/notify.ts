import { prisma as db } from "@/lib/db";
import type { NotificationType } from "@/types/db";

export async function notify(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  await db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data as object | undefined,
    },
  });
}
