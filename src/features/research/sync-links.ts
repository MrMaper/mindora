"use server";

import { prisma as db } from "@/lib/db";
import type { SourceReadingStatus, TaskStatus } from "@/types/db";
import {
  RESEARCH_TASK_TO_DOC_STATUS,
  RESEARCH_TASK_TO_SOURCE_READING,
  SOURCE_READING_TO_DOC,
  SOURCE_READING_TO_TASK,
} from "./status-sync";

/** After a PhD pipeline card moves, mirror status onto linked docs + their sources. */
export async function syncResearchLinksFromTaskStatus(
  taskId: string,
  toStatus: TaskStatus | string,
): Promise<void> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      area: true,
      project: { select: { area: true } },
      docs: { select: { docId: true } },
    },
  });
  if (!task) return;
  const area = task.area ?? task.project?.area ?? null;
  if (area !== "PHD") return;

  const docIds = task.docs.map(d => d.docId);
  if (docIds.length === 0) return;

  const docStatus = RESEARCH_TASK_TO_DOC_STATUS[toStatus];
  const reading = RESEARCH_TASK_TO_SOURCE_READING[toStatus];
  if (!docStatus && !reading) return;

  await Promise.all([
    docStatus
      ? db.doc.updateMany({
          where: { id: { in: docIds }, area: "PHD", deletedAt: null },
          data: { status: docStatus },
        })
      : Promise.resolve(),
    reading
      ? db.docSource.updateMany({
          where: { docId: { in: docIds } },
          data: { readingStatus: reading },
        })
      : Promise.resolve(),
  ]);
}

/**
 * After a library reading status change, mirror onto the single DocTask-linked
 * PhD pipeline card (and keep the host note status aligned).
 */
export async function syncResearchLinksFromSourceReading(
  sourceId: string,
  readingStatus: SourceReadingStatus,
): Promise<void> {
  const source = await db.docSource.findUnique({
    where: { id: sourceId },
    select: { docId: true },
  });
  if (!source) return;

  const nextStatus = SOURCE_READING_TO_TASK[readingStatus];
  const nextDocStatus = SOURCE_READING_TO_DOC[readingStatus];
  if (!nextStatus) return;

  if (nextDocStatus) {
    await db.doc.updateMany({
      where: { id: source.docId, area: "PHD", deletedAt: null },
      data: { status: nextDocStatus },
    });
  }

  const links = await db.docTask.findMany({
    where: { docId: source.docId },
    select: {
      task: {
        select: {
          id: true,
          status: true,
          area: true,
          project: { select: { area: true } },
        },
      },
    },
  });

  const phdTasks = links
    .map(l => l.task)
    .filter(t => {
      const area = t.area ?? t.project?.area ?? null;
      return area === "PHD";
    });

  // One-card policy: if multiple links somehow exist, sync only the first
  // (newest create order is undefined — prefer earliest by id stability).
  const primary = phdTasks[0];
  if (!primary) return;

  await db.task.update({
    where: { id: primary.id },
    data: { status: nextStatus },
  });
}
