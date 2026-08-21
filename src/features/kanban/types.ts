import type { TaskPriority } from "@/types/db";
import type { TaskRow } from "@/features/tasks/types";

export type BoardStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export const BOARD_STATUSES: BoardStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export type BoardColumns = Record<BoardStatus, TaskRow[]>;

export interface BoardFilters {
  search?: string;
  assigneeId?: string;
  labelId?: string;
  priority?: TaskPriority;
  projectIds?: string[];
}
