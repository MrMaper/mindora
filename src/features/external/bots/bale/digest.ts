import { prisma as db } from "@/lib/db";
import { endOfDay, startOfDay, toDateKey } from "@/lib/life";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { getBaleRuntime } from "./config";
import { baleAppOrigin, deliverBale } from "./deliver";

function lines(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `${title}\n${items.map((item) => `• ${item}`).join("\n")}\n`;
}

export async function ensureBaleDigest(userId: string): Promise<void> {
  const runtime = await getBaleRuntime();
  if (!runtime.enabled || !runtime.notifyDigest) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      baleUserId: true,
      preferences: {
        select: {
          notifications: true,
          baleDigestHour: true,
          baleDigestSentOn: true,
          todayFocusDate: true,
          todayFocusIds: true,
          language: true,
        },
      },
    },
  });
  if (!user?.baleUserId) return;
  if (user.preferences?.notifications === false) return;

  const now = new Date();
  const todayKey = toDateKey(now);
  const hour = user.preferences?.baleDigestHour ?? 8;
  if (now.getHours() < hour) return;
  if (user.preferences?.baleDigestSentOn === todayKey) return;

  const mine = {
    OR: [{ assignedToId: userId }, { createdById: userId, assignedToId: null }],
  };
  const today = startOfDay(now);
  const focusIds =
    user.preferences?.todayFocusDate === todayKey
      ? (user.preferences.todayFocusIds ?? []).filter(Boolean)
      : [];

  const [focusTasks, overdue, dueToday, habits] = await Promise.all([
    focusIds.length
      ? db.task.findMany({
          where: { id: { in: focusIds }, status: { not: "DONE" } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    db.task.findMany({
      where: {
        ...mine,
        ...taskWhereExcludeHub(),
        status: { not: "DONE" },
        dueDate: { lt: today },
      },
      select: { title: true },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    db.task.findMany({
      where: {
        ...mine,
        ...taskWhereExcludeHub(),
        status: { not: "DONE" },
        dueDate: { gte: today, lte: endOfDay(today) },
      },
      select: { title: true },
      take: 8,
    }),
    db.habit.findMany({
      where: {
        userId,
        archivedAt: null,
        logs: { none: { dateKey: todayKey } },
      },
      select: { title: true },
      take: 8,
    }),
  ]);

  const focusById = new Map(focusTasks.map((task) => [task.id, task.title]));
  const focusTitles = focusIds
    .map((id) => focusById.get(id))
    .filter((title): title is string => !!title);

  const fa = user.preferences?.language !== "EN";
  const body = [
    fa ? "خلاصهٔ صبح" : "Morning brief",
    "",
    lines(fa ? "اولویت‌ها" : "Priorities", focusTitles),
    lines(fa ? "عقب‌افتاده" : "Overdue", overdue.map((task) => task.title)),
    lines(fa ? "سررسید امروز" : "Due today", dueToday.map((task) => task.title)),
    lines(fa ? "عادت تیک‌نخورده" : "Habits still open", habits.map((habit) => habit.title)),
    focusTitles.length + overdue.length + dueToday.length + habits.length === 0
      ? fa
        ? "میز امروز خالی است."
        : "Nothing is waiting today."
      : "",
    `${baleAppOrigin()}/dashboard`,
  ]
    .filter((part) => part !== "")
    .join("\n");

  const sent = await deliverBale({
    chatId: user.baleUserId,
    text: body.trim(),
    kind: "digest",
  });
  if (!sent) return;

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, baleDigestSentOn: todayKey },
    update: { baleDigestSentOn: todayKey },
  });
}

export async function ensureBaleHabitNudge(userId: string): Promise<void> {
  const runtime = await getBaleRuntime();
  if (!runtime.enabled || !runtime.notifyHabits) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      baleUserId: true,
      preferences: {
        select: {
          notifications: true,
          baleHabitHour: true,
          baleHabitSentOn: true,
          language: true,
        },
      },
    },
  });
  if (!user?.baleUserId) return;
  if (user.preferences?.notifications === false) return;

  const now = new Date();
  const todayKey = toDateKey(now);
  const hour = user.preferences?.baleHabitHour ?? 21;
  if (now.getHours() < hour) return;
  if (user.preferences?.baleHabitSentOn === todayKey) return;

  const habits = await db.habit.findMany({
    where: {
      userId,
      archivedAt: null,
      logs: { none: { dateKey: todayKey } },
    },
    select: { title: true },
    take: 12,
  });

  if (habits.length === 0) {
    await db.userPreferences.upsert({
      where: { userId },
      create: { userId, baleHabitSentOn: todayKey },
      update: { baleHabitSentOn: todayKey },
    });
    return;
  }

  const fa = user.preferences?.language !== "EN";
  const text = [
    fa ? "عادت‌هایی که امروز تیک نخورده‌اند" : "Habits still open today",
    ...habits.map((habit) => `• ${habit.title}`),
    `${baleAppOrigin()}/dashboard`,
  ].join("\n");

  const sent = await deliverBale({
    chatId: user.baleUserId,
    text,
    kind: "habit",
  });
  if (!sent) return;

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, baleHabitSentOn: todayKey },
    update: { baleHabitSentOn: todayKey },
  });
}

export async function runBaleDigestsForAllUsers(): Promise<{ users: number }> {
  const users = await db.user.findMany({
    where: { status: "ACTIVE", baleUserId: { not: null } },
    select: { id: true },
  });
  for (const user of users) {
    await ensureBaleDigest(user.id);
    await ensureBaleHabitNudge(user.id);
  }
  return { users: users.length };
}
