import { prisma as db } from "@/lib/db";
import type { LifeArea } from "@/types/db";
import { LIFE_AREAS, startOfDay, startOfWeek, endOfWeek } from "@/lib/life";
import { personalAreaProjectId } from "@/lib/area-projects";
import {
  isAreaBucketId,
  projectWhereForScope,
  type ProjectListScope,
} from "@/lib/project-namespace";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { defaultAreaPref } from "@/lib/area-visual";
import type {
  GetProjectsResult,
  ProjectRow,
  ProjectDetail,
  ProjectMemberRow,
  ProjectTaskRow,
  ProjectActivityRow,
  ProjectsHubData,
  AreaHubSection,
  AreaPrefRow,
  AreaDashboardData,
} from "./types";

const PAGE_SIZE = 15;

const projectListSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  area: true,
  pinned: true,
  sortOrder: true,
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
  pinned?: boolean;
  sortOrder?: number;
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
    pinned: p.pinned ?? false,
    sortOrder: p.sortOrder ?? 0,
  };
}

function sortPaths(a: ProjectRow, b: ProjectRow): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, "fa");
}

function isActivePathStatus(status: ProjectRow["status"]): boolean {
  return status === "ACTIVE" || status === "PLANNED";
}

async function loadAreaPrefs(userId: string): Promise<Map<LifeArea, AreaPrefRow>> {
  const rows = await db.userAreaPreference.findMany({
    where: { userId },
  });
  const map = new Map<LifeArea, AreaPrefRow>();
  for (const area of LIFE_AREAS) {
    map.set(area, defaultAreaPref(area, LIFE_AREAS.indexOf(area)));
  }
  for (const row of rows) {
    map.set(row.area, {
      area: row.area,
      color: row.color,
      icon: row.icon,
      sortOrder: row.sortOrder,
      archived: row.archived,
    });
  }
  return map;
}

