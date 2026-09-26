import { prisma as db } from "@/lib/db";
import type {
  GetTeamsResult,
  TeamRow,
  TeamDetail,
  TeamMemberRow,
  RoleRow,
  AvailableUserRow,
} from "./types";

const PAGE_SIZE = 15;

export async function getTeams(
  search = "",
  status = "",
  page = 1,
): Promise<GetTeamsResult> {
  const skip = (page - 1) * PAGE_SIZE;
  const andConditions: Record<string, unknown>[] = [];

  if (search) {
    andConditions.push({
      name: { contains: search, mode: "insensitive" as const },
    });
  }

  if (status === "ACTIVE") {
    andConditions.push({ NOT: { name: { startsWith: "[Archived]" } } });
  } else if (status === "ARCHIVED") {
    andConditions.push({ name: { startsWith: "[Archived]" } });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [teams, total] = await Promise.all([
    db.team.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { members: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.team.count({ where }),
  ]);

  return {
    teams: teams.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      memberCount: t._count.members,
      status: t.name.startsWith("[Archived]")
        ? ("ARCHIVED" as const)
        : ("ACTIVE" as const),
      createdAt: t.createdAt,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getUserTeams(userId: string): Promise<TeamRow[]> {
  const memberships = await db.teamMember.findMany({
    where: { userId },
    select: {
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { members: true } },
          createdAt: true,
        },
      },
    },
  });

  return memberships.map(m => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    memberCount: m.team._count.members,
    status: m.team.name.startsWith("[Archived]")
      ? ("ARCHIVED" as const)
      : ("ACTIVE" as const),
    createdAt: m.team.createdAt,
  }));
}

export async function getTeamById(id: string): Promise<TeamDetail | null> {
  const team = await db.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      _count: { select: { members: true } },
      createdAt: true,
      members: {
        select: {
          id: true,
          userId: true,
          roleId: true,
          role: { select: { name: true } },
          user: { select: { name: true, email: true, avatar: true } },
          createdAt: true,
        },
      },
    },
  });

  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    organizationId: team.organizationId,
    memberCount: team._count.members,
    status: team.name.startsWith("[Archived]")
      ? ("ARCHIVED" as const)
      : ("ACTIVE" as const),
    createdAt: team.createdAt,
    members: team.members.map(m => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      userAvatar: m.user.avatar,
      roleId: m.roleId,
      roleName: m.role.name,
      joinedAt: m.createdAt,
    })),
  };
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  const members = await db.teamMember.findMany({
    where: { teamId },
    select: {
      id: true,
      userId: true,
      roleId: true,
      role: { select: { name: true } },
      user: { select: { name: true, email: true, avatar: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map(m => ({
    id: m.id,
    userId: m.userId,
    userName: m.user.name,
    userEmail: m.user.email,
    userAvatar: m.user.avatar,
    roleId: m.roleId,
    roleName: m.role.name,
    joinedAt: m.createdAt,
  }));
}

export async function getAvailableRoles(): Promise<RoleRow[]> {
  const roles = await db.role.findMany({
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          permission: { select: { key: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return roles.map(r => ({
    id: r.id,
    name: r.name,
    permissions: r.permissions.map(p => p.permission.key),
  }));
}

export async function getAllUsersForInvite(
  _teamId: string,
): Promise<AvailableUserRow[]> {
  // Personal Life OS: no cross-user team invites.
  return [];
}
