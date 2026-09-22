import { prisma as db } from "@/lib/db";
import type { LifeArea } from "@/types/db";
import type {
  DocDetail,
  DocFolderItem,
  DocListItem,
  DocTagItem,
  WritingPulseItem,
} from "./types";
import { TRASH_RETENTION_DAYS } from "./types";
import { countWords } from "./utils";

function previewFromText(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > 90 ? `${clean.slice(0, 90)}…` : clean;
}

function daysBetween(from: Date, to = new Date()): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function mapTags(
  rows: {
    tag: { id: string; name: string; color: string; description: string | null };
  }[],
): DocTagItem[] {
  return rows.map(r => ({
    id: r.tag.id,
    name: r.tag.name,
    color: r.tag.color,
    description: r.tag.description,
  }));
}

/** Soft-deleted docs older than retention are hard-deleted. */
export async function purgeExpiredTrash(userId: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);
  const result = await db.doc.deleteMany({
    where: {
      userId,
      deletedAt: { not: null, lt: cutoff },
    },
  });
  return result.count;
}

export async function getDocs(
  userId: string,
  opts?: {
    area?: LifeArea | "ALL";
    search?: string;
    archived?: boolean;
    trash?: boolean;
    folderId?: string | null | "NONE";
    tagId?: string;
    /** Research line: null = inbox (no project), string = that project */
    projectId?: string | null | "NONE";
  },
): Promise<DocListItem[]> {
  await purgeExpiredTrash(userId);

  const area = opts?.area && opts.area !== "ALL" ? opts.area : undefined;
  const search = opts?.search?.trim();
  const trash = opts?.trash ?? false;
  const archived = trash ? undefined : (opts?.archived ?? false);

  const docs = await db.doc.findMany({
    where: {
      userId,
      ...(trash
        ? { deletedAt: { not: null } }
        : { deletedAt: null, archived: archived ?? false }),
      ...(area ? { area } : {}),
      ...(opts?.folderId === "NONE"
        ? { folderId: null }
        : opts?.folderId
          ? { folderId: opts.folderId }
          : {}),
      ...(opts?.projectId === "NONE"
        ? { projectId: null }
        : opts?.projectId
          ? { projectId: opts.projectId }
          : {}),
      ...(opts?.tagId ? { tags: { some: { tagId: opts.tagId } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { contentText: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: trash
      ? [{ deletedAt: "desc" }]
      : [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      area: true,
      status: true,
      pinned: true,
      archived: true,
      deletedAt: true,
      folderId: true,
      projectId: true,
      updatedAt: true,
      contentText: true,
      folder: { select: { name: true } },
      project: { select: { name: true } },
      tags: { select: { tag: { select: { id: true, name: true, color: true, description: true } } } },
      _count: { select: { tasks: true } },
    },
  });

  return docs.map(doc => ({
    id: doc.id,
    title: doc.title,
    area: doc.area,
    status: doc.status,
    pinned: doc.pinned,
    archived: doc.archived,
    deletedAt: doc.deletedAt,
    folderId: doc.folderId,
    folderName: doc.folder?.name ?? null,
    projectId: doc.projectId,
    projectName: doc.project?.name ?? null,
    updatedAt: doc.updatedAt,
    preview: previewFromText(doc.contentText),
    taskCount: doc._count.tasks,
    wordCount: countWords(doc.contentText),
    tags: mapTags(doc.tags),
    daysIdle: daysBetween(doc.updatedAt),
  }));
}

export async function getDocById(
  userId: string,
  id: string,
): Promise<DocDetail | null> {
  const doc = await db.doc.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      content: true,
      contentText: true,
      area: true,
      status: true,
      wordGoal: true,
      templateKey: true,
      pinned: true,
      archived: true,
      deletedAt: true,
      folderId: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      folder: { select: { name: true } },
      project: { select: { name: true } },
      tags: { select: { tag: { select: { id: true, name: true, color: true, description: true } } } },
      tasks: {
        select: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
            },
          },
        },
      },
      sources: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          authors: true,
          url: true,
          year: true,
          doi: true,
          notes: true,
          fileUrl: true,
          fileName: true,
          readingStatus: true,
          createdAt: true,
        },
      },
      quotes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          note: true,
          sourceId: true,
          createdAt: true,
          source: { select: { title: true } },
        },
      },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          note: true,
          contentText: true,
          createdAt: true,
        },
      },
    },
  });
  if (!doc) return null;

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    contentText: doc.contentText,
    area: doc.area,
    status: doc.status,
    wordGoal: doc.wordGoal,
    templateKey: doc.templateKey,
    pinned: doc.pinned,
    archived: doc.archived,
    deletedAt: doc.deletedAt,
    folderId: doc.folderId,
    folderName: doc.folder?.name ?? null,
    projectId: doc.projectId,
    projectName: doc.project?.name ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    tasks: doc.tasks.map(row => row.task),
    sources: doc.sources,
    quotes: doc.quotes.map(q => ({
      id: q.id,
      text: q.text,
      note: q.note,
      sourceId: q.sourceId,
      sourceTitle: q.source?.title ?? null,
      createdAt: q.createdAt,
    })),
    versions: doc.versions.map(v => ({
      id: v.id,
      title: v.title,
      note: v.note,
      wordCount: countWords(v.contentText),
      createdAt: v.createdAt,
    })),
    tags: mapTags(doc.tags),
  };
}

export async function getRecentDocs(
  userId: string,
  opts?: {
    limit?: number;
    area?: LifeArea;
    projectId?: string | null | "NONE";
  },
): Promise<DocListItem[]> {
  return getDocs(userId, {
    area: opts?.area ?? "ALL",
    archived: false,
    projectId: opts?.projectId,
  }).then(docs => docs.slice(0, opts?.limit ?? 5));
}

