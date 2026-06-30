import { prisma as db } from "@/lib/db";
import type { GetNotificationsResult } from "./types";

const PAGE_SIZE = 20;

export async function getNotifications(userId: string, page = 1): Promise<GetNotificationsResult> {
  const skip = (Math.max(1, page) - 1) * PAGE_SIZE;

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: { id: true, type: true, title: true, body: true, read: true, data: true, createdAt: true },
    }),
    db.notification.count({ where: { userId } }),
  ]);

  return {
    notifications,
    total,
    page: Math.max(1, page),
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}
