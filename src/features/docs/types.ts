import type { DocStatus, LifeArea, SourceReadingStatus } from "@/types/db";

export interface DocTaskRef {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
}

export interface DocSourceItem {
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
}

export interface DocQuoteItem {
  id: string;
  text: string;
  note: string | null;
  sourceId: string | null;
  sourceTitle: string | null;
  createdAt: Date;
}

export interface DocVersionItem {
  id: string;
  title: string;
  note: string | null;
  wordCount: number;
  content?: string;
  contentText?: string;
  createdAt: Date;
}

export interface DocTagItem {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export interface DocFolderItem {
  id: string;
  name: string;
  description: string | null;
  area: LifeArea | null;
  parentId: string | null;
  docCount: number;
}

export interface DocListItem {
  id: string;
  title: string;
  area: LifeArea;
  status: DocStatus;
  pinned: boolean;
  archived: boolean;
  deletedAt: Date | null;
  folderId: string | null;
  folderName: string | null;
  projectId: string | null;
  projectName: string | null;
  updatedAt: Date;
  preview: string;
  taskCount: number;
  wordCount: number;
  tags: DocTagItem[];
  daysIdle?: number;
}

export interface DocDetail {
  id: string;
  title: string;
  content: string;
  contentText: string;
  area: LifeArea;
  status: DocStatus;
  wordGoal: number | null;
  templateKey: string | null;
  pinned: boolean;
  archived: boolean;
  deletedAt: Date | null;
  folderId: string | null;
  folderName: string | null;
  projectId: string | null;
  projectName: string | null;
  createdAt: Date;
  updatedAt: Date;
  tasks: DocTaskRef[];
  sources: DocSourceItem[];
  quotes: DocQuoteItem[];
  versions: DocVersionItem[];
  tags: DocTagItem[];
}

export interface WritingPulseItem {
  id: string;
  title: string;
  area: LifeArea;
  status: DocStatus;
  daysIdle: number;
  wordCount: number;
  wordGoal: number | null;
  severity: "soft" | "warn" | "critical";
  reasonFa: string;
  reasonEn: string;
}

export const DOC_STATUSES: DocStatus[] = [
  "IDEA",
  "DRAFTING",
  "REVIEW",
  "READY",
];

export const TRASH_RETENTION_DAYS = 30;
