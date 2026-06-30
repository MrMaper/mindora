import { prisma as db } from "@/lib/db";
import type { LabelRow } from "./types";

export async function getLabels(): Promise<LabelRow[]> {
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
