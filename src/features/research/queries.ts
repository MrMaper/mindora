import { prisma as db } from "@/lib/db";
import { AREA_PROJECT_IDS } from "@/lib/life";
import { getRecentDocs, getWritingPulse } from "@/features/docs/queries";
import type {
  ResearchHubData,
  ResearchProjectItem,
  ResearchProjectScope,
  ResearchQuoteItem,
  ResearchSourceItem,
} from "./types";
import type { SourceReadingStatus } from "@/types/db";

function docProjectFilter(scope: ResearchProjectScope): {
  projectId?: string | null | "NONE";
} {
  if (scope === "all") return {};
  if (scope === "inbox") return { projectId: "NONE" };
  return { projectId: scope };
}

/** Task board project ids for the selected research scope. */
export async function resolveResearchTaskProjectIds(
  userId: string,
  scope: ResearchProjectScope,
): Promise<string[]> {
  if (scope === "inbox") return [AREA_PROJECT_IDS.PHD];
  if (scope !== "all") return [scope];

  const projects = await listPhdResearchProjects(userId);
  const ids = projects.map(p => p.id);
  if (!ids.includes(AREA_PROJECT_IDS.PHD)) ids.push(AREA_PROJECT_IDS.PHD);
  return ids.length > 0 ? ids : [AREA_PROJECT_IDS.PHD];
}

export async function listPhdResearchProjects(
  userId: string,
): Promise<ResearchProjectItem[]> {
  const rows = await db.projectMember.findMany({
    where: {
      userId,
      project: {
        area: "PHD",
        status: { not: "ARCHIVED" },
        id: { not: AREA_PROJECT_IDS.PHD },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
    select: {
      project: {
        select: { id: true, name: true, description: true },
      },
    },
  });
  return rows.map(r => r.project);
}

export async function getResearchHubData(
  userId: string,
  scope: ResearchProjectScope = "all",
): Promise<ResearchHubData> {
  const projectFilter = docProjectFilter(scope);
  const [phdDocs, quotes, sources, pulse] = await Promise.all([
    getRecentDocs(userId, { limit: 12, area: "PHD", ...projectFilter }),
    getRecentPhdQuotes(userId, 12, scope),
    getAggregatedPhdSources(userId, { ...projectFilter }),
    getWritingPulse(userId, { limit: 8, area: "PHD", ...projectFilter }),
  ]);

  return { phdDocs, quotes, sources, pulse };
}

export async function getRecentPhdQuotes(
  userId: string,
  limit = 12,
  scope: ResearchProjectScope = "all",
): Promise<ResearchQuoteItem[]> {
  const projectFilter = docProjectFilter(scope);
  const rows = await db.docQuote.findMany({
    where: {
      doc: {
        userId,
        area: "PHD",
        deletedAt: null,
        archived: false,
        ...(projectFilter.projectId === "NONE"
          ? { projectId: null }
          : projectFilter.projectId
            ? { projectId: projectFilter.projectId }
            : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      text: true,
      note: true,
      createdAt: true,
      sourceId: true,
      docId: true,
      doc: { select: { title: true } },
      source: { select: { title: true } },
    },
  });

  return rows.map(q => ({
    id: q.id,
    text: q.text,
    note: q.note,
    createdAt: q.createdAt,
    docId: q.docId,
    docTitle: q.doc.title,
    sourceId: q.sourceId,
    sourceTitle: q.source?.title ?? null,
  }));
}

export async function getAggregatedPhdSources(
  userId: string,
  opts?: {
    search?: string;
    readingStatus?: SourceReadingStatus | "ALL";
    projectId?: string | null | "NONE";
  },
): Promise<ResearchSourceItem[]> {
  const search = opts?.search?.trim();
  const status =
    opts?.readingStatus && opts.readingStatus !== "ALL"
      ? opts.readingStatus
      : undefined;

  const rows = await db.docSource.findMany({
    where: {
      doc: {
        userId,
        area: "PHD",
        deletedAt: null,
        ...(opts?.projectId === "NONE"
          ? { projectId: null }
          : opts?.projectId
            ? { projectId: opts.projectId }
            : {}),
      },
      ...(status ? { readingStatus: status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { authors: { contains: search, mode: "insensitive" } },
              { doi: { contains: search, mode: "insensitive" } },
              { notes: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
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
      updatedAt: true,
      docId: true,
      doc: { select: { title: true } },
      _count: { select: { quotes: true } },
    },
  });

  return rows.map(s => ({
    id: s.id,
    title: s.title,
    authors: s.authors,
    url: s.url,
    year: s.year,
    doi: s.doi,
    notes: s.notes,
    fileUrl: s.fileUrl,
    fileName: s.fileName,
    readingStatus: s.readingStatus,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    docId: s.docId,
    docTitle: s.doc.title,
    quoteCount: s._count.quotes,
  }));
}

export function parseResearchProjectScope(
  raw: string | undefined | null,
): ResearchProjectScope {
  if (!raw || raw === "all") return "all";
  if (raw === "inbox") return "inbox";
  return raw;
}
