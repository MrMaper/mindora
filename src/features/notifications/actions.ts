"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });
  if (!notification || notification.userId !== session.user.id) {
    return { success: false, error: "Notification not found." };
  }

  await db.notification.update({ where: { id: notificationId }, data: { read: true } });
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized." };

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { success: true };
}
