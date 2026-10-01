import { prisma as db } from "@/lib/db";
import type { SourceReadingStatus, TaskStatus } from "@/types/db";
import { completedAtWrite } from "@/features/tasks/completed-at";
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
      docs: {
        select: {
          docId: true,
          doc: { select: { templateKey: true } },
        },
      },
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

  // Only paint readingStatus on per-paper source notes — not every cited host.
  const sourceNoteIds = task.docs
    .filter(d => d.doc.templateKey === "sourceNote")
    .map(d => d.docId);

  await Promise.all([
    docStatus
      ? db.doc.updateMany({
          where: { id: { in: docIds }, area: "PHD", deletedAt: null },
          data: { status: docStatus },
        })
      : Promise.resolve(),
    reading && sourceNoteIds.length > 0
      ? db.docSource.updateMany({
          where: { docId: { in: sourceNoteIds } },
          data: { readingStatus: reading },
        })
      : Promise.resolve(),
  ]);
}

/**
 * After a library reading status change, mirror onto the single DocTask-linked
 * PhD pipeline card (and keep linked note statuses aligned).
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
    orderBy: { taskId: "asc" },
  });

  const phdTasks = links
    .map(l => l.task)
    .filter(t => {
      const area = t.area ?? t.project?.area ?? null;
      return area === "PHD";
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const primary = phdTasks[0];
  if (!primary) {
    if (nextDocStatus) {
      await db.doc.updateMany({
        where: { id: source.docId, area: "PHD", deletedAt: null },
        data: { status: nextDocStatus },
      });
    }
    return;
  }

  // Writing (IN_PROGRESS) maps forward to READING — never demote on READING re-sync.
  if (
    readingStatus === "READING" &&
    (primary.status === "IN_PROGRESS" || primary.status === "REVIEW")
  ) {
    return;
  }

  // No-op when already aligned — avoid rewriting sibling docs unnecessarily.
  if (primary.status === nextStatus) {
    if (nextDocStatus) {
      await db.doc.updateMany({
        where: { id: source.docId, area: "PHD", deletedAt: null },
        data: { status: nextDocStatus },
      });
    }
    return;
  }

  await db.task.update({
    where: { id: primary.id },
    data: {
      status: nextStatus,
      ...(completedAtWrite(primary.status, nextStatus) ?? {}),
    },
  });

  // Align every DocTask-linked PHD doc on this card (idea + source note).
  const siblingDocs = await db.docTask.findMany({
    where: { taskId: primary.id },
    select: { docId: true },
  });
  const siblingIds = siblingDocs.map(d => d.docId);
  const taskDocStatus = RESEARCH_TASK_TO_DOC_STATUS[nextStatus];
  if (taskDocStatus && siblingIds.length > 0) {
    await db.doc.updateMany({
      where: { id: { in: siblingIds }, area: "PHD", deletedAt: null },
      data: { status: taskDocStatus },
    });
  } else if (nextDocStatus) {
    await db.doc.updateMany({
      where: { id: source.docId, area: "PHD", deletedAt: null },
      data: { status: nextDocStatus },
    });
  }
}
