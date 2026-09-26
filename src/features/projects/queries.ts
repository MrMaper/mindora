import { prisma as db } from "@/lib/db";
import type { LifeArea } from "@/types/db";
import { LIFE_AREAS } from "@/lib/life";
import { personalAreaProjectId } from "@/lib/area-projects";
import {
  isAreaBucketId,
  projectWhereForScope,
  type ProjectListScope,
} from "@/lib/project-namespace";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import type {
  GetProjectsResult,
  ProjectRow,
  ProjectDetail,
  ProjectMemberRow,
  ProjectTaskRow,
  ProjectActivityRow,
  ProjectsHubData,
  AreaHubSection,
} from "./types";

const PAGE_SIZE = 15;

const projectListSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  area: true,
  teamId: true,
  team: { select: { name: true } },
  _count: { select: { members: true } },
  createdAt: true,
} as const;

function toProjectRow(p: {
  id: string;
  name: string;
  description: string | null;
  status: ProjectRow["status"];
  area: LifeArea;
  teamId: string | null;
  team: { name: string } | null;
  _count: { members: number };
  createdAt: Date;
}): ProjectRow {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    area: p.area,
    teamId: p.teamId,
    teamName: p.team?.name ?? null,
    memberCount: p._count.members,
    createdAt: p.createdAt,
  };
}

/** /projects hub: all areas with buckets + named paths for the user. */
export async function getProjectsHub(
  userId: string,
  search = "",
): Promise<ProjectsHubData> {
  await ensurePersonalWorkspace(userId);

  const projects = await db.project.findMany({
    where: {
      status: { not: "ARCHIVED" },
      members: { some: { userId } },
    },
    select: projectListSelect,
    orderBy: { name: "asc" },
  });

  const rows = projects.map(toProjectRow);
  const q = search.trim().toLowerCase();

  const sections: AreaHubSection[] = LIFE_AREAS.map(area => {
    const list = rows.filter(p => p.area === area);
    const bucketId = personalAreaProjectId(userId, area);
    const bucket =
      list.find(p => p.id === bucketId || isAreaBucketId(p.id) && p.area === area) ??
      ({
        id: bucketId,
        name: area,
        description: null,
        status: "ACTIVE" as const,
        area,
        teamId: null,
        teamName: null,
        memberCount: 1,
        createdAt: new Date(0),
      } satisfies ProjectRow);

    let paths = list
      .filter(p => !isAreaBucketId(p.id))
      .sort((a, b) => a.name.localeCompare(b.name, "fa"));

    if (q) {
      const bucketHit =
        bucket.name.toLowerCase().includes(q) ||
        (bucket.description ?? "").toLowerCase().includes(q);
      if (!bucketHit) {
        paths = paths.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q),
        );
      }
    }

    return { area, bucket, paths };
  }).filter(section => {
    if (!q) return true;
    const bucketHit =
      section.bucket.name.toLowerCase().includes(q) ||
      (section.bucket.description ?? "").toLowerCase().includes(q);
    return bucketHit || section.paths.length > 0;
  });

  return { sections, search };
}

/**
 * @deprecated Prefer getProjectsHub for the projects page.
 * Kept for any callers expecting paginated WORK/LIFE paths.
 */
export async function getProjects(
  search = "",
  page = 1,
  userId?: string,
): Promise<GetProjectsResult> {
  const skip = (page - 1) * PAGE_SIZE;
  const where: Record<string, unknown> = {
    area: { in: ["WORK", "LIFE"] },
    id: {
      notIn: ["area-phd", "area-work", "area-life", "area-lang"],
    },
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" as const };
  }

  if (userId) {
    where.members = { some: { userId } };
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      select: projectListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.project.count({ where }),
  ]);

  return {
    projects: projects.map(toProjectRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/**
 * Projects the current user can pick on a given surface.
 * Default `life` = area buckets + named work/life projects.
 */
export async function getUserProjects(
  userId: string,
  scope: ProjectListScope = "life",
): Promise<ProjectRow[]> {
  const memberships = await db.projectMember.findMany({
    where: {
      userId,
      project: {
        status: { not: "ARCHIVED" },
        ...projectWhereForScope(scope),
      },
    },
    select: {
      project: { select: projectListSelect },
    },
  });

  const rows = memberships.map(m => toProjectRow(m.project));
  const areaOrder: Record<string, number> = {
    PHD: 0,
    WORK: 1,
    LIFE: 2,
    LANG: 3,
  };

  rows.sort((a, b) => {
    const aIsBucket = isAreaBucketId(a.id);
    const bIsBucket = isAreaBucketId(b.id);
    if (aIsBucket && bIsBucket) {
      return (areaOrder[a.area] ?? 9) - (areaOrder[b.area] ?? 9);
    }
    if (aIsBucket) return -1;
    if (bIsBucket) return 1;
    return a.name.localeCompare(b.name, "fa");
  });

  return rows;
}

export async function getProjectById(
  id: string,
  userId?: string,
): Promise<ProjectDetail | null> {
  const project = await db.project.findFirst({
    where: {
      id,
      ...(userId
        ? { members: { some: { userId } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      area: true,
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
    area: project.area,
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

export async function getProjectMemberUserOptions(
  projectId: string,
): Promise<{ value: string; label: string }[]> {
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
      ? {
          id: t.assignedTo.id,
          name: t.assignedTo.name,
          avatar: t.assignedTo.avatar,
        }
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
