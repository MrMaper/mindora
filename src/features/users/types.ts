import type { UserRole, UserStatus } from "@/types/db";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  teamId: string | null;
  teamName: string | null;
}

export interface GetUsersResult {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
}
