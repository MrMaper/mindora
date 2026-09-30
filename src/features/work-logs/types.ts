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
  0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8,
] as const;