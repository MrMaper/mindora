import type { LifeArea, TaskStatus, TaskPriority, TaskType } from "@/types/db";

export interface WorkLogUserRef {
  id: string;
  name: string;
  avatar: string | null;
}

export interface WorkLogRow {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: WorkLogUserRef;
}

export interface WorkLogDetail extends WorkLogRow {
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    projectId: string | null;
  };
}

export interface GetWorkLogsParams {
  taskId?: string;
  userId?: string;
  projectId?: string;
  area?: LifeArea;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sort?: "date" | "hours" | "createdAt";
  order?: "asc" | "desc";
}

export interface GetWorkLogsResult {
  workLogs: WorkLogRow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WorkLogSummary {
  totalHours: number;
  totalEntries: number;
  byUser: Record<string, { user: WorkLogUserRef; hours: number }>;
  byTask: Record<string, { taskTitle: string; hours: number }>;
  byProject: Record<string, { projectName: string; hours: number }>;
  byDate: Record<string, number>;
}

export const HOURS_OPTIONS = [
  { value: 0.25, label: "0.25h (15m)" },
  { value: 0.5, label: "0.5h (30m)" },
  { value: 0.75, label: "0.75h (45m)" },
  { value: 1, label: "1h" },
  { value: 1.5, label: "1.5h" },
  { value: 2, label: "2h" },
  { value: 3, label: "3h" },
  { value: 4, label: "4h" },
  { value: 5, label: "5h" },
  { value: 6, label: "6h" },
  { value: 7, label: "7h" },
  { value: 8, label: "8h" },
] as const;