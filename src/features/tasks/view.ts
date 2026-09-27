import type { TaskPriority, TaskStatus } from "@/types/db";
import type { TaskRow } from "./types";
import { isAreaBucketId } from "@/lib/area-projects";
import { toDateKey } from "@/lib/life";

export const TASK_SORT_FIELDS = [
  "title",
  "project",
  "status",
  "priority",
  "assignee",
  "dueDate",
  "createdAt",
] as const;

export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const TASK_GROUP_FIELDS = ["path", "date", "status", "area"] as const;

export type TaskGroupField = (typeof TASK_GROUP_FIELDS)[number];

export const TASK_GROUP_NONE = "__none__";

const STATUS_RANK: Record<TaskStatus, number> = {
  BACKLOG: 0,
  TODO: 1,
  IN_PROGRESS: 2,
  REVIEW: 3,
  TESTING: 4,
  DONE: 5,
  BLOCKED: 6,
};

const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

const AREA_RANK: Record<string, number> = {
  PHD: 0,
  WORK: 1,
  LIFE: 2,
  LANG: 3,
};

export function parseTaskSort(value: string | undefined): TaskSortField {
  if (value && (TASK_SORT_FIELDS as readonly string[]).includes(value)) {
    return value as TaskSortField;
  }
  return "createdAt";
}

export function parseTaskGroup(value: string | undefined): TaskGroupField | null {
  if (value && (TASK_GROUP_FIELDS as readonly string[]).includes(value)) {
    return value as TaskGroupField;
  }
  return null;
}

export function parseTaskOrder(value: string | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

function pathName(task: TaskRow): string {
  if (!task.projectId || isAreaBucketId(task.projectId)) return "";
  return task.projectName?.trim() ?? "";
}

function compareText(a: string, b: string, order: "asc" | "desc"): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b, "fa");
  return order === "asc" ? cmp : -cmp;
}

function compareRank(a: number, b: number, order: "asc" | "desc"): number {
  return order === "asc" ? a - b : b - a;
}

function compareTime(a: number | null, b: number | null, order: "asc" | "desc"): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return order === "asc" ? a - b : b - a;
}

export function compareTasks(
  a: TaskRow,
  b: TaskRow,
  sort: TaskSortField,
  order: "asc" | "desc",
): number {
  let cmp = 0;
  switch (sort) {
    case "title":
      cmp = compareText(a.title, b.title, order);
      break;
    case "project":
      cmp = compareText(pathName(a), pathName(b), order);
      break;
    case "status":
      cmp = compareRank(STATUS_RANK[a.status] ?? 99, STATUS_RANK[b.status] ?? 99, order);
      break;
    case "priority":
      cmp = compareRank(
        PRIORITY_RANK[a.priority] ?? 99,
        PRIORITY_RANK[b.priority] ?? 99,
        order,
      );
      break;
    case "assignee":
      cmp = compareText(a.assignedTo?.name ?? "", b.assignedTo?.name ?? "", order);
      break;
    case "dueDate":
      cmp = compareTime(
        a.dueDate ? new Date(a.dueDate).getTime() : null,
        b.dueDate ? new Date(b.dueDate).getTime() : null,
        order,
      );
      break;
    default:
      cmp = compareTime(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime(), order);
      break;
  }
  if (cmp !== 0) return cmp;
  const title = a.title.localeCompare(b.title, "fa");
  if (title !== 0) return title;
  return a.id.localeCompare(b.id);
}

export function taskGroupKey(task: TaskRow, group: TaskGroupField): string {
  switch (group) {
    case "path":
      return pathName(task) ? (task.projectId ?? TASK_GROUP_NONE) : TASK_GROUP_NONE;
    case "date":
      return task.dueDate ? toDateKey(new Date(task.dueDate)) : TASK_GROUP_NONE;
    case "status":
      return task.status;
    case "area":
      return task.area ?? TASK_GROUP_NONE;
  }
}

function compareGroupKeys(
  a: string,
  b: string,
  group: TaskGroupField,
  names: Map<string, string>,
): number {
  if (a === TASK_GROUP_NONE && b === TASK_GROUP_NONE) return 0;
  if (a === TASK_GROUP_NONE) return 1;
  if (b === TASK_GROUP_NONE) return -1;
  if (group === "status") {
    return (STATUS_RANK[a as TaskStatus] ?? 99) - (STATUS_RANK[b as TaskStatus] ?? 99);
  }
  if (group === "area") {
    return (AREA_RANK[a] ?? 99) - (AREA_RANK[b] ?? 99);
  }
  if (group === "date") return a.localeCompare(b);
  return (names.get(a) ?? a).localeCompare(names.get(b) ?? b, "fa");
}

export interface TaskGroup {
  key: string;
  tasks: TaskRow[];
}

export function groupTasks(tasks: TaskRow[], group: TaskGroupField): TaskGroup[] {
  const buckets = new Map<string, TaskRow[]>();
  const names = new Map<string, string>();
  for (const task of tasks) {
    const key = taskGroupKey(task, group);
    const list = buckets.get(key);
    if (list) list.push(task);
    else buckets.set(key, [task]);
    if (group === "path" && key !== TASK_GROUP_NONE && !names.has(key)) {
      names.set(key, task.projectName ?? key);
    }
  }
  return [...buckets.keys()]
    .sort((a, b) => compareGroupKeys(a, b, group, names))
    .map(key => ({ key, tasks: buckets.get(key) ?? [] }));
}
