import type { NotificationType } from "@/types/db";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  data: unknown;
  createdAt: Date;
}

export interface GetNotificationsResult {
  notifications: NotificationRow[];
  total: number;
  page: number;
  totalPages: number;
}
