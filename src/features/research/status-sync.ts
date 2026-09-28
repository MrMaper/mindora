import type { DocStatus, SourceReadingStatus, TaskStatus } from "@/types/db";

/** Pipeline card status → linked writing doc status. */
export const RESEARCH_TASK_TO_DOC_STATUS: Record<string, DocStatus> = {
  BACKLOG: "IDEA",
  TODO: "DRAFTING",
  IN_PROGRESS: "REVIEW",
  DONE: "READY",
  REVIEW: "REVIEW",
  TESTING: "DRAFTING",
  BLOCKED: "DRAFTING",
};

/** Pipeline card status → library reading status on linked sources. */
export const RESEARCH_TASK_TO_SOURCE_READING: Record<
  string,
  SourceReadingStatus
> = {
  BACKLOG: "TO_READ",
  TODO: "READING",
  IN_PROGRESS: "READING",
  DONE: "DONE",
  REVIEW: "READING",
  TESTING: "READING",
  BLOCKED: "TO_READ",
};

/** Library reading status → pipeline card status (when DocTask-linked). */
export const SOURCE_READING_TO_TASK: Record<SourceReadingStatus, TaskStatus> = {
  TO_READ: "BACKLOG",
  READING: "TODO",
  DONE: "DONE",
};

/** Library reading status → linked source-note doc status. */
export const SOURCE_READING_TO_DOC: Record<SourceReadingStatus, DocStatus> = {
  TO_READ: "IDEA",
  READING: "DRAFTING",
  DONE: "READY",
};

export function librarySystemKey(
  projectId: string | null | undefined,
): string {
  if (projectId) return `phd-library:${projectId}`;
  return "phd-library:inbox";
}

export function isLibraryBinderSystemKey(
  key: string | null | undefined,
): boolean {
  return !!key?.startsWith("phd-library:");
}

/**
 * Prisma `where` fragment: hide path-library binder docs from user-facing lists.
 * Binders stay in DB as indexes; they must not appear in Writing / cite / Today counts.
 */
export const excludeLibraryBindersWhere: {
  OR: Array<
    | { systemKey: null }
    | { NOT: { systemKey: { startsWith: string } } }
  >;
} = {
  OR: [
    { systemKey: null },
    { NOT: { systemKey: { startsWith: "phd-library:" } } },
  ],
};
