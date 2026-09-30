"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import type { DocStatus, LifeArea } from "@/types/db";
import { getDocTemplate, type DocTemplateKey } from "./templates";
import {
  getDocById,
  getDocs,
  getDocsByTaskIds,
  getDocsForTask,
  getDocFolders,
  getDocTags,
  getRecentDocs,
  getWritingPulse,
  searchMentionTargets,
} from "./queries";
import type {
  DocDetail,
  DocFolderItem,
  DocListItem,
  DocTagItem,
  WritingPulseItem,
} from "./types";
import { countWords, ensureHeadingIds } from "./utils";
import { extractTaskCandidatesFromHtml } from "./checklist";
import { ensureDailyNote } from "./daily";
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: {
    id?: string;
    fileUrl?: string;
    fileName?: string;
    [key: string]: unknown;
  };
}

const VERSION_MIN_INTERVAL_MS = 10 * 60 * 1000;
const VERSION_MIN_WORD_DELTA = 40;

function revalidateDocs(id?: string, opts?: { research?: boolean; language?: boolean }) {
  revalidatePath("/docs");
  if (opts?.research) revalidatePath("/research");
  if (opts?.language) revalidatePath("/language");
  if (id) revalidatePath(`/docs/${id}`);
}

async function assertProjectMember(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const row = await db.projectMember.findFirst({
    where: {
      projectId,
      userId,
      project: {
        area: { in: ["PHD", "LANG", "WORK", "LIFE"] },
        status: { not: "ARCHIVED" },
      },
    },
    select: { id: true },
  });
  return !!row;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function assertDocOwner(docId: string, userId: string) {
  return db.doc.findFirst({
    where: { id: docId, userId },
    select: {
      id: true,
      title: true,
      content: true,
      contentText: true,
    },
  });
}

async function maybeCreateAutoVersion(
  docId: string,
  prev: { title: string; content: string; contentText: string },
  nextText: string,
) {
  // Skip empty ↔ empty noise
  if (!prev.contentText.trim() && !nextText.trim()) return;

  const last = await db.docVersion.findFirst({
    where: { docId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, contentText: true },
  });

  if (last) {
    const ageOk =
      Date.now() - last.createdAt.getTime() >= VERSION_MIN_INTERVAL_MS;
    const delta = Math.abs(
      countWords(nextText) - countWords(last.contentText),
    );
    const deltaOk = delta >= VERSION_MIN_WORD_DELTA;
    // Require both time gap and meaningful change to avoid spam
    if (!ageOk || !deltaOk) return;
  }

  // Snapshot the previous state (before this edit) — labeled "auto"
  await db.docVersion.create({
    data: {
      docId,
      title: prev.title,
      content: prev.content,
      contentText: prev.contentText,
      note: "auto",
    },
  });
}

export async function listDocsAction(opts?: {
  area?: LifeArea | "ALL";
  search?: string;
  archived?: boolean;
  trash?: boolean;
  folderId?: string | null | "NONE";
  tagId?: string;
}): Promise<DocListItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getDocs(session.user.id, opts);
}

export async function getDocAction(id: string): Promise<DocDetail | null> {
  const session = await auth();
  if (!session?.user) return null;
  return getDocById(session.user.id, id);
}

