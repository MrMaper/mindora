import { prisma as db } from "@/lib/db";
import type { LabelRow } from "./types";

/** Labels for pickers / filters — no task counts (hot path). */
export async function getLabels(): Promise<LabelRow[]> {
  const labels = await db.label.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  return labels.map(l => ({
    id: l.id,
    name: l.name,
    color: l.color,
    taskCount: 0,
  }));
}

/** Labels with task counts — only for management UIs that display counts. */
export async function getLabelsWithCounts(): Promise<LabelRow[]> {
  const labels = await db.label.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { tasks: true } },
    },
  });

  return labels.map(l => ({
    id: l.id,
    name: l.name,
    color: l.color,
    taskCount: l._count.tasks,
  }));
}
