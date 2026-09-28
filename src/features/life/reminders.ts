"use server";

import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  addDays,
  endOfDay,
  formatJalaliShort,
  startOfDay,
  toDateKey,
} from "@/lib/life";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { getBaleRuntime } from "@/features/external/bots/bale/config";
import { baleAppOrigin, deliverBale } from "@/features/external/bots/bale/deliver";

type DeadlineBucket = "overdue" | "today" | "approaching";

function bucketForDue(due: Date, today: Date): DeadlineBucket {
  const dueStart = startOfDay(due).getTime();
  const todayMs = today.getTime();
  if (dueStart < todayMs) return "overdue";
  if (dueStart === todayMs) return "today";
  return "approaching";
}

async function sendBaleDeadlineDm(
  userId: string,
  title: string,
  task: { id: string; title: string },
): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { baleUserId: true },
    });
    if (!user?.baleUserId) return;
    const runtime = await getBaleRuntime();
    if (!runtime.enabled || !runtime.notifyDeadline) return;
    const href = `${baleAppOrigin()}/tasks/${task.id}`;
    await deliverBale({
      chatId: user.baleUserId,
      text: `⏰ ${title.replace(/[*_`]/g, "")}\n\n${href}\n\nروی همین پیام جواب بده: تمام`,
      kind: "deadline",
      taskId: task.id,
    });
  } catch (err) {
    console.error("Bale deadline DM failed:", err);
  }
}

/** Create in-app (+ optional Bale) deadline notifications when prefs allow. */
export async function ensureDeadlineReminders(userId?: string): Promise<void> {
  let uid = userId;
  if (!uid) {
    const session = await auth();
    uid = session?.user?.id;
  }
  if (!uid) return;

  const prefs = await db.userPreferences.findUnique({
    where: { userId: uid },
    select: {
      notifications: true,
      notifyDeadlineApproaching: true,
      language: true,
    },
  });

  if (prefs?.notifications === false) return;
  if (prefs?.notifyDeadlineApproaching === false) return;

  const today = startOfDay();
  const horizon = endOfDay(addDays(today, 2));
  const language = prefs?.language === "EN" ? "EN" : "FA";

  const mine = {
    OR: [{ assignedToId: uid }, { createdById: uid, assignedToId: null }],
  };

  const tasks = await db.task.findMany({
    where: {
      ...mine,
      ...taskWhereExcludeHub(),
      status: { not: "DONE" },
      dueDate: { lte: horizon, not: null },
    },
    select: { id: true, title: true, dueDate: true },
    take: 50,
  });

  if (tasks.length === 0) return;

  const recent = await db.notification.findMany({
    where: {
      userId: uid,
      type: "DEADLINE_APPROACHING",
      createdAt: { gte: today },
    },
    select: { data: true },
  });

  const already = new Set(
    recent
      .map(n => {
        const data = n.data as { taskId?: string; bucket?: string } | null;
        if (!data?.taskId) return null;
        return `${data.taskId}:${data.bucket ?? "any"}`;
      })
      .filter((k): k is string => !!k),
  );

  let created = 0;

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const bucket = bucketForDue(new Date(task.dueDate), today);
    const key = `${task.id}:${bucket}`;
    if (already.has(key) || already.has(`${task.id}:any`)) continue;

    const dueLabel = formatJalaliShort(task.dueDate, language);
    let title: string;
    if (language === "EN") {
      if (bucket === "overdue") title = `Overdue: ${task.title}`;
      else if (bucket === "today") title = `Due today: ${task.title}`;
      else title = `Deadline ${dueLabel}: ${task.title}`;
    } else {
      if (bucket === "overdue") title = `عقب‌افتاده: ${task.title}`;
      else if (bucket === "today") title = `مهلت امروز: ${task.title}`;
      else title = `مهلت ${dueLabel}: ${task.title}`;
    }

    const href = `/tasks?search=${encodeURIComponent(task.title)}`;

    await notify({
      userId: uid,
      type: "DEADLINE_APPROACHING",
      title,
      data: {
        taskId: task.id,
        dueDate: toDateKey(task.dueDate),
        bucket,
        href,
      },
    });

    await sendBaleDeadlineDm(uid, title, { id: task.id, title: task.title });
    created += 1;
  }

  // Do not revalidatePath here — this helper runs during RSC render
  // (dashboard via ensureDailyRemindersCached). Cron does not need it.
}

/** Run deadline reminders for all eligible users (cron). */
export async function runDeadlineRemindersForAllUsers(): Promise<{ users: number }> {
  const allActive = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  let count = 0;
  for (const user of allActive) {
    const prefs = await db.userPreferences.findUnique({
      where: { userId: user.id },
      select: { notifications: true, notifyDeadlineApproaching: true },
    });
    if (prefs?.notifications === false) continue;
    if (prefs?.notifyDeadlineApproaching === false) continue;
    await ensureDeadlineReminders(user.id);
    count += 1;
  }

  return { users: count };
}
