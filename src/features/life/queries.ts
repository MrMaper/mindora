import { prisma as db } from "@/lib/db";
import { toTaskRow } from "@/features/tasks/queries";
import {
  endOfZonedDay,
  endOfZonedWeek,
  isOverdueTask,
  startOfZonedDay,
  startOfZonedWeek,
  toDueDateKey,
  zonedDateKey,
  zonedWeekCells,
  areaProjectIdsForUser,
  LIFE_AREAS,
} from "@/lib/life";
import {
  personalLifeTaskWhere,
  personalTaskOwnership,
} from "@/lib/task-access";
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
  durationMinutes: true,
  waitingOn: true,
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

export async function getPersonalDashboard(
  userId: string,
  modules?: { language?: boolean; research?: boolean },
) {
  // Asia/Tehran day — UTC hosts must not starve "today" / hub picks after Iran midnight.
  const todayStart = startOfZonedDay();
  const todayEnd = endOfZonedDay();
  const weekStart = startOfZonedWeek();
  const weekEnd = endOfZonedWeek();
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const yesterdayEnd = new Date(todayStart.getTime() - 1);
  const todayKey = zonedDateKey();

  const mine = personalTaskOwnership(userId);
  const lifeOnly = personalLifeTaskWhere(userId);
  const personalAreaIds = Object.values(areaProjectIdsForUser(userId));
  const wantLanguage = modules?.language !== false;
  const wantResearch = modules?.research !== false;

  const [
    overdue,
    today,
    week,
    inbox,
    waiting,
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
        AND: [
          mine,
          { status: { not: "DONE" } },
          { waitingOn: false },
          { dueDate: { lt: todayStart } },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        AND: [
          lifeOnly,
          { status: { not: "DONE" } },
          { waitingOn: false },
          { dueDate: { gte: todayStart, lte: todayEnd } },
        ],
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 20,
      select: taskSelect,
    }),
    // Same Sat–Fri window as the week strip, including earlier days of this week.
    db.task.findMany({
      where: {
        AND: [
          mine,
          { status: { not: "DONE" } },
          { waitingOn: false },
          { dueDate: { gte: weekStart, lte: weekEnd } },
        ],
      },
      orderBy: { dueDate: "asc" },
      take: 30,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        AND: [lifeOnly, { status: "BACKLOG" }, { waitingOn: false }],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        AND: [
          mine,
          { waitingOn: true },
          { status: { not: "DONE" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        AND: [
          lifeOnly,
          { status: { not: "DONE" } },
          { waitingOn: false },
          { dueDate: { gte: yesterdayStart, lte: yesterdayEnd } },
        ],
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
        AND: [
          lifeOnly,
          { status: "DONE" },
          { updatedAt: { gte: weekStart, lte: weekEnd } },
        ],
      },
    }),
    // Week-load bars and area %: open tasks due this Sat–Fri, every area.
    db.task.findMany({
      where: {
        AND: [
          mine,
          { status: { not: "DONE" } },
          { dueDate: { gte: weekStart, lte: weekEnd } },
        ],
      },
      select: {
        dueDate: true,
        durationMinutes: true,
        area: true,
        project: { select: { area: true } },
      },
    }),
    db.userPreferences.findUnique({
      where: { userId },
      select: { todayFocusDate: true, todayFocusIds: true },
    }),
    // Focus picks and the work queue include every owned area. Inbox and Today stay life-only.
    // CRITICAL: due-date OR must live under AND with ownership — never overwrite mine.OR
    // Split buckets so a long overdue list cannot starve today / undated picks.
    Promise.all([
      db.task.findMany({
        where: {
          AND: [
            mine,
            { status: { not: "DONE" } },
            { waitingOn: false },
            { dueDate: { gte: todayStart, lte: todayEnd } },
          ],
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 25,
        select: taskSelect,
      }),
      db.task.findMany({
        where: {
          AND: [
            mine,
            { status: { not: "DONE" } },
            { waitingOn: false },
            { dueDate: null },
          ],
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 15,
        select: taskSelect,
      }),
      db.task.findMany({
        where: {
          AND: [
            mine,
            { status: { not: "DONE" } },
            { waitingOn: false },
            { dueDate: { lt: todayStart } },
          ],
        },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        take: 20,
        select: taskSelect,
      }),
    ]).then(([dueToday, undated, pastDue]) => [...dueToday, ...undated, ...pastDue]),
    db.project.findMany({
      where: { id: { in: personalAreaIds } },
      select: {
        id: true,
        name: true,
        area: true,
      },
    }),
    wantLanguage
      ? db.langCard.count({
          where: { userId, nextReviewAt: { lte: new Date() } },
        })
      : Promise.resolve(0),
    wantLanguage
      ? db.langSession.aggregate({
          where: {
            userId,
            practicedAt: { gte: weekStart, lte: weekEnd },
          },
          _sum: { minutes: true },
        })
      : Promise.resolve({ _sum: { minutes: null as number | null } }),
    wantLanguage
      ? db.langProfile.findUnique({
          where: { userId },
          select: { weeklyGoalMin: true },
        })
      : Promise.resolve(null),
    wantResearch
      ? db.docSource.count({
          where: {
            doc: { userId, area: "PHD", deletedAt: null },
            readingStatus: { in: ["TO_READ", "READING"] },
          },
        })
      : Promise.resolve(0),
    wantResearch
      ? db.doc.count({
          where: {
            userId,
            area: "PHD",
            deletedAt: null,
            archived: false,
            status: { in: ["IDEA", "DRAFTING", "REVIEW"] },
            OR: [
              { systemKey: null },
              { NOT: { systemKey: { startsWith: "phd-library:" } } },
            ],
          },
        })
      : Promise.resolve(0),
  ]);

  const countByDay = new Map<string, number>();
  const openByArea: Record<LifeArea, number> = {
    PHD: 0,
    WORK: 0,
    LIFE: 0,
    LANG: 0,
  };
  for (const task of weekOpenTasks) {
    if (!task.dueDate) continue;
    const key = toDueDateKey(new Date(task.dueDate), task.durationMinutes);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    const area = (task.area ?? task.project?.area ?? null) as LifeArea | null;
    if (area && LIFE_AREAS.includes(area)) openByArea[area] += 1;
  }

  const weekDays: WeekDayStripItem[] = zonedWeekCells().map(date => {
    const dateKey = zonedDateKey(date);
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
        where: { AND: [{ id: { in: realSlotIds } }, mine] },
        select: taskSelect,
      })
    : [];
  const focusById = new Map(focusRows.map(row => [row.id, withArea(row)]));
  const focusTasks = slotIds.map(id => (id ? focusById.get(id) ?? null : null));
  const focusIdSet = new Set(
    focusTasks.flatMap(task => (task ? [task.id] : [])),
  );

  const todayRowsRaw = today.map(withArea);
  const overduePastDays = overdue.map(withArea);
  const now = new Date();
  // Timed dues that already passed today belong in overdue, not "today".
  // Date-only (noon) stays in today until the calendar day ends.
  const timedOverdueToday = todayRowsRaw.filter(task => isOverdueTask(task, now));
  const todayRows = todayRowsRaw.filter(task => !isOverdueTask(task, now));
  const overdueRows = [...overduePastDays, ...timedOverdueToday].sort((a, b) => {
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return aDue - bDue;
  });
  const weekRows = week.map(withArea);

  return {
    overdue: overdueRows,
    today: todayRows.filter(t => !focusIdSet.has(t.id)),
    week: weekRows,
    inbox: inbox.map(withArea).filter(task => !focusIdSet.has(task.id)),
    waiting: waiting.map(withArea),
    yesterdayLeftover: yesterdayLeftover.map(withArea),
    focusIds: focusTasks.flatMap(task => (task ? [task.id] : [])),
    focusTasks,
    focusCandidates: focusPickRows
      .map(withArea)
      .filter(task => !focusIdSet.has(task.id)),
    weekDays,
    hoursThisWeek: hoursAgg._sum.hours ?? 0,
    doneThisWeek,
    openCount:
      overdueRows.length + todayRows.length + inbox.length + waiting.length,
    areas: areaRows.map(row => ({
      id: row.id,
      name: row.name,
      area: row.area,
      openTasks: row.area ? openByArea[row.area as LifeArea] ?? 0 : 0,
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
      AND: [
        personalTaskOwnership(userId),
        { dueDate: { gte: from, lte: to } },
      ],
    },
    orderBy: { dueDate: "asc" },
    select: taskSelect,
  });
  return tasks.map(withArea);
}

export async function getWeeklyReview(userId: string) {
  const weekStart = startOfZonedWeek();
  const weekEnd = endOfZonedWeek();
  const lifeOnly = personalLifeTaskWhere(userId);

  const [completed, leftover, inbox] = await Promise.all([
    db.task.findMany({
      where: {
        AND: [
          lifeOnly,
          { status: "DONE" },
          { updatedAt: { gte: weekStart, lte: weekEnd } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        AND: [
          lifeOnly,
          { status: { in: ["TODO", "IN_PROGRESS"] } },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
      take: 40,
      select: taskSelect,
    }),
    db.task.findMany({
      where: {
        AND: [lifeOnly, { status: "BACKLOG" }, { waitingOn: false }],
      },
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
