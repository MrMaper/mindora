import { prisma as db } from "@/lib/db";
import { AREA_META, LIFE_AREAS } from "@/lib/life";
import {
  personalAreaProjectId,
  areaProjectIdsForUser,
} from "@/lib/area-projects";
import type { LifeArea } from "@/types/db";

/**
 * Ensure the member has a private workspace: one personal team + four area
 * bucket projects that only this user owns. No shared area-* buckets.
 */
export async function ensurePersonalWorkspace(userId: string) {
  const teamId = `personal-${userId}`;
  const areaIds = areaProjectIdsForUser(userId);

  const existing = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { teamId: true },
  });

  if (existing) {
    // Cheap existence check — skip 8 upserts on every navigation once buckets exist.
    await ensureAreaBuckets(userId, teamId, areaIds);
    return { teamId, areaIds };
  }

  const org =
    (await db.organization.findFirst()) ??
    (await db.organization.create({
      data: { id: "default-org", name: "Mindora", ownerId: userId },
    }));

  const role = await db.role.upsert({
    where: { name: "MEMBER" },
    create: { name: "MEMBER" },
    update: {},
  });

  await db.team.upsert({
    where: { id: teamId },
    create: {
      id: teamId,
      name: "فضای شخصی",
      description: "Workspace خصوصی کاربر",
      organizationId: org.id,
    },
    update: {},
  });

  await db.teamMember.upsert({
    where: { teamId_userId: { teamId, userId } },
    create: { teamId, userId, roleId: role.id },
    update: {},
  });

  await ensureAreaBuckets(userId, teamId, areaIds, true);
  return { teamId, areaIds };
}

async function ensureAreaBuckets(
  userId: string,
  teamId: string,
  areaIds: Record<LifeArea, string>,
  force = false,
) {
  const ids = LIFE_AREAS.map(area => areaIds[area]);
  if (!force) {
    const existing = await db.project.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (existing.length === ids.length) {
      const members = await db.projectMember.count({
        where: { userId, projectId: { in: ids } },
      });
      if (members === ids.length) return;
    }
  }

  for (const area of LIFE_AREAS) {
    const id = areaIds[area];
    const meta = AREA_META[area];
    await db.project.upsert({
      where: { id },
      create: {
        id,
        name: meta.nameFa,
        description: meta.descriptionFa,
        status: "ACTIVE",
        area,
        teamId,
        members: { create: { userId, role: "OWNER" } },
      },
      update: { area, teamId },
    });
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId, role: "OWNER" },
      update: {},
    });
  }
}

export function projectIdForArea(userId: string, area: LifeArea): string {
  return personalAreaProjectId(userId, area);
}
