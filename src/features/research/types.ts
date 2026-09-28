import type { DocStatus, LifeArea, SourceReadingStatus } from "@/types/db";
import type { DocListItem, WritingPulseItem } from "@/features/docs/types";

export type ResearchTab = "pipeline" | "library" | "writing";

/** all = every PHD line; inbox = docs/tasks without a research project (area-phd + null docs) */
export type ResearchProjectScope = "all" | "inbox" | string;

export interface ResearchProjectItem {
  id: string;
  name: string;
  description: string | null;
}

export interface ResearchQuoteItem {
  id: string;
  text: string;
  note: string | null;
  createdAt: Date;
  docId: string;
  docTitle: string;
  sourceId: string | null;
  sourceTitle: string | null;
}

export interface ResearchSourceItem {
  id: string;
  title: string;
  authors: string | null;
  url: string | null;
  year: string | null;
  doi: string | null;
  notes: string | null;
  fileUrl: string | null;
  fileName: string | null;
  readingStatus: SourceReadingStatus;
  createdAt: Date;
  updatedAt: Date;
  docId: string;
  docTitle: string;
  quoteCount: number;
}

export interface ResearchHubData {
  phdDocs: DocListItem[];
  quotes: ResearchQuoteItem[];
  sources: ResearchSourceItem[];
  pulse: WritingPulseItem[];
}

export const RESEARCH_TASK_TO_DOC_STATUS: Record<string, DocStatus> = {
  BACKLOG: "IDEA",
  TODO: "DRAFTING",
  IN_PROGRESS: "DRAFTING",
  DONE: "READY",
  REVIEW: "REVIEW",
  TESTING: "DRAFTING",
  BLOCKED: "DRAFTING",
};

export const DOC_STATUS_HINT: Record<
  DocStatus,
  { fa: string; en: string; researchCol: string }
> = {
  IDEA: { fa: "ایده", en: "Idea", researchCol: "BACKLOG" },
  DRAFTING: { fa: "مطالعه / نوشتن", en: "Reading / Writing", researchCol: "IN_PROGRESS" },
  REVIEW: { fa: "بازخوانی", en: "Review", researchCol: "IN_PROGRESS" },
  READY: { fa: "سابمیت", en: "Submitted", researchCol: "DONE" },
};

export type { LifeArea, SourceReadingStatus };
