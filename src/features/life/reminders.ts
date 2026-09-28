"use server";

import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  addDays,
  endOfDay,
  formatClock,
  formatJalaliShort,
  startOfDay,
  toDateKey,
} from "@/lib/life";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { getBaleRuntime } from "@/features/external/bots/bale/config";
import { baleAppOrigin, deliverBale } from "@/features/external/bots/bale/deliver";

type DeadlineBucket = "overdue" | "today" | "approaching" | "timed";

/** Minutes before a timed due to fire a “soon” reminder. */
const TIMED_REMINDER_LEAD_MINUTES = 15;

function bucketForDue(due: Date, today: Date): DeadlineBucket {
  const dueStart = startOfDay(due).getTime();
  const todayMs = today.getTime();
  if (dueStart < todayMs) return "overdue";
  if (dueStart === todayMs) return "today";
  return "approaching";
}

function hasRealClock(due: Date, durationMinutes?: number | null): boolean {
  if (durationMinutes != null && durationMinutes > 0) return true;
  return !(due.getHours() === 12 && due.getMinutes() === 0);
}

export type TimedReminderPayload = {
  title: string;
  body: string;
  tag: string;
  href: string;
};

/**
 * Fire reminders for tasks due within the next TIMED_REMINDER_LEAD_MINUTES
 * (and still not more than 1 minute past). Returns payloads for browser push.
 */
export async function ensureTimedDueReminders(
  userId: string,
): Promise<TimedReminderPayload[]> {
  const prefs = await db.userPreferences.findUnique({
    where: { userId },
    select: {
      notifications: true,
      notifyDeadlineApproaching: true,
      language: true,
    },
  });
  if (prefs?.notifications === false) return [];
  if (prefs?.notifyDeadlineApproaching === false) return [];

  const language = prefs?.language === "EN" ? "EN" : "FA";
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60_000);
  const windowEnd = new Date(
    now.getTime() + TIMED_REMINDER_LEAD_MINUTES * 60_000,
  );

  const mine = {
    OR: [{ assignedToId: userId }, { createdById: userId, assignedToId: null }],
  };

  const tasks = await db.task.findMany({
    where: {
      ...mine,
      ...taskWhereExcludeHub(),
      status: { not: "DONE" },
      dueDate: { gte: windowStart, lte: windowEnd },
    },
    select: { id: true, title: true, dueDate: true, durationMinutes: true },
    take: 30,
  });

  const fired: TimedReminderPayload[] = [];
  if (tasks.length === 0) return fired;

  const recent = await db.notification.findMany({
    where: {
      userId,
      type: "DEADLINE_APPROACHING",
      createdAt: { gte: new Date(now.getTime() - 6 * 60 * 60_000) },
    },
    select: { data: true },
  });

  const already = new Set(
    recent
      .map(n => {
        const data = n.data as { taskId?: string; bucket?: string } | null;
        if (!data?.taskId || !data.bucket?.startsWith("timed:")) return null;
        return `${data.taskId}:${data.bucket}`;
      })
      .filter((k): k is string => !!k),
  );

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const due = new Date(task.dueDate);
    if (!hasRealClock(due, task.durationMinutes)) continue;

    const slot = `${due.getFullYear()}${String(due.getMonth() + 1).padStart(2, "0")}${String(due.getDate()).padStart(2, "0")}${String(due.getHours()).padStart(2, "0")}${String(due.getMinutes()).padStart(2, "0")}`;
    const bucket = `timed:${slot}`;
    const key = `${task.id}:${bucket}`;
    if (already.has(key)) continue;

    const clockPart = formatClock(due, language, task.durationMinutes) ?? "";
    const minsLeft = Math.round((due.getTime() - now.getTime()) / 60_000);
    let title: string;
    let body: string;
    if (language === "EN") {
      title =
        minsLeft <= 0
          ? `Now: ${task.title}`
          : `In ${minsLeft} min · ${clockPart}: ${task.title}`;
      body = `Due at ${clockPart}`;
    } else {
      title =
        minsLeft <= 0
          ? `الان: ${task.title}`
          : `${minsLeft} دقیقه دیگر · ${clockPart}: ${task.title}`;
      body = `سررسید ${clockPart}`;
    }

    const href = `/calendar`;
    await notify({
      userId,
      type: "DEADLINE_APPROACHING",
      title,
      body,
      data: {
        taskId: task.id,
        dueDate: toDateKey(due),
        bucket,
        href,
      },
    });
    await sendBaleDeadlineDm(userId, title, { id: task.id, title: task.title });

    fired.push({
      title,
      body,
      tag: key,
      href,
    });
    already.add(key);
  }

  return fired;
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
    select: { id: true, title: true, dueDate: true, durationMinutes: true },
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

    const clockPart = formatClock(task.dueDate, language, task.durationMinutes);
    const dueLabel = [formatJalaliShort(task.dueDate, language), clockPart]
      .filter(Boolean)
      .join(" ");
    let title: string;
    if (language === "EN") {
      if (bucket === "overdue") title = `Overdue: ${task.title}`;
      else if (bucket === "today")
        title = clockPart
          ? `Due today ${clockPart}: ${task.title}`
          : `Due today: ${task.title}`;
      else title = `Deadline ${dueLabel}: ${task.title}`;
    } else {
      if (bucket === "overdue") title = `عقب‌افتاده: ${task.title}`;
      else if (bucket === "today")
        title = clockPart
          ? `مهلت امروز ${clockPart}: ${task.title}`
          : `مهلت امروز: ${task.title}`;
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

  // Also fire clock-accurate reminders when due is imminent.
  await ensureTimedDueReminders(uid);

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