async function attachTaskStats(rows: ProjectRow[]): Promise<ProjectRow[]> {
  const projectIds = rows.map(p => p.id);
  if (projectIds.length === 0) return rows;

  type PathStats = {
    open: number;
    done: number;
    total: number;
    nextTitle: string | null;
  };
  const statsByProject = new Map<string, PathStats>();

  const grouped = await db.task.groupBy({
    by: ["projectId", "status"],
    where: { projectId: { in: projectIds } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    if (!row.projectId) continue;
    const cur = statsByProject.get(row.projectId) ?? {
      open: 0,
      done: 0,
      total: 0,
      nextTitle: null,
    };
    const n = row._count._all;
    cur.total += n;
    if (row.status === "DONE") cur.done += n;
    else cur.open += n;
    statsByProject.set(row.projectId, cur);
  }

  const openTasks = await db.task.findMany({
    where: {
      projectId: { in: projectIds },
      status: { not: "DONE" },
    },
    select: {
      projectId: true,
      title: true,
      priority: true,
      updatedAt: true,
      status: true,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 400,
  });

  const priorityRank: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    NONE: 4,
  };
  const statusRank: Record<string, number> = {
    IN_PROGRESS: 0,
    TODO: 1,
    BACKLOG: 2,
  };

  const bestByProject = new Map<
    string,
    { title: string; score: number; updatedAt: number }
  >();
  for (const task of openTasks) {
    if (!task.projectId) continue;
    const score =
      (statusRank[task.status] ?? 9) * 10 + (priorityRank[task.priority] ?? 9);
    const prev = bestByProject.get(task.projectId);
    if (
      !prev ||
      score < prev.score ||
      (score === prev.score && task.updatedAt.getTime() > prev.updatedAt)
    ) {
      bestByProject.set(task.projectId, {
        title: task.title,
        score,
        updatedAt: task.updatedAt.getTime(),
      });
    }
  }
  for (const [id, best] of bestByProject) {
    const cur = statsByProject.get(id) ?? {
      open: 0,
      done: 0,
      total: 0,
      nextTitle: null,
    };
    cur.nextTitle = best.title;
    statsByProject.set(id, cur);
  }

  return rows.map(p => {
    const s = statsByProject.get(p.id);
    return {
      ...p,
      openTaskCount: s?.open ?? 0,
      doneTaskCount: s?.done ?? 0,
      totalTaskCount: s?.total ?? 0,
      nextActionTitle: s?.nextTitle ?? null,
    };
  });
}

/** /projects hub: all areas with buckets + named paths for the user. */
export async function getProjectsHub(
  userId: string,
  search = "",
  opts?: { includeArchivedAreas?: boolean },
): Promise<ProjectsHubData> {
  await ensurePersonalWorkspace(userId);

  const [projects, prefMap] = await Promise.all([
    db.project.findMany({
      where: {
        status: { not: "ARCHIVED" },
        members: { some: { userId } },
      },
      select: projectListSelect,
      orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    loadAreaPrefs(userId),
  ]);

  const rows = await attachTaskStats(projects.map(toProjectRow));
  const q = search.trim().toLowerCase();

  const sectionsRaw: AreaHubSection[] = LIFE_AREAS.map(area => {
    const pref = prefMap.get(area) ?? defaultAreaPref(area, LIFE_AREAS.indexOf(area));
    const list = rows.filter(p => p.area === area);
    const bucketId = personalAreaProjectId(userId, area);
    const bucket =
      list.find(
        p =>
          p.id === bucketId || (isAreaBucketId(p.id) && p.area === area),
      ) ??
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
        pinned: false,
        sortOrder: 0,
        openTaskCount: 0,
        doneTaskCount: 0,
        totalTaskCount: 0,
        nextActionTitle: null,
      } satisfies ProjectRow);

    let paths = list.filter(p => !isAreaBucketId(p.id)).sort(sortPaths);

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

    const openTaskCount =
      (bucket.openTaskCount ?? 0) +
      paths.reduce((n, p) => n + (p.openTaskCount ?? 0), 0);
    const activePathCount = paths.filter(p => isActivePathStatus(p.status)).length;

    return { area, bucket, paths, openTaskCount, activePathCount, pref };
  });

  let sections = sectionsRaw
    .filter(section => {
      if (!q) return true;
      const bucketHit =
        section.bucket.name.toLowerCase().includes(q) ||
        (section.bucket.description ?? "").toLowerCase().includes(q);
      return bucketHit || section.paths.length > 0;
    })
    .sort((a, b) => {
      if (a.pref.archived !== b.pref.archived) {
        return a.pref.archived ? 1 : -1;
      }
      return a.pref.sortOrder - b.pref.sortOrder;
    });

  // opts retained for callers that want to force-include (dashboard already does)
  void opts;

  const pinnedPaths = rows
    .filter(p => p.pinned && !isAreaBucketId(p.id))
    .sort(sortPaths);

  return { sections, search, pinnedPaths };
}

/** Area context dashboard: `/projects/areas/[area]`. */
export async function getAreaDashboard(
  userId: string,
  area: LifeArea,
): Promise<AreaDashboardData | null> {
  if (!LIFE_AREAS.includes(area)) return null;
  await ensurePersonalWorkspace(userId);

  const hub = await getProjectsHub(userId, "", { includeArchivedAreas: true });
  const section = hub.sections.find(s => s.area === area);
  if (!section) return null;

  const pathIds = [
    section.bucket.id,
    ...section.paths.map(p => p.id),
  ];

  const weekStart = startOfWeek(startOfDay());
  const weekEnd = endOfWeek(startOfDay());

  const weekOpenTasks = await db.task.findMany({
    where: {
      projectId: { in: pathIds },
      status: { not: "DONE" },
      OR: [
        { dueDate: { gte: weekStart, lte: weekEnd } },
        {
          AND: [
            { updatedAt: { gte: weekStart } },
            { status: { in: ["TODO", "IN_PROGRESS"] } },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      projectId: true,
      project: { select: { name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 12,
  });

  const nextActions = section.paths
    .filter(p => p.nextActionTitle && isActivePathStatus(p.status))
    .slice(0, 8)
    .map(p => ({
      pathId: p.id,
      pathName: p.name,
      title: p.nextActionTitle!,
    }));

  const doneTaskCount = section.paths.reduce(
    (n, p) => n + (p.doneTaskCount ?? 0),
    0,
  ) + (section.bucket.doneTaskCount ?? 0);

  return {
    area,
    bucket: section.bucket,
    pref: section.pref,
    paths: section.paths,
    openTaskCount: section.openTaskCount,
    doneTaskCount,
    activePathCount: section.activePathCount,
    weekOpenTasks: weekOpenTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      projectId: t.projectId,
      projectName: t.project?.name ?? null,
    })),
    nextActions,
    stats: {
      pathsTotal: section.paths.length,
      pathsCompleted: section.paths.filter(p => p.status === "COMPLETED").length,
      pathsOnHold: section.paths.filter(p => p.status === "ON_HOLD").length,
      tasksOpen: section.openTaskCount,
      tasksDone: doneTaskCount,
    },
  };
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
      pinned: true,
      sortOrder: true,
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
    pinned: project.pinned,
    sortOrder: project.sortOrder,
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

/** Person-centric OS: members never invite other users onto projects. */
export async function getAllUsersForInvite(_projectId: string) {
  return [] as {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  }[];
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
