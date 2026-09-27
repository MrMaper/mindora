import { prisma as db } from "@/lib/db";
import { toTaskRow } from "@/features/tasks/queries";
import {
  addDays,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  toDateKey,
  weekCells,
} from "@/lib/life";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { normalizeFocusSlots } from "@/features/life/focus-slots";
import type { TaskRow } from "@/features/tasks/types";
import type { LifeArea } from "@/types/db";

const userRefSelect = { id: true, name: true, avatar: true } as const;

const taskSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  type: true,
  dueDate: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
  area: true,
  recurrence: true,
  recurrenceSeriesId: true,
  recurrenceEndsAt: true,
  project: { select: { name: true, area: true } },
  createdBy: { select: userRefSelect },
  assignedTo: { select: userRefSelect },
  labels: {
    select: { label: { select: { id: true, name: true, color: true } } },
  },
} as const;

function isOpenStatus(status: string) {
  return status !== "DONE";
}

function withArea(task: Parameters<typeof toTaskRow>[0] & {
  area?: LifeArea | null;
  project?: { name: string; area?: LifeArea } | null;
  recurrence?: string;
}): TaskRow & { area: LifeArea | null; recurrence: string } {
  return {
    ...toTaskRow(task),
    area: (task.area ?? task.project?.area ?? null) as LifeArea | null,
    recurrence: task.recurrence ?? "NONE",
  };
}

export type WeekDayStripItem = {
  dateKey: string;
  date: Date;
  count: number;
  isToday: boolean;
  isPast: boolean;
};

