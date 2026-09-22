import type { TaskPriority } from "@/types/db";
import type { TaskRow } from "@/features/tasks/types";

export type BoardStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "TESTING"
  | "BLOCKED"
  | "DONE";

/** Main /kanban columns — includes every TaskStatus so cards never vanish. */
export const BOARD_STATUSES: BoardStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "TESTING",
  "BLOCKED",
  "DONE",
];

export const RESEARCH_BOARD_STATUSES: BoardStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
];

export type BoardColumns = Record<BoardStatus, TaskRow[]>;

export interface BoardFilters {
  search?: string;
  assigneeId?: string;
  labelId?: string;
  priority?: TaskPriority;
  projectIds?: string[];
  /** When true (default for /kanban), hide research/language hub tasks. */
  excludeHub?: boolean;
}

export function isBoardStatus(id: string): id is BoardStatus {
  return (BOARD_STATUSES as string[]).includes(id);
}
