import { prisma as db } from "@/lib/db";

/**
 * Enforce one PhD pipeline card per source note, and at most one source-note
 * per card (writing/idea docs may stay linked).
 */
export async function replacePhdDocTaskLinks(
  noteDocId: string,
  taskId: string,
): Promise<void> {
  const existing = await db.docTask.findMany({
    where: {
      docId: noteDocId,
      task: {
        OR: [{ area: "PHD" }, { project: { area: "PHD" } }],
      },
    },
    select: { taskId: true },
  });
  const stale = existing.filter(e => e.taskId !== taskId).map(e => e.taskId);
  if (stale.length > 0) {
    await db.docTask.deleteMany({
      where: { docId: noteDocId, taskId: { in: stale } },
    });
  }

  await db.docTask.deleteMany({
    where: {
      taskId,
      docId: { not: noteDocId },
      doc: { templateKey: "sourceNote" },
    },
  });

  await db.docTask.upsert({
    where: { docId_taskId: { docId: noteDocId, taskId } },
    create: { docId: noteDocId, taskId },
    update: {},
  });
}
