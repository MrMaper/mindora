import type { TaskStatus, TaskPriority, TaskType } from "@/types/db";
import type { TaskStatus as DisplayStatus } from "@/components/ui-kit/agile/status-badge";
import type { Priority as DisplayPriority } from "@/components/ui-kit/agile/priority-icon";

export interface TaskUserRef {
  id: string;
  name: string;
  avatar: string | null;
}

export interface TaskLabelRef {
  id: string;
  name: string;
  color: string;
}

export interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: TaskUserRef;
  assignedTo: TaskUserRef | null;
  labels: TaskLabelRef[];
}

export interface TaskActivityEntry {
  id: string;
  action: string;
  performedBy: TaskUserRef;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
}

export interface TaskDetail extends TaskRow {
  description: string | null;
  activity: TaskActivityEntry[];
}

export interface GetTasksParams {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  sort?: "title" | "priority" | "status" | "dueDate" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
}

export interface GetTasksResult {
  tasks: TaskRow[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_TO_DISPLAY: Record<TaskStatus, DisplayStatus> = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  REVIEW: "review",
  TESTING: "testing",
  DONE: "done",
  BLOCKED: "blocked",
};

export function statusToDisplay(status: TaskStatus): DisplayStatus {
  return STATUS_TO_DISPLAY[status];
}

export function priorityToDisplay(priority: TaskPriority): DisplayPriority {
  return priority.toLowerCase() as DisplayPriority;
}

export const STATUS_OPTIONS: { value: TaskStatus; labelKey: string }[] = [
  { value: "BACKLOG", labelKey: "backlog" },
  { value: "TODO", labelKey: "todo" },
  { value: "IN_PROGRESS", labelKey: "inProgress" },
  { value: "REVIEW", labelKey: "review" },
  { value: "TESTING", labelKey: "testing" },
  { value: "DONE", labelKey: "done" },
  { value: "BLOCKED", labelKey: "blocked" },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; labelKey: string }[] = [
  { value: "URGENT", labelKey: "urgent" },
  { value: "HIGH", labelKey: "high" },
  { value: "MEDIUM", labelKey: "medium" },
  { value: "LOW", labelKey: "low" },
  { value: "NONE", labelKey: "none" },
];

export const TYPE_OPTIONS: { value: TaskType; labelKey: string }[] = [
  { value: "TASK", labelKey: "task" },
  { value: "STORY", labelKey: "story" },
  { value: "BUG", labelKey: "bug" },
  { value: "EPIC", labelKey: "epic" },
];
