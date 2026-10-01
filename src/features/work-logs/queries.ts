import { prisma as db } from "@/lib/db";
import type { GetWorkLogsParams, GetWorkLogsResult, WorkLogRow, WorkLogDetail, WorkLogSummary } from "./types";
import { zonedDateKey } from "@/lib/life";

const PAGE_SIZE = 20;

function taskScope(params: GetWorkLogsParams): Record<string, unknown> | undefined {
  if (!params.projectId && !params.area) return undefined;
  return {
    AND: [
      ...(params.projectId ? [{ projectId: params.projectId }] : []),
      ...(params.area
        ? [
            {
              OR: [{ area: params.area }, { project: { area: params.area } }],
            },
          ]
        : []),
    ],
  };
}

const userRefSelect = { id: true, name: true, avatar: true } as const;

export function toWorkLogRow(workLog: {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatar: string | null };
}): WorkLogRow {
  return {
    id: workLog.id,
    taskId: workLog.taskId,
    userId: workLog.userId,
    hours: workLog.hours,
    date: workLog.date,
    description: workLog.description,
    createdAt: workLog.createdAt,
    updatedAt: workLog.updatedAt,
    user: workLog.user,
  };
}

export async function getWorkLogs(params: GetWorkLogsParams): Promise<GetWorkLogsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.taskId) where.taskId = params.taskId;
  if (params.userId) where.userId = params.userId;
  const scoped = taskScope(params);
  if (scoped) where.task = scoped;
  if (params.dateFrom || params.dateTo) {
    where.date = {};
    if (params.dateFrom) (where.date as Record<string, Date>).gte = params.dateFrom;
    if (params.dateTo) (where.date as Record<string, Date>).lte = params.dateTo;
  }

  const orderBy = (() => {
    switch (params.sort) {
      case "hours":
        return { hours: params.order ?? "desc" } as const;
      case "createdAt":
        return { createdAt: params.order ?? "desc" } as const;
      default:
        return { date: params.order ?? "desc" } as const;
    }
  })();

  const [workLogs, total] = await Promise.all([
    db.workLog.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        taskId: true,
        userId: true,
        hours: true,
        date: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: { select: userRefSelect },
      },
    }),
    db.workLog.count({ where }),
  ]);

  return {
    workLogs: workLogs.map(toWorkLogRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getWorkLogById(id: string): Promise<WorkLogDetail | null> {
  const workLog = await db.workLog.findUnique({
    where: { id },
    select: {
      id: true,
      taskId: true,
      userId: true,
      hours: true,
      date: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      user: { select: userRefSelect },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          projectId: true,
        },
      },
    },
  });

  if (!workLog) return null;

  return {
    ...toWorkLogRow(workLog),
    task: workLog.task,
  };
}

export async function getWorkLogsByTaskId(taskId: string): Promise<WorkLogRow[]> {
  const workLogs = await db.workLog.findMany({
    where: { taskId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      taskId: true,
      userId: true,
      hours: true,
      date: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      user: { select: userRefSelect },
    },
  });

  return workLogs.map(toWorkLogRow);
}

export async function getTotalHoursByTask(taskId: string): Promise<number> {
  const result = await db.workLog.aggregate({
    where: { taskId },
    _sum: { hours: true },
  });
  return result._sum.hours ?? 0;
}

export async function getWorkLogSummary(params: GetWorkLogsParams): Promise<WorkLogSummary> {
  const where: Record<string, unknown> = {};

  if (params.taskId) where.taskId = params.taskId;
  if (params.userId) where.userId = params.userId;
  const scoped = taskScope(params);
  if (scoped) where.task = scoped;
  if (params.dateFrom || params.dateTo) {
    where.date = {};
    if (params.dateFrom) (where.date as Record<string, Date>).gte = params.dateFrom;
    if (params.dateTo) (where.date as Record<string, Date>).lte = params.dateTo;
  }

  const workLogs = await db.workLog.findMany({
    where,
    select: {
      hours: true,
      date: true,
      user: { select: userRefSelect },
      task: { select: { id: true, title: true, projectId: true, project: { select: { name: true } } } },
    },
  });

  const summary: WorkLogSummary = {
    totalHours: 0,
    totalEntries: workLogs.length,
    byUser: {},
    byTask: {},
    byProject: {},
    byDate: {},
  };

  for (const wl of workLogs) {
    summary.totalHours += wl.hours;

    const userKey = wl.user.id;
    if (!summary.byUser[userKey]) {
      summary.byUser[userKey] = { user: wl.user, hours: 0 };
    }
    summary.byUser[userKey].hours += wl.hours;

    const taskKey = wl.task.id;
    if (!summary.byTask[taskKey]) {
      summary.byTask[taskKey] = { taskTitle: wl.task.title, hours: 0 };
    }
    summary.byTask[taskKey].hours += wl.hours;

    if (wl.task.projectId) {
      const projectKey = wl.task.projectId;
      const projectName = wl.task.project?.name ?? "Unknown";
      if (!summary.byProject[projectKey]) {
        summary.byProject[projectKey] = { projectName, hours: 0 };
      }
      summary.byProject[projectKey].hours += wl.hours;
    }

    const dateKey = zonedDateKey(new Date(wl.date));
    summary.byDate[dateKey] = (summary.byDate[dateKey] ?? 0) + wl.hours;
  }

  return summary;
}