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
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  totalOnlineSeconds: number;
  isOnline: boolean;
}

export interface UserActivityStats {
  totalUsers: number;
  activeUsers: number;
  onlineNow: number;
  loggedInToday: number;
  totalOnlineSeconds: number;
}

export interface UserLoginEventRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Date | string;
  ip: string | null;
  userAgent: string | null;
}

export interface AdminOverview {
  stats: UserActivityStats;
  recentLogins: UserLoginEventRow[];
  bale: {
    enabled: boolean;
    hasToken: boolean;
    botUsername: string | null;
    botName: string | null;
    webhookOk: boolean;
    webhookError: string | null;
    pendingUpdates: number;
  };
  membersWithBale: number;
  inactiveUsers: number;
}

export interface GetUsersResult {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  stats: UserActivityStats;
}
