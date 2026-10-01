import { prisma as db } from "@/lib/db";
import { parseModuleFlags } from "@/lib/modules";
import { startOfZonedDay } from "@/lib/life";
import { ONLINE_WINDOW_MS, isUserOnline } from "@/lib/presence";
import type {
  AdminOverview,
  GetUsersResult,
  UserActivityStats,
  UserLoginEventRow,
  UserRow,
} from "./types";
import { getBaleSettingsView } from "@/features/external/bots/bale/config";

const PAGE_SIZE = 15;

function mapUser(u: {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRow["role"];
  status: UserRow["status"];
  createdAt: Date;
  enabledModules: unknown;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  totalOnlineSeconds: number;
}): UserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    enabledModules: parseModuleFlags(u.enabledModules),
    lastLoginAt: u.lastLoginAt,
    lastSeenAt: u.lastSeenAt,
    totalOnlineSeconds: u.totalOnlineSeconds,
    isOnline: isUserOnline(u.lastSeenAt),
  };
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  status: true,
  createdAt: true,
  enabledModules: true,
  lastLoginAt: true,
  lastSeenAt: true,
  totalOnlineSeconds: true,
} as const;

export async function getUserActivityStats(): Promise<UserActivityStats> {
  const now = new Date();
  const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS);
  const dayStart = startOfZonedDay(now);

  const [totalUsers, activeUsers, onlineNow, loggedInToday, onlineAgg] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.user.count({
        where: { lastSeenAt: { gte: onlineSince } },
      }),
      db.user.count({
        where: { lastLoginAt: { gte: dayStart } },
      }),
      db.user.aggregate({
        _sum: { totalOnlineSeconds: true },
      }),
    ]);

  return {
    totalUsers,
    activeUsers,
    onlineNow,
    loggedInToday,
    totalOnlineSeconds: onlineAgg._sum.totalOnlineSeconds ?? 0,
  };
}

export async function getUsers(
  search = "",
  page = 1,
  role = "",
  status = "",
  _teamId = "",
  sort = "createdAt",
  order = "desc",
): Promise<GetUsersResult> {
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const orderBy: Record<string, "asc" | "desc"> = {};
  const validSortFields = [
    "createdAt",
    "name",
    "email",
    "role",
    "status",
    "lastLoginAt",
    "lastSeenAt",
    "totalOnlineSeconds",
  ];
  const sortField = validSortFields.includes(sort) ? sort : "createdAt";
  orderBy[sortField] = order === "asc" ? "asc" : "desc";

  const [users, total, stats] = await Promise.all([
    db.user.findMany({
      where,
      select: userSelect,
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
    getUserActivityStats(),
  ]);

  return {
    users: users.map(mapUser),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    stats,
  };
}

/**
 * People a signed-in member may see in assignee/person pickers.
 * Personal Life OS: only the viewer themselves — never other members.
 */
export async function getAssignableUsers(viewerId: string): Promise<UserRow[]> {
  const user = await getUserById(viewerId);
  if (!user || user.status !== "ACTIVE") return [];
  return [user];
}

/** @deprecated Prefer getAssignableUsers — kept for rare admin tooling only. */
export async function getAllActiveUsers(): Promise<UserRow[]> {
  const users = await db.user.findMany({
    where: { status: "ACTIVE", role: "MEMBER" },
    select: userSelect,
    orderBy: { name: "asc" },
  });
  return users.map(mapUser);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: userSelect,
  });
  if (!user) return null;
  return mapUser(user);
}

export async function getUserLoginEvents(
  userId: string,
  limit = 20,
): Promise<UserLoginEventRow[]> {
  const rows = await db.userLoginEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      userId: true,
      createdAt: true,
      ip: true,
      userAgent: true,
      user: { select: { name: true, email: true } },
    },
  });
  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    createdAt: r.createdAt,
    ip: r.ip,
    userAgent: r.userAgent,
  }));
}

export async function getRecentLoginEvents(
  limit = 15,
): Promise<UserLoginEventRow[]> {
  const rows = await db.userLoginEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(40, Math.max(1, limit)),
    select: {
      id: true,
      userId: true,
      createdAt: true,
      ip: true,
      userAgent: true,
      user: { select: { name: true, email: true } },
    },
  });
  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    createdAt: r.createdAt,
    ip: r.ip,
    userAgent: r.userAgent,
  }));
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [stats, recentLogins, bale, membersWithBale, inactiveUsers] =
    await Promise.all([
      getUserActivityStats(),
      getRecentLoginEvents(12),
      getBaleSettingsView(),
      db.user.count({
        where: { role: "MEMBER", baleUserId: { not: null } },
      }),
      db.user.count({ where: { status: "INACTIVE" } }),
    ]);

  const webhookError = bale.webhook?.lastError?.trim() || bale.botError || null;
  const webhookOk =
    bale.enabled &&
    bale.hasToken &&
    !!bale.webhook?.url &&
    !webhookError;

  return {
    stats,
    recentLogins,
    bale: {
      enabled: bale.enabled,
      hasToken: bale.hasToken,
      botUsername: bale.bot?.username ?? null,
      botName: bale.bot?.name ?? null,
      webhookOk,
      webhookError,
      pendingUpdates: bale.webhook?.pending ?? 0,
    },
    membersWithBale,
    inactiveUsers,
  };
}
