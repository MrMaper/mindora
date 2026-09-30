"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import type { LifeArea, SourceReadingStatus } from "@/types/db";
import { ensureHeadingIds, htmlToPlainText } from "@/features/docs/utils";
import { getDocTemplate } from "@/features/docs/templates";
import {
  getAggregatedPhdSources,
  getResearchHubData,
  listPhdResearchProjects,
} from "./queries";
import type {
  ResearchHubData,
  ResearchProjectItem,
  ResearchProjectScope,
  ResearchSourceItem,
} from "./types";
import { formatApaLike, normalizeDoi } from "./cite";
import { dueFromWallClock, isUserAreaBucket, personalAreaProjectId } from "@/lib/life";
import {
  ensurePersonalWorkspace,
} from "@/features/life/workspace";
import {
  isLibraryBinderSystemKey,
  SOURCE_READING_TO_DOC,
  SOURCE_READING_TO_TASK,
} from "./status-sync";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

function revalidateResearch(opts?: {
  docs?: boolean;
  docId?: string;
  projects?: boolean;
}) {
  revalidatePath("/research");
  if (opts?.docs || opts?.docId) revalidatePath("/docs");
  if (opts?.docId) revalidatePath(`/docs/${opts.docId}`);
  if (opts?.projects) revalidatePath("/projects");
}

export async function getResearchHubAction(
  scope: ResearchProjectScope = "all",
): Promise<ResearchHubData | null> {
  const session = await auth();
  if (!session?.user) return null;
  return getResearchHubData(session.user.id, scope);
}

export async function listPhdResearchProjectsAction(): Promise<
  ResearchProjectItem[]
> {
  const session = await auth();
  if (!session?.user) return [];
  return listPhdResearchProjects(session.user.id);
}

