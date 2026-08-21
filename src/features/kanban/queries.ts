import { prisma as db } from "@/lib/db";
import { toTaskRow } from "@/features/tasks/queries";
import { BOARD_STATUSES } from "./types";
import type { BoardColumns, BoardFilters, BoardStatus } from "./types";

const userRefSelect = { id: true, name: true, avatar: true } as const;

export async function getBoardColumns(filters: BoardFilters): Promise<BoardColumns> {
  const where = {
    status: { in: BOARD_STATUSES },
    ...(filters.search
      ? { title: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
    ...(filters.assigneeId ? { assignedToId: filters.assigneeId } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.labelId ? { labels: { some: { labelId: filters.labelId } } } : {}),
    ...(filters.projectIds && filters.projectIds.length > 0
      ? { projectId: { in: filters.projectIds } }
      : {}),
    // Exclude archived projects
    project: { isNot: { status: "ARCHIVED" as const } },
    // Exclude orphaned tasks (projectId set but project deleted)
    OR: [
      { projectId: null },
      { project: { isNot: null } },
    ],
  };

  const tasks = await db.task.findMany({
    where,
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
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
      project: { select: { name: true } },
      createdBy: { select: userRefSelect },
      assignedTo: { select: userRefSelect },
      labels: { select: { label: { select: { id: true, name: true, color: true } } } },
    },
  });

  const columns = Object.fromEntries(BOARD_STATUSES.map(s => [s, []])) as unknown as BoardColumns;
  for (const task of tasks) {
    columns[task.status as BoardStatus].push(toTaskRow(task));
  }
  return columns;
}
