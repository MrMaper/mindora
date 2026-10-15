import type { UserRole, UserStatus } from "@/types/db";
import type { ModuleFlags, ModulePolicy } from "@/lib/modules";
import type { UiProfile } from "@/lib/ui-profile";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  /** Modules the admin allows (policy != off). */
  allowedModules: ModuleFlags;
  modulePolicy: ModulePolicy;
  /** "starter" | "full" (UserPreferences.uiProfile). */
  uiProfile: UiProfile;
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

/** Member Security tab snapshot (Settings → Security). */
export interface SecuritySnapshot {
  lastLoginAt: Date | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  hasPassword: boolean;
  loginEvents: UserLoginEventRow[];
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