export async function createResearchProjectAction(input: {
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const name = input.name.trim();
  if (!name) return { success: false, error: "نام مسیر لازم است" };

  const project = await db.project.create({
    data: {
      name,
      description: input.description?.trim() || null,
      status: "ACTIVE",
      area: "PHD",
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    select: { id: true },
  });

  revalidateResearch({ projects: true });
  return { success: true, data: { id: project.id } };
}

export async function listResearchSourcesAction(opts?: {
  search?: string;
  readingStatus?: SourceReadingStatus | "ALL";
  projectId?: string | null | "NONE";
}): Promise<ResearchSourceItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getAggregatedPhdSources(session.user.id, opts);
}

export async function createDocLinkedToTask(input: {
  taskId: string;
  title?: string;
  templateKey?: "researchIdea" | "chapterDraft" | "sourceNote" | "litReview";
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const task = await db.task.findFirst({
    where: {
      id: input.taskId,
      OR: [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
      ],
    },
    select: { id: true, title: true, projectId: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };

  const template = input.templateKey
    ? getDocTemplate(input.templateKey)
    : getDocTemplate("researchIdea");
  const title = (input.title ?? "").trim() || task.title || template.titleFa;
  const content = ensureHeadingIds(template.content);

  let projectId = input.projectId ?? null;
  if (
    !projectId &&
    task.projectId &&
    !isUserAreaBucket(task.projectId, session.user.id, "PHD")
  ) {
    const member = await db.projectMember.findFirst({
      where: {
        userId: session.user.id,
        projectId: task.projectId,
        project: { area: "PHD" },
      },
      select: { id: true },
    });
    if (member) projectId = task.projectId;
  }

  const doc = await db.doc.create({
    data: {
      title,
      content,
      contentText: htmlToPlainText(content),
      area: "PHD",
      status: "DRAFTING",
      templateKey: template.key,
      projectId,
      userId: session.user.id,
      tasks: { create: { taskId: task.id } },
    },
    select: { id: true },
  });

  revalidateResearch({ docs: true, docId: doc.id });
  revalidatePath("/kanban");
  return { success: true, data: { id: doc.id } };
}

const PHD_FOLDER_TREE: {
  nameFa: string;
  nameEn: string;
  children?: { nameFa: string; nameEn: string }[];
}[] = [
  { nameFa: "پروپوزال", nameEn: "Proposal" },
  {
    nameFa: "فصول",
    nameEn: "Chapters",
    children: [
      { nameFa: "فصل ۱", nameEn: "Chapter 1" },
      { nameFa: "فصل ۲", nameEn: "Chapter 2" },
      { nameFa: "فصل ۳", nameEn: "Chapter 3" },
    ],
  },
  { nameFa: "مقالات", nameEn: "Papers" },
  { nameFa: "منابع", nameEn: "Sources" },
];

export async function ensurePhdFolderTreeAction(opts?: {
  language?: "FA" | "EN";
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const lang = opts?.language ?? "FA";

  async function ensureFolder(
    name: string,
    parentId: string | null,
  ): Promise<string> {
    const existing = await db.docFolder.findFirst({
      where: {
        userId: session!.user!.id,
        parentId,
        name,
        area: "PHD",
      },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await db.docFolder.create({
      data: {
        name,
        area: "PHD",
        parentId,
        userId: session!.user!.id,
        description:
          lang === "FA" ? "پوشه پیش‌فرض پژوهش" : "Default research folder",
      },
      select: { id: true },
    });
    return created.id;
  }

  for (const node of PHD_FOLDER_TREE) {
    const name = lang === "FA" ? node.nameFa : node.nameEn;
    const parentId = await ensureFolder(name, null);
    for (const child of node.children ?? []) {
      const childName = lang === "FA" ? child.nameFa : child.nameEn;
      await ensureFolder(childName, parentId);
    }
  }

  revalidateResearch();
  return { success: true };
}

function buildSourceNoteHtml(source: {
  id: string;
  title: string;
  authors: string | null;
  url: string | null;
  year: string | null;
  doi: string | null;
  notes: string | null;
}): string {
  const meta = [
    `<p><strong>عنوان:</strong> ${escapeHtml(source.title)}</p>`,
    source.authors
      ? `<p><strong>نویسندگان:</strong> ${escapeHtml(source.authors)}</p>`
      : "",
    source.year
      ? `<p><strong>سال:</strong> ${escapeHtml(source.year)}</p>`
      : "",
    source.doi
      ? `<p><strong>DOI:</strong> ${escapeHtml(source.doi)}</p>`
      : "",
    source.url
      ? `<p><strong>لینک:</strong> ${escapeHtml(source.url)}</p>`
      : "",
    source.notes
      ? `<h3>یادداشت</h3><p>${escapeHtml(source.notes)}</p>`
      : "",
    `<p class="doc-source-ref" data-source-id="${source.id}"><em>${escapeHtml(formatApaLike(source))}</em></p>`,
  ]
    .filter(Boolean)
    .join("");

  return ensureHeadingIds(
    `<h2>منبع</h2>${meta}<h3>خلاصه</h3><p></p><h3>نکات کلیدی</h3><ul><li></li></ul><h3>نقل‌قول‌ها</h3><blockquote><p></p></blockquote>`,
  );
}

/** True when the host is a real per-paper note (not a path binder index). */
function isPerPaperSourceNote(doc: {
  templateKey: string | null;
  systemKey: string | null;
}): boolean {
  return (
    doc.templateKey === "sourceNote" &&
    !isLibraryBinderSystemKey(doc.systemKey)
  );
}

async function createPerPaperSourceNoteDoc(
  userId: string,
  source: {
    id: string;
    title: string;
    authors: string | null;
    url: string | null;
    year: string | null;
    doi: string | null;
    notes: string | null;
  },
  projectId: string | null,
  readingStatus: SourceReadingStatus = "TO_READ",
): Promise<string> {
  const template = getDocTemplate("sourceNote");
  const content = buildSourceNoteHtml(source);
  const doc = await db.doc.create({
    data: {
      title: `${template.titleFa}: ${source.title}`.slice(0, 120),
      content,
      contentText: htmlToPlainText(content),
      area: "PHD" satisfies LifeArea,
      status: SOURCE_READING_TO_DOC[readingStatus] ?? "IDEA",
      templateKey: "sourceNote",
      projectId,
      userId,
    },
    select: { id: true },
  });
  return doc.id;
}

/** Enforce one PhD pipeline card per source note. */
async function replacePhdDocTaskLinks(
  noteDocId: string,
  taskId: string,
): Promise<void> {
  const existing = await db.docTask.findMany({
    where: {
      docId: noteDocId,
      task: { area: "PHD" },
    },
    select: { taskId: true },
  });
  const stale = existing.filter(e => e.taskId !== taskId).map(e => e.taskId);
  if (stale.length > 0) {
    await db.docTask.deleteMany({
      where: { docId: noteDocId, taskId: { in: stale } },
    });
  }
  await db.docTask.upsert({
    where: { docId_taskId: { docId: noteDocId, taskId } },
    create: { docId: noteDocId, taskId },
    update: {},
  });
}

async function ensureReadingTaskForSourceNote(input: {
  userId: string;
  sourceTitle: string;
  noteDocId: string;
  researchProjectId: string | null;
  readingStatus?: SourceReadingStatus;
  dueDate?: Date | null;
  durationMinutes?: number | null;
}): Promise<{ taskId: string; created: boolean }> {
  const { teamId } = await ensurePersonalWorkspace(input.userId);
  const taskProjectId =
    input.researchProjectId ?? personalAreaProjectId(input.userId, "PHD");

  const existing = await db.docTask.findFirst({
    where: {
      docId: input.noteDocId,
      task: {
        area: "PHD",
        OR: [
          { assignedToId: input.userId },
          { createdById: input.userId },
        ],
      },
    },
    select: { taskId: true },
  });
  if (existing) {
    await replacePhdDocTaskLinks(input.noteDocId, existing.taskId);
    if (input.dueDate !== undefined) {
      await db.task.update({
        where: { id: existing.taskId },
        data: {
          dueDate: input.dueDate,
          durationMinutes: input.durationMinutes ?? null,
        },
      });
    }
    return { taskId: existing.taskId, created: false };
  }

  const reading = input.readingStatus ?? "TO_READ";
  const status = SOURCE_READING_TO_TASK[reading] ?? "BACKLOG";

  const task = await db.task.create({
    data: {
      title: input.sourceTitle.slice(0, 200),
      status,
      priority: "NONE",
      type: "TASK",
      area: "PHD",
      projectId: taskProjectId,
      teamId,
      createdById: input.userId,
      assignedToId: input.userId,
      dueDate: input.dueDate ?? null,
      durationMinutes: input.durationMinutes ?? null,
      docs: { create: { docId: input.noteDocId } },
    },
    select: { id: true },
  });
  return { taskId: task.id, created: true };
}

/**
 * Ensure source lives on a per-paper note with exactly one reading card.
 * Used by open-note, reading toggles, quotes, and link actions.
 */
export async function ensureSourceContinuityAction(
  sourceId: string,
  opts?: { createReadingCard?: boolean },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const noteResult = await createSourceNoteFromSourceAction(sourceId);
  if (!noteResult.success || !noteResult.data?.id) {
    return {
      success: false,
      error: noteResult.error ?? "یادداشت منبع ساخته نشد",
    };
  }
  const docId = String(noteResult.data.id);

  const source = await db.docSource.findFirst({
    where: { id: sourceId, doc: { userId: session.user.id } },
    select: {
      title: true,
      projectId: true,
      readingStatus: true,
      doc: { select: { projectId: true, status: true } },
    },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  // Align note status with reading if still mismatched.
  const wantDoc = SOURCE_READING_TO_DOC[source.readingStatus];
  if (wantDoc && source.doc.status !== wantDoc) {
    await db.doc.update({
      where: { id: docId },
      data: { status: wantDoc },
    });
  }

  let taskId: string | undefined;
  let created = false;
  if (opts?.createReadingCard !== false) {
    const card = await ensureReadingTaskForSourceNote({
      userId: session.user.id,
      sourceTitle: source.title,
      noteDocId: docId,
      researchProjectId: source.projectId ?? source.doc.projectId ?? null,
      readingStatus: source.readingStatus,
    });
    taskId = card.taskId;
    created = card.created;
  }

  revalidateResearch({ docs: true, docId });
  revalidatePath("/kanban");
  return {
    success: true,
    data: {
      id: docId,
      docId,
      taskId,
      created,
      reused: noteResult.data.reused === true && !created,
    },
  };
}

export async function createSourceNoteFromSourceAction(
  sourceId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const source = await db.docSource.findFirst({
    where: { id: sourceId, doc: { userId: session.user.id } },
    select: {
      id: true,
      title: true,
      authors: true,
      url: true,
      year: true,
      doi: true,
      notes: true,
      docId: true,
      projectId: true,
      readingStatus: true,
      doc: {
        select: {
          id: true,
          projectId: true,
          templateKey: true,
          systemKey: true,
        },
      },
    },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  // Already on a real per-paper note — open it (never fork DocSource).
  if (isPerPaperSourceNote(source.doc)) {
    revalidateResearch({ docs: true, docId: source.docId });
    return { success: true, data: { id: source.docId, reused: true } };
  }

  const projectId = source.projectId ?? source.doc.projectId ?? null;
  const noteId = await createPerPaperSourceNoteDoc(
    session.user.id,
    source,
    projectId,
    source.readingStatus,
  );

  // Move the canonical source off the binder onto the per-paper note.
  await db.docSource.update({
    where: { id: source.id },
    data: { docId: noteId },
  });

  revalidateResearch({ docs: true, docId: noteId });
  return { success: true, data: { id: noteId, reused: false } };
}

export async function lookupDoiAction(doiRaw: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const doi = normalizeDoi(doiRaw);
  if (!doi) return { success: false, error: "DOI خالی است" };

  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mindora-Research/1.0 (mailto:research@localhost)",
        },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok) {
      return { success: false, error: "منبع Crossref پیدا نشد" };
    }
    const json = (await res.json()) as {
      message?: {
        title?: string[];
        author?: { family?: string; given?: string }[];
        issued?: { "date-parts"?: number[][] };
        URL?: string;
        DOI?: string;
        abstract?: string;
      };
    };
    const msg = json.message;
    if (!msg) return { success: false, error: "پاسخ نامعتبر Crossref" };

    const title = msg.title?.[0] ?? doi;
    const authors = (msg.author ?? [])
      .map(a => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");
    const year = msg.issued?.["date-parts"]?.[0]?.[0]
      ? String(msg.issued["date-parts"][0][0])
      : null;
    const url = msg.URL ?? `https://doi.org/${doi}`;
    const abstract = stripJats(msg.abstract ?? "");

    return {
      success: true,
      data: {
        title,
        authors: authors || null,
        year,
        url,
        doi: msg.DOI ?? doi,
        notes: abstract || null,
        citation: formatApaLike({
          title,
          authors,
          year,
          url,
          doi: msg.DOI ?? doi,
        }),
      },
    };
  } catch {
    return { success: false, error: "خطا در دریافت DOI" };
  }
}

export async function addPhdSourceAction(input: {
  docId?: string;
  title: string;
  authors?: string;
  url?: string;
  year?: string;
  doi?: string;
  notes?: string;
  readingStatus?: SourceReadingStatus;
  /**
   * Research path. Required (null = inbox). Omit/undefined is rejected so
   * scope=all cannot silently dump into inbox.
   */
  projectId?: string | null;
  /** Default true: create reading card + DocTask on the per-paper note. */
  createReadingCard?: boolean;
  /** Optional due clock for the reading card (capture). */
  dueDate?: string;
  time?: string | null;
  durationMinutes?: number | null;
  /** Client `Date#getTimezoneOffset()` so date-only noon stays noon on UTC servers. */
  timezoneOffsetMinutes?: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان منبع لازم است" };

  if (input.projectId === undefined) {
    return {
      success: false,
      error: "مسیر پژوهش را انتخاب کنید (یا صندوق)",
    };
  }
  const projectId = input.projectId;
  const readingStatus = input.readingStatus ?? "TO_READ";

  let due: Date | null = null;
  if (input.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
    const hasOffset =
      typeof input.timezoneOffsetMinutes === "number" &&
      Number.isFinite(input.timezoneOffsetMinutes);
    const hhmm = input.time?.match(/^(\d{1,2}):(\d{2})$/);
    const hours = hhmm ? Number(hhmm[1]) : 12;
    const minutes = hhmm ? Number(hhmm[2]) : 0;
    if (hasOffset) {
      due = dueFromWallClock(
        input.dueDate,
        hours,
        minutes,
        input.timezoneOffsetMinutes!,
      );
    } else {
      const [y, m, d] = input.dueDate.split("-").map(Number);
      due = new Date(y!, m! - 1, d!, hours, minutes, 0, 0);
    }
  }
  const durationMinutes =
    due && input.time && input.durationMinutes && input.durationMinutes > 0
      ? Math.min(24 * 60, Math.round(input.durationMinutes))
      : null;

  let docId = input.docId;
  if (docId) {
    const owned = await db.doc.findFirst({
      where: { id: docId, userId: session.user.id, deletedAt: null },
      select: { id: true, templateKey: true, systemKey: true },
    });
    if (!owned) return { success: false, error: "سند پیدا نشد" };
    if (!isPerPaperSourceNote(owned)) {
      docId = undefined;
    }
  }

  // Create per-paper note first (no binder hop), then attach canonical source.
  if (!docId) {
    const template = getDocTemplate("sourceNote");
    const shell = await db.doc.create({
      data: {
        title: `${template.titleFa}: ${title}`.slice(0, 120),
        content: "<p></p>",
        contentText: "",
        area: "PHD",
        status: SOURCE_READING_TO_DOC[readingStatus] ?? "IDEA",
        templateKey: "sourceNote",
        projectId,
        userId: session.user.id,
      },
      select: { id: true },
    });
    docId = shell.id;
  }

  const source = await db.docSource.create({
    data: {
      docId,
      projectId,
      title,
      authors: input.authors?.trim() || null,
      url: input.url?.trim() || null,
      year: input.year?.trim() || null,
      doi: input.doi ? normalizeDoi(input.doi) : null,
      notes: input.notes?.trim() || null,
      readingStatus,
    },
    select: {
      id: true,
      title: true,
      authors: true,
      url: true,
      year: true,
      doi: true,
      notes: true,
    },
  });

  const content = buildSourceNoteHtml(source);
  await db.doc.update({
    where: { id: docId },
    data: {
      content,
      contentText: htmlToPlainText(content),
      status: SOURCE_READING_TO_DOC[readingStatus] ?? "IDEA",
    },
  });

  let taskId: string | undefined;
  if (input.createReadingCard !== false) {
    const card = await ensureReadingTaskForSourceNote({
      userId: session.user.id,
      sourceTitle: title,
      noteDocId: docId,
      researchProjectId: projectId,
      readingStatus,
      dueDate: due,
      durationMinutes,
    });
    taskId = card.taskId;
  }

  revalidateResearch({ docs: true, docId });
  revalidatePath("/kanban");
  return { success: true, data: { id: source.id, docId, taskId } };
}

/** Link an existing pipeline card to this source (one card per note). */
export async function linkSourceToTaskAction(input: {
  sourceId: string;
  taskId: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const task = await db.task.findFirst({
    where: {
      id: input.taskId,
      OR: [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
      ],
    },
    select: { id: true, status: true, area: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };

  const continuity = await ensureSourceContinuityAction(input.sourceId, {
    createReadingCard: false,
  });
  if (!continuity.success || !continuity.data?.docId) {
    return {
      success: false,
      error: continuity.error ?? "یادداشت منبع ساخته نشد",
    };
  }
  const docId = String(continuity.data.docId);

  await replacePhdDocTaskLinks(docId, task.id);

  // Align source + note to the card's pipeline stage.
  const { syncResearchLinksFromTaskStatus } = await import("./sync-links");
  await syncResearchLinksFromTaskStatus(task.id, task.status);

  revalidateResearch({ docs: true, docId });
  revalidatePath("/kanban");
  return { success: true, data: { docId, taskId: task.id } };
}

/** Create a PhD reading card for a source that has no DocTask yet. */
export async function createReadingCardForSourceAction(
  sourceId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const result = await ensureSourceContinuityAction(sourceId, {
    createReadingCard: true,
  });
  if (!result.success) return result;

  return {
    success: true,
    data: {
      docId: result.data?.docId,
      taskId: result.data?.taskId,
      created: result.data?.created === true,
      reused: result.data?.created !== true,
    },
  };
}

export async function attachSourceToTaskAction(input: {
  taskId: string;
  sourceId: string;
}): Promise<ActionResult> {
  return linkSourceToTaskAction(input);
}

export async function searchPhdTasksForLinkAction(
  query: string,
): Promise<{ id: string; title: string }[]> {
  const session = await auth();
  if (!session?.user) return [];
  const q = query.trim();
  if (q.length < 1) return [];

  return db.task.findMany({
    where: {
      area: "PHD",
      status: { not: "DONE" },
      title: { contains: q, mode: "insensitive" },
      OR: [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
      ],
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
}

/** Append APA-like citation to a doc. Reuses the canonical DocSource — never forks. */
export async function insertCitationIntoDocAction(input: {
  sourceId: string;
  docId: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const source = await db.docSource.findFirst({
    where: { id: input.sourceId, doc: { userId: session.user.id } },
    select: {
      id: true,
      title: true,
      authors: true,
      url: true,
      year: true,
      doi: true,
      notes: true,
      docId: true,
    },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  const doc = await db.doc.findFirst({
    where: {
      id: input.docId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true, content: true },
  });
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const citation = formatApaLike(source);
  const citeHtml = `<p class="doc-citation" data-source-id="${source.id}"><em>${escapeHtml(citation)}</em></p><p></p>`;
  const base = (doc.content || "").trim();
  const nextContent = ensureHeadingIds(
    base && base !== "<p></p>" ? `${base}${citeHtml}` : citeHtml,
  );

  await db.doc.update({
    where: { id: doc.id },
    data: {
      content: nextContent,
      contentText: htmlToPlainText(nextContent),
    },
  });

  await db.docQuote.create({
    data: {
      docId: doc.id,
      sourceId: source.id,
      text: citation,
      note: "citation",
    },
  });

  revalidateResearch({ docs: true, docId: doc.id });
  return { success: true, data: { id: doc.id, sourceId: source.id } };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function annotateSourceQuoteAction(input: {
  sourceId: string;
  text: string;
  note?: string;
  /** When set, also append the quote into this writing doc. */
  insertIntoDocId?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const text = input.text.trim();
  if (!text) return { success: false, error: "متن نقل‌قول خالی است" };

  // Promote off binder + ensure reading card so quotes land on the real note.
  const continuity = await ensureSourceContinuityAction(input.sourceId, {
    createReadingCard: true,
  });
  if (!continuity.success) {
    return {
      success: false,
      error: continuity.error ?? "منبع آماده نشد",
    };
  }

  const source = await db.docSource.findFirst({
    where: { id: input.sourceId, doc: { userId: session.user.id } },
    select: { id: true, docId: true, title: true },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  let targetDocId = source.docId;
  if (input.insertIntoDocId) {
    const target = await db.doc.findFirst({
      where: {
        id: input.insertIntoDocId,
        userId: session.user.id,
        deletedAt: null,
      },
      select: { id: true, content: true },
    });
    if (!target) return { success: false, error: "سند پیدا نشد" };
    targetDocId = target.id;

    const attribution = source.title
      ? `<footer>— ${escapeHtml(source.title)}</footer>`
      : "";
    const noteHtml = input.note?.trim()
      ? `<p><em>${escapeHtml(input.note.trim())}</em></p>`
      : "";
    const block = `<blockquote data-source-id="${source.id}"><p>${escapeHtml(text)}</p>${attribution}${noteHtml}</blockquote><p></p>`;
    const base = (target.content || "").trim();
    const nextContent = ensureHeadingIds(
      base && base !== "<p></p>" ? `${base}${block}` : block,
    );
    await db.doc.update({
      where: { id: target.id },
      data: {
        content: nextContent,
        contentText: htmlToPlainText(nextContent),
      },
    });
  }

  const quote = await db.docQuote.create({
    data: {
      docId: targetDocId,
      sourceId: source.id,
      text,
      note: input.note?.trim() || null,
    },
    select: { id: true },
  });

  revalidateResearch({ docs: true, docId: targetDocId });
  return {
    success: true,
    data: { id: quote.id, docId: targetDocId },
  };
}

function stripJats(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}
