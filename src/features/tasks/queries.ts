import { prisma as db } from "@/lib/db";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { compareTasks } from "./view";
import type {
  GetTasksParams,
  GetTasksResult,
  TaskRow,
  TaskDetail,
} from "./types";

const PAGE_SIZE = 15;
const MEMORY_CAP = 1000;

const userRefSelect = { id: true, name: true, avatar: true } as const;

export function toTaskRow(task: {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  dueDate: Date | null;
  durationMinutes?: number | null;
  waitingOn?: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; name: string; avatar: string | null };
  assignedTo: { id: string; name: string; avatar: string | null } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  projectId: string | null;
  project: { name: string; area?: "PHD" | "WORK" | "LIFE" | "LANG" } | null;
  area?: "PHD" | "WORK" | "LIFE" | "LANG" | null;
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceSeriesId?: string | null;
  recurrenceEndsAt?: Date | null;
}): TaskRow {
  return {
    id: task.id,
    title: task.title,
    status: task.status as TaskRow["status"],
    priority: task.priority as TaskRow["priority"],
    type: task.type as TaskRow["type"],
    dueDate: task.dueDate,
    durationMinutes: task.durationMinutes ?? null,
    waitingOn: task.waitingOn ?? false,
    position: task.position,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdBy: task.createdBy,
    assignedTo: task.assignedTo,
    labels: task.labels.map(l => l.label),
    projectId: task.projectId,
    projectName: task.project?.name ?? null,
    area: task.area ?? task.project?.area ?? null,
    recurrence: task.recurrence ?? "NONE",
    recurrenceSeriesId: task.recurrenceSeriesId ?? null,
    recurrenceEndsAt: task.recurrenceEndsAt ?? null,
  };
}

export async function getTasks(
  params: GetTasksParams,
): Promise<GetTasksResult> {
  const page = Math.max(1, params.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;
  const excludeHub = params.excludeHub !== false;

  const where = {
    ...(params.search
      ? { title: { contains: params.search, mode: "insensitive" as const } }
      : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.assigneeId ? { assignedToId: params.assigneeId } : {}),
    ...(params.labelId
      ? { labels: { some: { labelId: params.labelId } } }
      : {}),
    ...(excludeHub ? taskWhereExcludeHub() : {}),
    AND: [
      {
        OR: [
          { projectId: null },
          { project: { status: { not: "ARCHIVED" as const } } },
        ],
      },
      ...(params.projectIds && params.projectIds.length > 0
        ? [{ projectId: { in: params.projectIds } }]
        : []),
      ...(params.area
        ? [
            {
              OR: [
                { area: params.area },
                { project: { area: params.area } },
              ],
            },
          ]
        : []),
    ],
  };

  const sort = params.sort ?? "createdAt";
  const order = params.order ?? (sort === "createdAt" ? "desc" : "asc");
  const direction = order === "asc" ? "asc" : "desc";
  const orderBy = (() => {
    switch (sort) {
      case "title":
        return { title: direction } as const;
      case "project":
        return { project: { name: direction } } as const;
      case "priority":
        return { priority: direction } as const;
      case "status":
        return { status: direction } as const;
      case "assignee":
        return { assignedTo: { name: direction } } as const;
      case "dueDate":
        return { dueDate: { sort: direction, nulls: "last" as const } } as const;
      default:
        return { createdAt: direction } as const;
    }
  })();

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

  const total = await db.task.count({ where });
  const inMemory = Boolean(params.group) || total <= MEMORY_CAP;

  if (inMemory) {
    const tasks = await db.task.findMany({
      where,
      take: MEMORY_CAP,
      select: taskSelect,
    });
    const sorted = tasks
      .map(toTaskRow)
      .sort((a, b) => compareTasks(a, b, sort, direction));
    if (params.group) {
      return {
        tasks: sorted,
        total: sorted.length,
        page: 1,
        totalPages: 1,
      };
    }
    const start = (page - 1) * PAGE_SIZE;
    return {
      tasks: sorted.slice(start, start + PAGE_SIZE),
      total: sorted.length,
      page,
      totalPages: Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)),
    };
  }

  const tasks = await db.task.findMany({
    where,
    orderBy,
    skip,
    take: PAGE_SIZE,
    select: taskSelect,
  });

  return {
    tasks: tasks.map(toTaskRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  const task = await db.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
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
    },
  });
  if (!task) return null;

  const activity = await db.activityLog.findMany({
    where: { entity: "task", entityId: id },
    orderBy: { timestamp: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      oldValue: true,
      newValue: true,
      timestamp: true,
      user: { select: userRefSelect },
    },
  });

  return {
    ...toTaskRow(task),
    description: task.description,
    activity: activity.map(a => ({
      id: a.id,
      action: a.action,
      oldValue: a.oldValue,
      newValue: a.newValue,
      timestamp: a.timestamp,
      performedBy: a.user,
    })),
  };
}
