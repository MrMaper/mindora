import { prisma as db } from "@/lib/db";
import type {
  GetProjectsResult,
  ProjectRow,
  ProjectDetail,
  ProjectMemberRow,
  ProjectTaskRow,
  ProjectActivityRow,
} from "./types";

const PAGE_SIZE = 15;

export async function getProjects(
  search = "",
  page = 1,
  userId?: string,
): Promise<GetProjectsResult> {
  const skip = (page - 1) * PAGE_SIZE;
  const where: Record<string, unknown> = search
    ? {
        name: { contains: search, mode: "insensitive" as const },
      }
    : {};

  if (userId) {
    where.members = {
      some: { userId },
    };
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        teamId: true,
        team: { select: { name: true } },
        _count: { select: { members: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.project.count({ where }),
  ]);

  return {
    projects: projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      teamId: p.teamId,
      teamName: p.team?.name ?? null,
      memberCount: p._count.members,
      createdAt: p.createdAt,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getUserProjects(userId: string): Promise<ProjectRow[]> {
  const memberships = await db.projectMember.findMany({
    where: { userId },
    select: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          teamId: true,
          team: { select: { name: true } },
          _count: { select: { members: true } },
          createdAt: true,
        },
      },
    },
  });

  return memberships
    .filter(m => m.project.status !== "ARCHIVED")
    .map(m => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      status: m.project.status,
      teamId: m.project.teamId,
      teamName: m.project.team?.name ?? null,
      memberCount: m.project._count.members,
      createdAt: m.project.createdAt,
    }));
}

export async function getProjectById(
  id: string,
): Promise<ProjectDetail | null> {
  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      teamId: true,
      team: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          id: true,
          userId: true,
          role: true,
          user: { select: { name: true, email: true, avatar: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { tasks: true, sprints: true, members: true } },
    },
  });

  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    teamId: project.teamId ?? null,
    teamName: project.team?.name ?? null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    members: project.members.map(m => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name,
      userEmail: m.user.email,
      userAvatar: m.user.avatar,
      role: m.role,
      joinedAt: m.createdAt,
    })),
    _count: {
      tasks: project._count.tasks,
      sprints: project._count.sprints,
      members: project._count.members,
    },
  };
}

export async function getProjectMembers(
  projectId: string,
): Promise<ProjectMemberRow[]> {
  const members = await db.projectMember.findMany({
    where: { projectId },
    select: {
      id: true,
      userId: true,
      role: true,
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
    role: m.role,
    joinedAt: m.createdAt,
  }));
}

export async function getProjectMemberUserOptions(projectId: string): Promise<{ value: string; label: string }[]> {
  const members = await db.projectMember.findMany({
    where: { projectId },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return members.map(m => ({
    value: m.user.id,
    label: `${m.user.name} (${m.user.email})`,
  }));
}

export async function getAvailableRoles() {
  return [
    { value: "OWNER", label: "Owner" },
    { value: "ADMIN", label: "Admin" },
    { value: "MEMBER", label: "Member" },
    { value: "VIEWER", label: "Viewer" },
  ];
}

export async function getAllUsersForInvite(projectId: string) {
  const existingMemberIds = await db.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });

  const userIds = existingMemberIds.map(m => m.userId);

  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: userIds },
    },
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: "asc" },
  });

  return users;
}

export async function getProjectTasks(
  projectId: string,
): Promise<ProjectTaskRow[]> {
  const tasks = await db.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      storyPoints: true,
      dueDate: true,
      assignedTo: { select: { id: true, name: true, avatar: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  return tasks.map(t => ({
    ...t,
    assignee: t.assignedTo
      ? { id: t.assignedTo.id, name: t.assignedTo.name, avatar: t.assignedTo.avatar }
      : null,
  }));
}

export async function getProjectActivity(
  projectId: string,
): Promise<ProjectActivityRow[]> {
  const taskIds = await db.task.findMany({
    where: { projectId },
    select: { id: true },
  });

  if (taskIds.length === 0) return [];

  const activities = await db.activityLog.findMany({
    where: {
      entity: "TASK",
      entityId: { in: taskIds.map(t => t.id) },
    },
    orderBy: { timestamp: "desc" },
    take: 50,
    select: {
      id: true,
      entity: true,
      entityId: true,
      action: true,
      performedBy: true,
      oldValue: true,
      newValue: true,
      timestamp: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return activities.map(a => ({
    id: a.id,
    entity: a.entity,
    entityId: a.entityId,
    action: a.action,
    performedBy: a.user,
    oldValue: a.oldValue as Record<string, unknown> | null,
    newValue: a.newValue as Record<string, unknown> | null,
    timestamp: a.timestamp,
  }));
}
