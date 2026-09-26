import type { UserRole, UserStatus } from "@/types/db";
import type { ModuleFlags } from "@/lib/modules";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  enabledModules: ModuleFlags;
}

export interface GetUsersResult {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
}