export async function getPersonalDashboard(userId: string) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();
  const yesterdayStart = addDays(todayStart, -1);
  const yesterdayEnd = endOfDay(yesterdayStart);
  const todayKey = toDateKey(todayStart);

  const mine = {
    OR: [{ assignedToId: userId }, { createdById: userId, assignedToId: null }],
  };
  const lifeOnly = { ...mine, ...taskWhereExcludeHub() };

  const [
    overdue,
    today,
    week,
    inbox,
    yesterdayLeftover,
    hoursAgg,
    doneThisWeek,
    weekOpenTasks,
    prefs,
    focusPickRows,
    areaRows,
    vocabDue,
    langWeekAgg,
    langProfile,
    sourcesToRead,
    phdDrafting,
  ] = await Promise.all([
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { not: "DONE" },
        dueDate: { lt: todayStart },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { not: "DONE" },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 20,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { not: "DONE" },
        dueDate: { gte: todayStart, lte: weekEnd },
      },
      orderBy: { dueDate: "asc" },
      take: 30,
      select: taskSelect,
    }),
    db.task.findMany({
      where: { ...lifeOnly, status: "BACKLOG" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { not: "DONE" },
        dueDate: { gte: yesterdayStart, lte: yesterdayEnd },
      },
      orderBy: { priority: "asc" },
      take: 30,
      select: taskSelect,
    }),
    db.workLog.aggregate({
      where: { userId, date: { gte: weekStart, lte: weekEnd } },
      _sum: { hours: true },
    }),
    db.task.count({
      where: {
        ...lifeOnly,
        status: "DONE",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
    }),
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { not: "DONE" },
        dueDate: { gte: weekStart, lte: weekEnd },
      },
      select: { dueDate: true },
    }),
    db.userPreferences.findUnique({
      where: { userId },
      select: { todayFocusDate: true, todayFocusIds: true },
    }),
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { not: "DONE" },
        OR: [
          { dueDate: null },
          { dueDate: { lte: todayEnd } },
        ],
      },
      orderBy: [
        { dueDate: { sort: "asc", nulls: "last" } },
        { priority: "asc" },
        { createdAt: "desc" },
      ],
      take: 40,
      select: taskSelect,
    }),
    db.project.findMany({
      where: {
        id: { in: ["area-work", "area-life", "area-phd", "area-lang"] },
      },
      select: {
        id: true,
        name: true,
        area: true,
        _count: {
          select: {
            tasks: { where: { status: { not: "DONE" } } },
          },
        },
      },
    }),
    db.langCard.count({
      where: { userId, nextReviewAt: { lte: new Date() } },
    }),
    db.langSession.aggregate({
      where: {
        userId,
        practicedAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { minutes: true },
    }),
    db.langProfile.findUnique({
      where: { userId },
      select: { weeklyGoalMin: true },
    }),
    db.docSource.count({
      where: {
        doc: { userId, area: "PHD", deletedAt: null },
        readingStatus: { in: ["TO_READ", "READING"] },
      },
    }),
    db.doc.count({
      where: {
        userId,
        area: "PHD",
        deletedAt: null,
        archived: false,
        status: { in: ["IDEA", "DRAFTING", "REVIEW"] },
      },
    }),
  ]);

  const countByDay = new Map<string, number>();
  for (const task of weekOpenTasks) {
    if (!task.dueDate) continue;
    const key = toDateKey(new Date(task.dueDate));
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  const weekDays: WeekDayStripItem[] = weekCells(todayStart).map(date => {
    const dateKey = toDateKey(date);
    return {
      dateKey,
      date,
      count: countByDay.get(dateKey) ?? 0,
      isToday: dateKey === todayKey,
      isPast: date.getTime() < todayStart.getTime(),
    };
  });

  // Stale focus from another day → treat as empty (no write during RSC render)
  const storedIds =
    prefs?.todayFocusDate === todayKey ? [...(prefs.todayFocusIds ?? [])] : [];
  const slotIds = normalizeFocusSlots(storedIds);
  const realSlotIds = slotIds.filter((id): id is string => !!id);
  const focusRows = realSlotIds.length
    ? await db.task.findMany({
        where: { id: { in: realSlotIds }, ...mine },
        select: taskSelect,
      })
    : [];
  const focusById = new Map(focusRows.map(row => [row.id, withArea(row)]));
  const focusTasks = slotIds.map(id => (id ? focusById.get(id) ?? null : null));
  const focusIdSet = new Set(
    focusTasks.flatMap(task => (task ? [task.id] : [])),
  );

  const todayRows = today.map(withArea);
  const overdueRows = overdue.map(withArea);
  const weekRows = week.map(withArea);

  return {
    overdue: overdueRows.filter(task => !focusIdSet.has(task.id)),
    today: todayRows.filter(t => !focusIdSet.has(t.id)),
    week: weekRows.filter(t => {
      const key = t.dueDate ? toDateKey(new Date(t.dueDate)) : "";
      return key !== todayKey && !focusIdSet.has(t.id);
    }),
    inbox: inbox.map(withArea).filter(task => !focusIdSet.has(task.id)),
    yesterdayLeftover: yesterdayLeftover.map(withArea),
    focusIds: focusTasks.flatMap(task => (task ? [task.id] : [])),
    focusTasks,
    focusCandidates: focusPickRows
      .map(withArea)
      .filter(task => !focusIdSet.has(task.id)),
    weekDays,
    hoursThisWeek: hoursAgg._sum.hours ?? 0,
    doneThisWeek,
    openCount: overdueRows.length + todayRows.length + inbox.length,
    areas: areaRows.map(row => ({
      id: row.id,
      name: row.name,
      area: row.area,
      openTasks: row._count.tasks,
    })),
    attention: {
      vocabDue,
      langWeekMinutes: langWeekAgg._sum.minutes ?? 0,
      langWeeklyGoal: langProfile?.weeklyGoalMin ?? 0,
      hasLangGoal: (langProfile?.weeklyGoalMin ?? 0) > 0,
      sourcesToRead,
      phdDrafting,
    },
    weekStart,
    weekEnd,
    todayKey,
  };
}

export async function getCalendarTasks(userId: string, from: Date, to: Date) {
  const tasks = await db.task.findMany({
    where: {
      OR: [{ assignedToId: userId }, { createdById: userId }],
      dueDate: { gte: from, lte: to },
      ...taskWhereExcludeHub(),
    },
    orderBy: { dueDate: "asc" },
    select: taskSelect,
  });
  return tasks.map(withArea);
}

export async function getWeeklyReview(userId: string) {
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();
  const mine = {
    OR: [{ assignedToId: userId }, { createdById: userId }],
  };
  const lifeOnly = { ...mine, ...taskWhereExcludeHub() };

  const [completed, leftover, inbox] = await Promise.all([
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: "DONE",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        ...lifeOnly,
        status: { in: ["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "TESTING"] },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
      take: 40,
      select: taskSelect,
    }),
    db.task.findMany({
      where: { ...lifeOnly, status: "BACKLOG" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: taskSelect,
    }),
  ]);

  const hours = await db.workLog.aggregate({
    where: { userId, date: { gte: weekStart, lte: weekEnd } },
    _sum: { hours: true },
  });

  return {
    completed: completed.map(withArea),
    leftover: leftover.map(withArea),
    inbox: inbox.map(withArea),
    hoursThisWeek: hours._sum.hours ?? 0,
    weekStart,
    weekEnd,
  };
}

export { isOpenStatus };
