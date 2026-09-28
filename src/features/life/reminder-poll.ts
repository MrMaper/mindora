"use server";

import { auth } from "@/auth";
import { ensureTimedDueReminders } from "@/features/life/reminders";

export async function pollTimedRemindersAction(): Promise<{
  success: boolean;
  data?: { title: string; body: string; tag: string; href: string }[];
}> {
  const session = await auth();
  if (!session?.user) return { success: false };
  const fired = await ensureTimedDueReminders(session.user.id);
  return { success: true, data: fired };
}