export async function getDocsForTask(
  userId: string,
  taskId: string,
): Promise<{ id: string; title: string; area: LifeArea }[]> {
  const rows = await db.docTask.findMany({
    where: {
      taskId,
      doc: { userId, archived: false, deletedAt: null },
    },
    orderBy: { doc: { updatedAt: "desc" } },
    select: {
      doc: { select: { id: true, title: true, area: true } },
    },
  });
  return rows.map(r => r.doc);
}

export async function getDocsByTaskIds(
  userId: string,
  taskIds: string[],
): Promise<Record<string, { id: string; title: string }[]>> {
  if (taskIds.length === 0) return {};
  const rows = await db.docTask.findMany({
    where: {
      taskId: { in: taskIds },
      doc: { userId, archived: false, deletedAt: null },
    },
    select: {
      taskId: true,
      doc: { select: { id: true, title: true } },
    },
  });
  const map: Record<string, { id: string; title: string }[]> = {};
  for (const row of rows) {
    (map[row.taskId] ??= []).push(row.doc);
  }
  return map;
}

export async function getDocFolders(userId: string): Promise<DocFolderItem[]> {
  const folders = await db.docFolder.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      area: true,
      parentId: true,
      _count: {
        select: {
          docs: { where: { deletedAt: null, archived: false } },
        },
      },
    },
  });
  return folders.map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    area: f.area,
    parentId: f.parentId,
    docCount: f._count.docs,
  }));
}

export async function getDocTags(userId: string): Promise<DocTagItem[]> {
  const tags = await db.docTag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, description: true },
  });
  return tags;
}

/**
 * Writing Pulse — stagnation as a product surface, not a nag toast.
 *
 * Rules (documented for the product report):
 * - Only active writing docs: IDEA / DRAFTING / REVIEW, not READY, not archived/trash
 * - Soft: 3–6 days idle (gentle nudge)
 * - Warn: 7–13 days idle
 * - Critical: 14+ days idle OR drafting with wordGoal and <30% progress after 5+ days
 * - Phrasing focuses on the chapter/doc title, never guilt-trip boilerplate alone
 */
export async function getWritingPulse(
  userId: string,
  opts?: {
    limit?: number;
    area?: LifeArea;
    projectId?: string | null | "NONE";
  },
): Promise<WritingPulseItem[]> {
  const docs = await db.doc.findMany({
    where: {
      userId,
      deletedAt: null,
      archived: false,
      status: { in: ["IDEA", "DRAFTING", "REVIEW"] },
      ...(opts?.area ? { area: opts.area } : {}),
      ...(opts?.projectId === "NONE"
        ? { projectId: null }
        : opts?.projectId
          ? { projectId: opts.projectId }
          : {}),
    },
    orderBy: { updatedAt: "asc" },
    take: 40,
    select: {
      id: true,
      title: true,
      area: true,
      status: true,
      updatedAt: true,
      contentText: true,
      wordGoal: true,
    },
  });

  const items: WritingPulseItem[] = [];
  for (const doc of docs) {
    const daysIdle = daysBetween(doc.updatedAt);
    if (daysIdle < 3) continue;
    const wordCount = countWords(doc.contentText);
    const progress =
      doc.wordGoal && doc.wordGoal > 0 ? wordCount / doc.wordGoal : null;

    let severity: WritingPulseItem["severity"] = "soft";
    if (daysIdle >= 14) severity = "critical";
    else if (daysIdle >= 7) severity = "warn";
    if (
      progress !== null &&
      progress < 0.3 &&
      daysIdle >= 5 &&
      severity === "soft"
    ) {
      severity = "warn";
    }

    const title = doc.title || "بدون عنوان";
    items.push({
      id: doc.id,
      title,
      area: doc.area,
      status: doc.status,
      daysIdle,
      wordCount,
      wordGoal: doc.wordGoal,
      severity,
      reasonFa:
        severity === "critical"
          ? `${daysIdle} روزه سراغ «${title}» نرفتی — وقت یک پاراگراف کوتاه است`
          : severity === "warn"
            ? `${daysIdle} روز از آخرین ویرایش «${title}» گذشته`
            : `۳ روزه روی «${title}» چیزی ننوشتی`,
      reasonEn:
        severity === "critical"
          ? `${daysIdle} days away from “${title}” — one short paragraph counts`
          : severity === "warn"
            ? `${daysIdle} days since you last edited “${title}”`
            : `It’s been 3 days since you wrote in “${title}”`,
    });
  }

  const rank = { critical: 0, warn: 1, soft: 2 } as const;
  items.sort(
    (a, b) =>
      rank[a.severity] - rank[b.severity] || b.daysIdle - a.daysIdle,
  );
  return items.slice(0, opts?.limit ?? 6);
}

export async function searchMentionTargets(
  userId: string,
  query: string,
): Promise<
  { id: string; label: string; kind: "doc" | "task"; href: string }[]
> {
  const q = query.trim();
  const [docs, tasks] = await Promise.all([
    db.doc.findMany({
      where: {
        userId,
        deletedAt: null,
        archived: false,
        ...(q
          ? { title: { contains: q, mode: "insensitive" } }
          : {}),
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    db.task.findMany({
      where: {
        status: { not: "DONE" },
        OR: [{ assignedToId: userId }, { createdById: userId }],
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return [
    ...docs.map(d => ({
      id: d.id,
      label: d.title,
      kind: "doc" as const,
      href: `/docs?id=${d.id}`,
    })),
    ...tasks.map(t => ({
      id: t.id,
      label: t.title,
      kind: "task" as const,
      href: `/tasks`,
    })),
  ];
}
