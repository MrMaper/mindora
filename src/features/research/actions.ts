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
import { AREA_PROJECT_IDS } from "@/lib/life";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

function revalidateResearch(docId?: string) {
  revalidatePath("/research");
  revalidatePath("/docs");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  if (docId) revalidatePath(`/docs/${docId}`);
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
  if (!name) return { success: false, error: "نام پروژه لازم است" };

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

  revalidateResearch();
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
  if (!task) return { success: false, error: "تسک پیدا نشد" };

  const template = input.templateKey
    ? getDocTemplate(input.templateKey)
    : getDocTemplate("researchIdea");
  const title = (input.title ?? "").trim() || task.title || template.titleFa;
  const content = ensureHeadingIds(template.content);

  let projectId = input.projectId ?? null;
  if (!projectId && task.projectId && task.projectId !== AREA_PROJECT_IDS.PHD) {
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

  revalidateResearch(doc.id);
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
    },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  const template = getDocTemplate("sourceNote");
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
  ]
    .filter(Boolean)
    .join("");

  const content = ensureHeadingIds(
    `<h2>منبع</h2>${meta}<h3>خلاصه</h3><p></p><h3>نکات کلیدی</h3><ul><li></li></ul><h3>نقل‌قول‌ها</h3><blockquote><p></p></blockquote>`,
  );

  const doc = await db.doc.create({
    data: {
      title: `${template.titleFa}: ${source.title}`.slice(0, 120),
      content,
      contentText: htmlToPlainText(content),
      area: "PHD" satisfies LifeArea,
      status: "DRAFTING",
      templateKey: "sourceNote",
      userId: session.user.id,
      sources: {
        create: {
          title: source.title,
          authors: source.authors,
          url: source.url,
          year: source.year,
          doi: source.doi,
          notes: source.notes,
          readingStatus: "READING",
        },
      },
    },
    select: { id: true },
  });

  revalidateResearch(doc.id);
  return { success: true, data: { id: doc.id } };
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
  /** Prefer docs in this research project; null = inbox (no project) */
  projectId?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const title = input.title.trim();
  if (!title) return { success: false, error: "عنوان منبع لازم است" };

  let docId = input.docId;
  if (!docId) {
    const latest = await db.doc.findFirst({
      where: {
        userId: session.user.id,
        area: "PHD",
        deletedAt: null,
        archived: false,
        ...(input.projectId !== undefined
          ? { projectId: input.projectId }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!latest) {
      const template = getDocTemplate("sourceNote");
      const content = ensureHeadingIds(template.content);
      const created = await db.doc.create({
        data: {
          title: template.titleFa,
          content,
          contentText: htmlToPlainText(content),
          area: "PHD",
          status: "DRAFTING",
          templateKey: template.key,
          projectId:
            input.projectId === undefined ? null : input.projectId,
          userId: session.user.id,
        },
        select: { id: true },
      });
      docId = created.id;
    } else {
      docId = latest.id;
    }
  } else {
    const owned = await db.doc.findFirst({
      where: { id: docId, userId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!owned) return { success: false, error: "سند پیدا نشد" };
  }

  const source = await db.docSource.create({
    data: {
      docId,
      title,
      authors: input.authors?.trim() || null,
      url: input.url?.trim() || null,
      year: input.year?.trim() || null,
      doi: input.doi ? normalizeDoi(input.doi) : null,
      notes: input.notes?.trim() || null,
      readingStatus: input.readingStatus ?? "TO_READ",
    },
    select: { id: true },
  });

  revalidateResearch(docId);
  return { success: true, data: { id: source.id, docId } };
}

/** Append APA-like citation to a doc and ensure a linked DocSource on that doc. */
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

  let linkedSourceId = source.id;
  if (source.docId !== doc.id) {
    const existing = await db.docSource.findFirst({
      where: {
        docId: doc.id,
        OR: [
          ...(source.doi
            ? [{ doi: source.doi }]
            : []),
          {
            title: source.title,
            authors: source.authors,
            year: source.year,
          },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      linkedSourceId = existing.id;
    } else {
      const copied = await db.docSource.create({
        data: {
          docId: doc.id,
          title: source.title,
          authors: source.authors,
          url: source.url,
          year: source.year,
          doi: source.doi,
          notes: source.notes,
          readingStatus: "READING",
        },
        select: { id: true },
      });
      linkedSourceId = copied.id;
    }
  }

  const citation = formatApaLike(source);
  const citeHtml = `<p class="doc-citation" data-source-id="${linkedSourceId}"><em>${escapeHtml(citation)}</em></p><p></p>`;
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
      sourceId: linkedSourceId,
      text: citation,
      note: "citation",
    },
  });

  revalidateResearch(doc.id);
  return { success: true, data: { id: doc.id, sourceId: linkedSourceId } };
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
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const text = input.text.trim();
  if (!text) return { success: false, error: "متن نقل‌قول خالی است" };

  const source = await db.docSource.findFirst({
    where: { id: input.sourceId, doc: { userId: session.user.id } },
    select: { id: true, docId: true },
  });
  if (!source) return { success: false, error: "منبع پیدا نشد" };

  const quote = await db.docQuote.create({
    data: {
      docId: source.docId,
      sourceId: source.id,
      text,
      note: input.note?.trim() || null,
    },
    select: { id: true },
  });

  revalidateResearch(source.docId);
  return { success: true, data: { id: quote.id, docId: source.docId } };
}

function stripJats(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}