export async function createDoc(input?: {
  title?: string;
  area?: LifeArea;
  content?: string;
  templateKey?: DocTemplateKey;
  status?: DocStatus;
  wordGoal?: number | null;
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const template = input?.templateKey
    ? getDocTemplate(input.templateKey)
    : null;
  const title =
    (input?.title ?? "").trim() ||
    (template
      ? template.titleFa
      : "بدون عنوان");
  const rawContent = input?.content ?? template?.content ?? "<p></p>";
  const content = ensureHeadingIds(rawContent);
  const area = input?.area ?? template?.area ?? "LIFE";

  if (input?.projectId) {
    const ok = await assertProjectMember(input.projectId, session.user.id);
    if (!ok) return { success: false, error: "مسیر پیدا نشد" };
  }

  const doc = await db.doc.create({
    data: {
      title,
      content,
      contentText: htmlToText(content),
      area,
      status: input?.status ?? "DRAFTING",
      wordGoal: input?.wordGoal ?? null,
      templateKey: input?.templateKey ?? template?.key ?? null,
      projectId: input?.projectId || null,
      userId: session.user.id,
    },
    select: { id: true },
  });

  revalidateDocs(doc.id, {
    research: area === "PHD",
    language: area === "LANG",
  });
  return { success: true, data: { id: doc.id } };
}

export async function createDocFromTemplate(
  key: DocTemplateKey,
): Promise<ActionResult> {
  return createDoc({ templateKey: key });
}

export async function updateDoc(
  id: string,
  input: {
    title?: string;
    content?: string;
    area?: LifeArea;
    status?: DocStatus;
    wordGoal?: number | null;
    pinned?: boolean;
    archived?: boolean;
    folderId?: string | null;
    projectId?: string | null;
  },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.doc.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      content: true,
      contentText: true,
    },
  });
  if (!existing) return { success: false, error: "سند پیدا نشد" };

  if (input.folderId) {
    const folder = await db.docFolder.findFirst({
      where: { id: input.folderId, userId: session.user.id },
      select: { id: true },
    });
    if (!folder) return { success: false, error: "پوشه پیدا نشد" };
  }

  if (input.projectId) {
    const ok = await assertProjectMember(input.projectId, session.user.id);
    if (!ok) return { success: false, error: "مسیر پیدا نشد" };
  }

  const data: {
    title?: string;
    content?: string;
    contentText?: string;
    area?: LifeArea;
    status?: DocStatus;
    wordGoal?: number | null;
    pinned?: boolean;
    archived?: boolean;
    folderId?: string | null;
    projectId?: string | null;
  } = {};

  if (input.title !== undefined) {
    data.title = input.title.trim() || "بدون عنوان";
  }
  if (input.content !== undefined) {
    const content = ensureHeadingIds(input.content);
    data.content = content;
    data.contentText = htmlToText(content);
  }
  if (input.area !== undefined) data.area = input.area;
  if (input.status !== undefined) data.status = input.status;
  if (input.wordGoal !== undefined) data.wordGoal = input.wordGoal;
  if (input.pinned !== undefined) data.pinned = input.pinned;
  if (input.archived !== undefined) data.archived = input.archived;
  if (input.folderId !== undefined) data.folderId = input.folderId;
  if (input.projectId !== undefined) data.projectId = input.projectId;

  if (data.content !== undefined && data.content !== existing.content) {
    await maybeCreateAutoVersion(id, existing, data.contentText ?? "");
  }

  await db.doc.update({ where: { id }, data });
  revalidateDocs(id);
  return { success: true, data: { id } };
}

/** Move to trash (kept for retention window; see types.TRASH_RETENTION_DAYS). */
export async function deleteDoc(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.doc.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "سند پیدا نشد" };

  await db.doc.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      pinned: false,
      archived: false,
    },
  });
  revalidateDocs();
  return { success: true };
}

export async function restoreDocFromTrash(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.doc.findFirst({
    where: { id, userId: session.user.id, deletedAt: { not: null } },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "سند در سطل نیست" };

  await db.doc.update({
    where: { id },
    data: { deletedAt: null },
  });
  revalidateDocs(id);
  return { success: true, data: { id } };
}

export async function purgeDocForever(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.doc.findFirst({
    where: { id, userId: session.user.id, deletedAt: { not: null } },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "سند در سطل نیست" };

  await db.doc.delete({ where: { id } });
  revalidateDocs();
  return { success: true };
}

export async function linkDocTask(
  docId: string,
  taskId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const doc = await assertDocOwner(docId, session.user.id);
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const task = await db.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
      ],
    },
    select: { id: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };

  await db.docTask.upsert({
    where: { docId_taskId: { docId, taskId } },
    create: { docId, taskId },
    update: {},
  });

  revalidateDocs(docId);
  return { success: true };
}

export async function unlinkDocTask(
  docId: string,
  taskId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const doc = await assertDocOwner(docId, session.user.id);
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  await db.docTask.deleteMany({ where: { docId, taskId } });
  revalidateDocs(docId);
  return { success: true };
}

