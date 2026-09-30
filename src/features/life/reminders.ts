"use server";

import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  addDays,
  endOfDay,
  formatClock,
  formatJalaliShort,
  hasDueTime,
  isOverdueTask,
  startOfDay,
  toDateKey,
} from "@/lib/life";
import { getBaleRuntime } from "@/features/external/bots/bale/config";
import { baleAppOrigin, deliverBale } from "@/features/external/bots/bale/deliver";

type DeadlineBucket = "overdue" | "today" | "approaching" | "timed";

/** Minutes before a timed due to fire a “soon” reminder. */
const TIMED_REMINDER_LEAD_MINUTES = 15;

function bucketForDue(
  due: Date,
  today: Date,
  durationMinutes?: number | null,
  now = new Date(),
): DeadlineBucket {
  if (
    isOverdueTask(
      { dueDate: due, status: "TODO", durationMinutes },
      now,
    )
  ) {
    return "overdue";
  }
  const dueStart = startOfDay(due).getTime();
  const todayMs = today.getTime();
  if (dueStart === todayMs) return "today";
  return "approaching";
}

function hasRealClock(due: Date, durationMinutes?: number | null): boolean {
  return hasDueTime(due, durationMinutes);
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
      batchDeadlineReminders: true,
      language: true,
    },
  });

  if (prefs?.notifications === false) return;
  if (prefs?.notifyDeadlineApproaching === false) return;

  const today = startOfDay();
  const horizon = endOfDay(addDays(today, 2));
  const language = prefs?.language === "EN" ? "EN" : "FA";
  const batch = prefs?.batchDeadlineReminders === true;
  const dayKey = toDateKey(today);

  const mine = {
    OR: [{ assignedToId: uid }, { createdById: uid, assignedToId: null }],
  };

  const tasks = await db.task.findMany({
    where: {
      ...mine,
      status: { not: "DONE" },
      dueDate: { lte: horizon, not: null },
    },
    select: { id: true, title: true, dueDate: true, durationMinutes: true },
    take: 50,
  });

  if (tasks.length === 0) {
    await ensureTimedDueReminders(uid);
    return;
  }

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
        const data = n.data as {
          taskId?: string;
          taskIds?: string[];
          bucket?: string;
        } | null;
        if (!data?.bucket) return null;
        if (data.bucket.startsWith("batch:")) {
          return `batch:${data.bucket}`;
        }
        if (!data?.taskId) return null;
        return `${data.taskId}:${data.bucket}`;
      })
      .filter((k): k is string => !!k),
  );

  type Eligible = {
    id: string;
    title: string;
    dueDate: Date;
    durationMinutes: number | null;
    bucket: DeadlineBucket;
  };

  const eligible: Eligible[] = [];
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const bucket = bucketForDue(
      new Date(task.dueDate),
      today,
      task.durationMinutes,
    );
    if (bucket === "timed") continue;
    const key = `${task.id}:${bucket}`;
    if (already.has(key) || already.has(`${task.id}:any`)) continue;
    eligible.push({
      id: task.id,
      title: task.title,
      dueDate: new Date(task.dueDate),
      durationMinutes: task.durationMinutes ?? null,
      bucket,
    });
  }

  if (batch && eligible.length > 0) {
    const byBucket = new Map<DeadlineBucket, Eligible[]>();
    for (const row of eligible) {
      const list = byBucket.get(row.bucket) ?? [];
      list.push(row);
      byBucket.set(row.bucket, list);
    }

    for (const [bucket, rows] of byBucket) {
      const batchBucket = `batch:${bucket}:${dayKey}`;
      if (already.has(`batch:${batchBucket}`)) continue;

      const count = rows.length;
      const titles = rows
        .slice(0, 3)
        .map(r => r.title)
        .join(language === "EN" ? ", " : "، ");
      const more =
        count > 3
          ? language === "EN"
            ? ` +${count - 3} more`
            : ` و ${count - 3} مورد دیگر`
          : "";

      let title: string;
      if (language === "EN") {
        if (bucket === "overdue")
          title = `${count} overdue · ${titles}${more}`;
        else if (bucket === "today")
          title = `${count} due today · ${titles}${more}`;
        else title = `${count} upcoming deadlines · ${titles}${more}`;
      } else {
        if (bucket === "overdue")
          title = `${count} عقب‌افتاده · ${titles}${more}`;
        else if (bucket === "today")
          title = `${count} مهلت امروز · ${titles}${more}`;
        else title = `${count} مهلت نزدیک · ${titles}${more}`;
      }

      const href = "/dashboard";
      await notify({
        userId: uid,
        type: "DEADLINE_APPROACHING",
        title,
        data: {
          taskIds: rows.map(r => r.id),
          bucket: batchBucket,
          href,
        },
      });
      await sendBaleDeadlineDm(uid, title, {
        id: rows[0]!.id,
        title: rows[0]!.title,
      });
      already.add(`batch:${batchBucket}`);
    }
  } else {
    for (const row of eligible) {
      const key = `${row.id}:${row.bucket}`;
      if (already.has(key)) continue;

      const clockPart = formatClock(row.dueDate, language, row.durationMinutes);
      const dueLabel = [formatJalaliShort(row.dueDate, language), clockPart]
        .filter(Boolean)
        .join(" ");
      let title: string;
      if (language === "EN") {
        if (row.bucket === "overdue") title = `Overdue: ${row.title}`;
        else if (row.bucket === "today")
          title = clockPart
            ? `Due today ${clockPart}: ${row.title}`
            : `Due today: ${row.title}`;
        else title = `Deadline ${dueLabel}: ${row.title}`;
      } else {
        if (row.bucket === "overdue") title = `عقب‌افتاده: ${row.title}`;
        else if (row.bucket === "today")
          title = clockPart
            ? `مهلت امروز ${clockPart}: ${row.title}`
            : `مهلت امروز: ${row.title}`;
        else title = `مهلت ${dueLabel}: ${row.title}`;
      }

      const href = `/tasks?search=${encodeURIComponent(row.title)}`;
      await notify({
        userId: uid,
        type: "DEADLINE_APPROACHING",
        title,
        data: {
          taskId: row.id,
          dueDate: toDateKey(row.dueDate),
          bucket: row.bucket,
          href,
        },
      });
      await sendBaleDeadlineDm(uid, title, { id: row.id, title: row.title });
      already.add(key);
    }
  }

  // Also fire clock-accurate reminders when due is imminent.
  await ensureTimedDueReminders(uid);
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
