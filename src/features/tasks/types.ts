import type { LifeArea, TaskStatus, TaskPriority, TaskType } from "@/types/db";
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
  durationMinutes?: number | null;
  waitingOn?: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: TaskUserRef;
  assignedTo: TaskUserRef | null;
  labels: TaskLabelRef[];
  projectId: string | null;
  projectName: string | null;
  area?: "PHD" | "WORK" | "LIFE" | "LANG" | null;
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurrenceSeriesId?: string | null;
  recurrenceEndsAt?: Date | null;
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
  projectIds?: string[];
  area?: LifeArea;
  labelId?: string;
  /** Default true: hide research/language hub tasks on /tasks. */
  excludeHub?: boolean;
  sort?: "title" | "project" | "status" | "priority" | "assignee" | "dueDate" | "createdAt";
  order?: "asc" | "desc";
  /** When set, the page returns the filtered set so groups stay intact. */
  group?: "path" | "date" | "status" | "area";
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
  REVIEW: "in-progress",
  TESTING: "in-progress",
  DONE: "done",
  BLOCKED: "in-progress",
};

export function statusToDisplay(status: TaskStatus): DisplayStatus {
  return STATUS_TO_DISPLAY[status];
}

export function priorityToDisplay(priority: TaskPriority): DisplayPriority {
  return priority.toLowerCase() as DisplayPriority;
}

/** Active board / form statuses — Inbox, This Week, In Progress, Done. */
export const STATUS_OPTIONS: { value: TaskStatus; labelKey: string }[] = [
  { value: "BACKLOG", labelKey: "backlog" },
  { value: "TODO", labelKey: "todo" },
  { value: "IN_PROGRESS", labelKey: "inProgress" },
  { value: "DONE", labelKey: "done" },
];

export type FormTaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";

/** Map legacy scrum statuses into the active four for forms. */
export function toFormStatus(status: TaskStatus): FormTaskStatus {
  if (
    status === "BACKLOG" ||
    status === "TODO" ||
    status === "IN_PROGRESS" ||
    status === "DONE"
  ) {
    return status;
  }
  return "IN_PROGRESS";
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function activityLabel(t: any, action: string): string {
  switch (action) {
    case "created":
      return t.tasks.activityCreated;
    case "status_changed":
      return t.tasks.activityStatusChanged;
    case "assigned":
      return t.tasks.activityAssigned;
    case "commented":
      return t.tasks.activityCommented;
    case "attachment_added":
      return t.tasks.activityAttachment;
    default:
      return t.tasks.activityUpdated;
  }
}