export async function searchLinkableTasks(
  query: string,
): Promise<{ id: string; title: string }[]> {
  const session = await auth();
  if (!session?.user) return [];
  const q = query.trim();
  if (q.length < 1) return [];

  const tasks = await db.task.findMany({
    where: {
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
  return tasks;
}

export async function createTaskFromDoc(input: {
  docId: string;
  title: string;
  area?: LifeArea;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان خالی است" };

  const doc = await db.doc.findFirst({
    where: { id: input.docId, userId: session.user.id },
    select: { id: true, area: true },
  });
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const { ensurePersonalWorkspace, projectIdForArea } = await import(
    "@/features/life/workspace"
  );
  const { teamId } = await ensurePersonalWorkspace(session.user.id);
  const area = input.area ?? doc.area;

  const task = await db.task.create({
    data: {
      title,
      status: "BACKLOG",
      priority: "NONE",
      type: "TASK",
      area,
      projectId: projectIdForArea(session.user.id, area),
      teamId,
      createdById: session.user.id,
      assignedToId: session.user.id,
    },
    select: { id: true },
  });

  await db.docTask.create({
    data: { docId: doc.id, taskId: task.id },
  });

  revalidateDocs(doc.id);
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true, data: { id: task.id } };
}

export async function saveDocVersion(
  docId: string,
  note?: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const doc = await db.doc.findFirst({
    where: { id: docId, userId: session.user.id },
    select: { id: true, title: true, content: true, contentText: true },
  });
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const version = await db.docVersion.create({
    data: {
      docId: doc.id,
      title: doc.title,
      content: doc.content,
      contentText: doc.contentText,
      note: note?.trim() || "manual",
    },
    select: { id: true },
  });

  revalidateDocs(docId);
  return { success: true, data: { id: version.id } };
}

export async function restoreDocVersion(
  docId: string,
  versionId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const doc = await db.doc.findFirst({
    where: { id: docId, userId: session.user.id },
    select: { id: true, title: true, content: true, contentText: true },
  });
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const version = await db.docVersion.findFirst({
    where: { id: versionId, docId },
  });
  if (!version) return { success: false, error: "نسخه پیدا نشد" };

  // Snapshot current state before restore
  await db.docVersion.create({
    data: {
      docId,
      title: doc.title,
      content: doc.content,
      contentText: doc.contentText,
      note: "before-restore",
    },
  });

  await db.doc.update({
    where: { id: docId },
    data: {
      title: version.title,
      content: version.content,
      contentText: version.contentText,
    },
  });

  revalidateDocs(docId);
  return { success: true, data: { id: docId } };
}

export async function addDocSource(input: {
  docId: string;
  title: string;
  authors?: string;
  url?: string;
  year?: string;
  doi?: string;
  notes?: string;
  readingStatus?: import("@/types/db").SourceReadingStatus;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان منبع لازم است" };

  const doc = await assertDocOwner(input.docId, session.user.id);
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const source = await db.docSource.create({
    data: {
      docId: input.docId,
      title,
      authors: input.authors?.trim() || null,
      url: input.url?.trim() || null,
      year: input.year?.trim() || null,
      doi: input.doi?.trim() || null,
      notes: input.notes?.trim() || null,
      readingStatus: input.readingStatus ?? "TO_READ",
    },
    select: { id: true },
  });

  revalidateDocs(input.docId);
  return { success: true, data: { id: source.id } };
}

export async function updateDocSource(
  id: string,
  input: {
    title?: string;
    authors?: string;
    url?: string;
    year?: string;
    doi?: string;
    notes?: string;
    readingStatus?: import("@/types/db").SourceReadingStatus;
  },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const source = await db.docSource.findFirst({
    where: { id, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  await db.docSource.update({
    where: { id },
    data: {
      ...(input.title !== undefined
        ? { title: input.title.trim() || "بدون عنوان" }
        : {}),
      ...(input.authors !== undefined
        ? { authors: input.authors.trim() || null }
        : {}),
      ...(input.url !== undefined ? { url: input.url.trim() || null } : {}),
      ...(input.year !== undefined ? { year: input.year.trim() || null } : {}),
      ...(input.doi !== undefined ? { doi: input.doi.trim() || null } : {}),
      ...(input.notes !== undefined
        ? { notes: input.notes.trim() || null }
        : {}),
      ...(input.readingStatus !== undefined
        ? { readingStatus: input.readingStatus }
        : {}),
    },
  });

  if (input.readingStatus !== undefined) {
    const { ensureSourceContinuityAction } = await import(
      "@/features/research/actions"
    );
    await ensureSourceContinuityAction(id, { createReadingCard: true });

    const { syncResearchLinksFromSourceReading } = await import(
      "@/features/research/sync-links"
    );
    await syncResearchLinksFromSourceReading(id, input.readingStatus);
  }

  const refreshed = await db.docSource.findFirst({
    where: { id },
    select: { docId: true },
  });
  revalidateDocs(refreshed?.docId ?? source.docId, { research: true });
  return { success: true, data: { id } };
}

export async function attachDocSourcePdf(
  sourceId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const source = await db.docSource.findFirst({
    where: { id: sourceId, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "فایلی انتخاب نشده است" };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { success: false, error: "فایل باید کوچکتر از ۲۵ مگابایت باشد" };
  }
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { success: false, error: "فقط فایل PDF پذیرفته می‌شود" };
  }

  const { uploadDocSourceFile } = await import("@/lib/storage");
  const url = await uploadDocSourceFile(file, sourceId);
  if (!url) {
    return {
      success: false,
      error:
        "ذخیره‌سازی پیکربندی نشده است. متغیرهای محیطی S3 را برای فعال‌سازی PDF اضافه کنید",
    };
  }

  await db.docSource.update({
    where: { id: sourceId },
    data: { fileUrl: url, fileName: file.name },
  });

  revalidateDocs(source.docId);
  return { success: true, data: { id: sourceId, fileUrl: url, fileName: file.name } };
}

export async function clearDocSourcePdf(sourceId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const source = await db.docSource.findFirst({
    where: { id: sourceId, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  await db.docSource.update({
    where: { id: sourceId },
    data: { fileUrl: null, fileName: null },
  });

  revalidateDocs(source.docId);
  return { success: true, data: { id: sourceId } };
}

export async function deleteDocSource(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const source = await db.docSource.findFirst({
    where: { id, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  await db.docSource.delete({ where: { id } });
  revalidateDocs(source.docId);
  return { success: true };
}

export async function addDocQuote(input: {
  docId: string;
  text: string;
  note?: string;
  sourceId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const text = input.text.trim();
  if (!text) return { success: false, error: "متن نقل‌قول خالی است" };

  const doc = await assertDocOwner(input.docId, session.user.id);
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  if (input.sourceId) {
    const source = await db.docSource.findFirst({
      where: { id: input.sourceId, docId: input.docId },
      select: { id: true },
    });
    if (!source) return { success: false, error: "منبع پیدا نشد" };
  }

  const quote = await db.docQuote.create({
    data: {
      docId: input.docId,
      text,
      note: input.note?.trim() || null,
      sourceId: input.sourceId || null,
    },
    select: { id: true },
  });

  revalidateDocs(input.docId);
  return { success: true, data: { id: quote.id } };
}

export async function deleteDocQuote(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const quote = await db.docQuote.findFirst({
    where: { id, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!quote) return { success: false, error: "نقل‌قول پیدا نشد" };

  await db.docQuote.delete({ where: { id } });
  revalidateDocs(quote.docId);
  return { success: true };
}

export async function updateDocQuote(
  id: string,
  input: {
    text?: string;
    note?: string | null;
    sourceId?: string | null;
  },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const quote = await db.docQuote.findFirst({
    where: { id, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!quote) return { success: false, error: "نقل‌قول پیدا نشد" };

  if (input.sourceId) {
    const source = await db.docSource.findFirst({
      where: { id: input.sourceId, docId: quote.docId },
      select: { id: true },
    });
    if (!source) return { success: false, error: "منبع پیدا نشد" };
  }

  const text =
    input.text !== undefined ? input.text.trim() : undefined;
  if (text !== undefined && !text) {
    return { success: false, error: "متن نقل‌قول خالی است" };
  }

  await db.docQuote.update({
    where: { id },
    data: {
      ...(text !== undefined ? { text } : {}),
      ...(input.note !== undefined
        ? { note: input.note?.trim() || null }
        : {}),
      ...(input.sourceId !== undefined ? { sourceId: input.sourceId } : {}),
    },
  });

  revalidateDocs(quote.docId);
  return { success: true, data: { id } };
}

export async function createTaskFromSelection(input: {
  docId: string;
  title: string;
  area?: LifeArea;
}): Promise<ActionResult> {
  return createTaskFromDoc(input);
}

export async function listRecentDocsAction(opts?: {
  limit?: number;
  area?: LifeArea;
}): Promise<DocListItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getRecentDocs(session.user.id, opts);
}

export async function listDocsForTaskAction(
  taskId: string,
): Promise<{ id: string; title: string; area: LifeArea }[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getDocsForTask(session.user.id, taskId);
}

export async function openWeeklyReviewDocAction(opts?: {
  language?: "FA" | "EN";
}): Promise<ActionResult & { data?: { id?: string } }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const { getWeeklyReview } = await import("@/features/life/queries");
  const review = await getWeeklyReview(session.user.id);
  const { ensureWeeklyReviewDoc } = await import("./weekly");

  const doc = await ensureWeeklyReviewDoc(session.user.id, {
    completedTitles: review.completed.map(t => t.title),
    leftoverTitles: review.leftover.map(t => t.title),
    inboxTitles: review.inbox.map(t => t.title),
    hours: review.hoursThisWeek,
    language: opts?.language ?? "FA",
  });

  if (!doc) return { success: false, error: "ساخت سند بازبینی ناموفق بود" };
  revalidateDocs(doc.id);
  revalidatePath("/review");
  return { success: true, data: { id: doc.id } };
}

export async function openDailyNoteAction(opts?: {
  language?: "FA" | "EN";
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const doc = await ensureDailyNote(session.user.id, {
    language: opts?.language ?? "FA",
  });
  if (!doc) return { success: false, error: "ساخت یادداشت روزانه ناموفق بود" };
  revalidateDocs(doc.id);
  return { success: true, data: { id: doc.id } };
}

export async function listWritingPulseAction(): Promise<WritingPulseItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getWritingPulse(session.user.id);
}

export async function listDocFoldersAction(): Promise<DocFolderItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getDocFolders(session.user.id);
}

export async function listDocTagsAction(): Promise<DocTagItem[]> {
  const session = await auth();
  if (!session?.user) return [];
  return getDocTags(session.user.id);
}

export async function createDocFolder(input: {
  name: string;
  description?: string | null;
  area?: LifeArea | null;
  parentId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const name = input.name.trim();
  if (!name) return { success: false, error: "نام پوشه لازم است" };
  const description = input.description?.trim() || null;
  const parentId: string | null = input.parentId ?? null;
  if (parentId) {
    const parent = await db.docFolder.findFirst({
      where: { id: parentId, userId: session.user.id },
      select: { id: true },
    });
    if (!parent) return { success: false, error: "پوشهٔ والد پیدا نشد" };
  }
  const folder = await db.docFolder.create({
    data: {
      name,
      description,
      area: input.area ?? null,
      parentId,
      userId: session.user.id,
    },
    select: { id: true },
  });
  revalidateDocs();
  return { success: true, data: { id: folder.id } };
}

export async function updateDocFolder(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    area?: LifeArea | null;
    parentId?: string | null;
  },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const folder = await db.docFolder.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!folder) return { success: false, error: "پوشه پیدا نشد" };

  if (input.parentId === id) {
    return { success: false, error: "پوشه نمی‌تواند والد خودش باشد" };
  }
  if (input.parentId) {
    // Prevent cycles: walk up from proposed parent
    let cursor: string | null = input.parentId;
    const seen = new Set<string>([id]);
    while (cursor) {
      if (seen.has(cursor)) {
        return { success: false, error: "حلقه در درخت پوشه مجاز نیست" };
      }
      seen.add(cursor);
      const row: { parentId: string | null } | null =
        await db.docFolder.findFirst({
          where: { id: cursor, userId: session.user.id },
          select: { parentId: true },
        });
      cursor = row?.parentId ?? null;
    }
  }

  const data: {
    name?: string;
    description?: string | null;
    area?: LifeArea | null;
    parentId?: string | null;
  } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { success: false, error: "نام پوشه لازم است" };
    data.name = name;
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.area !== undefined) data.area = input.area;
  if (input.parentId !== undefined) data.parentId = input.parentId;

  await db.docFolder.update({ where: { id }, data });
  revalidateDocs();
  return { success: true, data: { id } };
}

export async function deleteDocFolder(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const folder = await db.docFolder.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, parentId: true },
  });
  if (!folder) return { success: false, error: "پوشه پیدا نشد" };

  // Re-parent children to this folder's parent
  await db.docFolder.updateMany({
    where: { parentId: id, userId: session.user.id },
    data: { parentId: folder.parentId },
  });
  await db.doc.updateMany({
    where: { folderId: id, userId: session.user.id },
    data: { folderId: null },
  });
  await db.docFolder.delete({ where: { id } });
  revalidateDocs();
  return { success: true };
}

export async function createDocTag(input: {
  name: string;
  description?: string | null;
  color?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const name = input.name.trim();
  if (!name) return { success: false, error: "نام تگ لازم است" };
  const description = input.description?.trim() || null;
  const color = input.color ?? "#636e87";
  const tag = await db.docTag.upsert({
    where: {
      userId_name: { userId: session.user.id, name },
    },
    create: {
      name,
      description,
      color,
      userId: session.user.id,
    },
    update: {
      ...(description !== null ? { description } : {}),
      ...(input.color ? { color } : {}),
    },
    select: { id: true },
  });
  revalidateDocs();
  return { success: true, data: { id: tag.id } };
}

export async function updateDocTag(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    color?: string;
  },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const tag = await db.docTag.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!tag) return { success: false, error: "تگ پیدا نشد" };

  const data: { name?: string; description?: string | null; color?: string } =
    {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { success: false, error: "نام تگ لازم است" };
    const clash = await db.docTag.findFirst({
      where: {
        userId: session.user.id,
        name,
        NOT: { id },
      },
      select: { id: true },
    });
    if (clash) return { success: false, error: "تگ هم‌نام وجود دارد" };
    data.name = name;
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.color !== undefined) data.color = input.color;

  await db.docTag.update({ where: { id }, data });
  revalidateDocs();
  return { success: true, data: { id } };
}

export async function deleteDocTag(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const tag = await db.docTag.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!tag) return { success: false, error: "تگ پیدا نشد" };
  await db.docTagOnDoc.deleteMany({ where: { tagId: id } });
  await db.docTag.delete({ where: { id } });
  revalidateDocs();
  return { success: true };
}

/** Move all docs from absorbId onto keepId, then delete absorbId. */
export async function mergeDocTags(
  keepId: string,
  absorbId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (keepId === absorbId) {
    return { success: false, error: "دو تگ باید متفاوت باشند" };
  }
  const tags = await db.docTag.findMany({
    where: {
      userId: session.user.id,
      id: { in: [keepId, absorbId] },
    },
    select: { id: true },
  });
  if (tags.length !== 2) return { success: false, error: "تگ پیدا نشد" };

  const links = await db.docTagOnDoc.findMany({
    where: { tagId: absorbId },
    select: { docId: true },
  });
  for (const { docId } of links) {
    await db.docTagOnDoc.upsert({
      where: { docId_tagId: { docId, tagId: keepId } },
      create: { docId, tagId: keepId },
      update: {},
    });
  }
  await db.docTagOnDoc.deleteMany({ where: { tagId: absorbId } });
  await db.docTag.delete({ where: { id: absorbId } });
  revalidateDocs();
  return { success: true, data: { id: keepId } };
}

export async function setDocTags(
  docId: string,
  tagIds: string[],
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const doc = await assertDocOwner(docId, session.user.id);
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const owned = await db.docTag.findMany({
    where: { userId: session.user.id, id: { in: tagIds } },
    select: { id: true },
  });
  const allowed = new Set(owned.map(t => t.id));

  await db.docTagOnDoc.deleteMany({ where: { docId } });
  if (allowed.size > 0) {
    await db.docTagOnDoc.createMany({
      data: [...allowed].map(tagId => ({ docId, tagId })),
    });
  }
  revalidateDocs(docId);
  return { success: true };
}

export async function toggleDocTag(
  docId: string,
  tagId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  const doc = await assertDocOwner(docId, session.user.id);
  if (!doc) return { success: false, error: "سند پیدا نشد" };
  const tag = await db.docTag.findFirst({
    where: { id: tagId, userId: session.user.id },
    select: { id: true },
  });
  if (!tag) return { success: false, error: "تگ پیدا نشد" };

  const existing = await db.docTagOnDoc.findUnique({
    where: { docId_tagId: { docId, tagId } },
  });
  if (existing) {
    await db.docTagOnDoc.delete({
      where: { docId_tagId: { docId, tagId } },
    });
  } else {
    await db.docTagOnDoc.create({ data: { docId, tagId } });
  }
  revalidateDocs(docId);
  return { success: true };
}

export async function createTasksFromDocChecklist(
  docId: string,
  titlesInput?: string[],
): Promise<ActionResult & { data?: { id?: string; count?: number } }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const doc = await db.doc.findFirst({
    where: { id: docId, userId: session.user.id, deletedAt: null },
    select: { id: true, area: true, content: true },
  });
  if (!doc) return { success: false, error: "سند پیدا نشد" };

  const fromDoc = extractTaskCandidatesFromHtml(doc.content);
  const finalTitles = (
    titlesInput && titlesInput.length > 0
      ? titlesInput
      : fromDoc
  )
    .map(t => t.replace(/\s+/g, " ").trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, 20);

  if (finalTitles.length === 0) {
    return { success: false, error: "چک‌لیست یا بولتی برای تبدیل نیست" };
  }

  const { ensurePersonalWorkspace, projectIdForArea } = await import(
    "@/features/life/workspace"
  );
  const { teamId } = await ensurePersonalWorkspace(session.user.id);

  let count = 0;
  for (const title of finalTitles) {
    const task = await db.task.create({
      data: {
        title,
        status: "BACKLOG",
        priority: "NONE",
        type: "TASK",
        area: doc.area,
        projectId: projectIdForArea(session.user.id, doc.area),
        teamId,
        createdById: session.user.id,
        assignedToId: session.user.id,
      },
      select: { id: true },
    });
    await db.docTask.upsert({
      where: { docId_taskId: { docId: doc.id, taskId: task.id } },
      create: { docId: doc.id, taskId: task.id },
      update: {},
    });
    count += 1;
  }

  revalidateDocs(doc.id);
  revalidatePath("/tasks");
  revalidatePath("/kanban");
  return { success: true, data: { count } };
}

export async function searchMentionsAction(
  query: string,
): Promise<{ id: string; label: string; kind: "doc" | "task"; href: string }[]> {
  const session = await auth();
  if (!session?.user) return [];
  return searchMentionTargets(session.user.id, query);
}

export async function listDocsByTaskIdsAction(
  taskIds: string[],
): Promise<Record<string, { id: string; title: string }[]>> {
  const session = await auth();
  if (!session?.user) return {};
  return getDocsByTaskIds(session.user.id, taskIds.slice(0, 80));
}

export async function getDocVersionContentAction(
  docId: string,
  versionId: string,
): Promise<{
  id: string;
  title: string;
  content: string;
  contentText: string;
  createdAt: Date;
  note: string | null;
} | null> {
  const session = await auth();
  if (!session?.user) return null;
  const version = await db.docVersion.findFirst({
    where: {
      id: versionId,
      docId,
      doc: { userId: session.user.id },
    },
  });
  if (!version) return null;
  return {
    id: version.id,
    title: version.title,
    content: version.content,
    contentText: version.contentText,
    createdAt: version.createdAt,
    note: version.note,
  };
}

