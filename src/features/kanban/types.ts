import type { LifeArea, TaskPriority } from "@/types/db";
import type { TaskRow } from "@/features/tasks/types";

/** Active personal-board columns (Mindora). */
export type BoardStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";

/** Legacy scrum columns — still in DB enum; migrated to IN_PROGRESS on load. */
export const LEGACY_BOARD_STATUSES = ["REVIEW", "TESTING", "BLOCKED"] as const;
export type LegacyBoardStatus = (typeof LEGACY_BOARD_STATUSES)[number];

/** Main /kanban (+ research board): Inbox → This Week → In Progress → Done. */
export const BOARD_STATUSES: BoardStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
];

/** @deprecated Same as BOARD_STATUSES — kept for research page imports. */
export const RESEARCH_BOARD_STATUSES: BoardStatus[] = BOARD_STATUSES;

export type BoardColumns = Record<BoardStatus, TaskRow[]>;

export interface BoardFilters {
  search?: string;
  assigneeId?: string;
  labelId?: string;
  priority?: TaskPriority;
  projectIds?: string[];
  area?: LifeArea;
  /** When true (default for /kanban), hide research/language hub tasks. */
  excludeHub?: boolean;
  /** Cap cards loaded for the board (default 400). */
  limit?: number;
}

export function isBoardStatus(id: string): id is BoardStatus {
  return (BOARD_STATUSES as string[]).includes(id);
}

export function isLegacyBoardStatus(id: string): id is LegacyBoardStatus {
  return (LEGACY_BOARD_STATUSES as readonly string[]).includes(id);
}
