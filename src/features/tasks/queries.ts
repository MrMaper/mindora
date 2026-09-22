import { prisma as db } from "@/lib/db";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import type {
  GetTasksParams,
  GetTasksResult,
  TaskRow,
  TaskDetail,
} from "./types";

const PAGE_SIZE = 15;

const userRefSelect = { id: true, name: true, avatar: true } as const;

export function toTaskRow(task: {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  dueDate: Date | null;
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
    ...(params.projectIds && params.projectIds.length > 0
      ? { projectId: { in: params.projectIds } }
      : {}),
    ...(excludeHub ? taskWhereExcludeHub() : {}),
    OR: [
      { projectId: null },
      { project: { status: { not: "ARCHIVED" as const } } },
    ],
  };

  const orderBy = (() => {
    switch (params.sort) {
      case "title":
        return { title: params.order ?? "asc" } as const;
      case "priority":
        return { priority: params.order ?? "asc" } as const;
      case "status":
        return { status: params.order ?? "asc" } as const;
      case "dueDate":
        return { dueDate: params.order ?? "asc" } as const;
      default:
        return { createdAt: params.order ?? "desc" } as const;
    }
  })();

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
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
      },
    }),
    db.task.count({ where }),
  ]);

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
