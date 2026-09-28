import type { DocStatus, LifeArea, SourceReadingStatus } from "@/types/db";
import type { DocListItem, WritingPulseItem } from "@/features/docs/types";
import {
  RESEARCH_TASK_TO_DOC_STATUS,
  RESEARCH_TASK_TO_SOURCE_READING,
  SOURCE_READING_TO_TASK,
  SOURCE_READING_TO_DOC,
} from "./status-sync";

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
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  docId: string;
  docTitle: string;
  quoteCount: number;
  /** True when still hosted on a path-library binder (legacy). */
  isBinderHost: boolean;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  /** Synced when a PhD DocTask exists on the host note. */
  hasSyncLink: boolean;
}

export interface ResearchHubData {
  phdDocs: DocListItem[];
  quotes: ResearchQuoteItem[];
  sources: ResearchSourceItem[];
  pulse: WritingPulseItem[];
}

export {
  RESEARCH_TASK_TO_DOC_STATUS,
  RESEARCH_TASK_TO_SOURCE_READING,
  SOURCE_READING_TO_TASK,
  SOURCE_READING_TO_DOC,
};

export const DOC_STATUS_HINT: Record<
  DocStatus,
  { fa: string; en: string; researchCol: string }
> = {
  IDEA: { fa: "ایده", en: "Idea", researchCol: "BACKLOG" },
  DRAFTING: { fa: "خواندن / یادداشت", en: "Reading / notes", researchCol: "TODO" },
  REVIEW: { fa: "نوشتن", en: "Writing", researchCol: "IN_PROGRESS" },
  READY: { fa: "سابمیت", en: "Submitted", researchCol: "DONE" },
};

export type { LifeArea, SourceReadingStatus };
