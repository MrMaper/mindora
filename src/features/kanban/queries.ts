import { prisma as db } from "@/lib/db";
import { toTaskRow } from "@/features/tasks/queries";
import { taskWhereExcludeHub } from "@/lib/project-namespace";
import { BOARD_STATUSES } from "./types";
import type { BoardColumns, BoardFilters, BoardStatus } from "./types";

const userRefSelect = { id: true, name: true, avatar: true } as const;

export async function getBoardColumns(
  filters: BoardFilters,
  statuses: BoardStatus[] = BOARD_STATUSES,
): Promise<BoardColumns> {
  const excludeHub = filters.excludeHub !== false;

  const where = {
    status: { in: statuses },
    ...(filters.search
      ? { title: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
    ...(filters.assigneeId ? { assignedToId: filters.assigneeId } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.labelId
      ? { labels: { some: { labelId: filters.labelId } } }
      : {}),
    ...(excludeHub ? taskWhereExcludeHub() : {}),
    AND: [
      {
        OR: [
          { projectId: null },
          { project: { status: { not: "ARCHIVED" as const } } },
        ],
      },
      ...(filters.projectIds && filters.projectIds.length > 0
        ? [{ projectId: { in: filters.projectIds } }]
        : []),
      ...(filters.area
        ? [
            {
              OR: [
                { area: filters.area },
                { project: { area: filters.area } },
              ],
            },
          ]
        : []),
    ],
  };

  const tasks = await db.task.findMany({
    where,
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take: filters.limit ?? 400,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      type: true,
      dueDate: true,
      durationMinutes: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      area: true,
      recurrence: true,
      project: { select: { name: true, area: true } },
      createdBy: { select: userRefSelect },
      assignedTo: { select: userRefSelect },
      labels: {
        select: { label: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  const columns = Object.fromEntries(
    statuses.map(s => [s, []]),
  ) as unknown as BoardColumns;
  for (const task of tasks) {
    columns[task.status as BoardStatus].push(toTaskRow(task));
  }
  return columns;
}
