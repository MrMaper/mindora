import { prisma as db } from "@/lib/db";
import { AREA_META, AREA_PROJECT_IDS, LIFE_AREAS } from "@/lib/life";
import type { LifeArea } from "@/types/db";

export async function ensurePersonalWorkspace(userId: string) {
  const existing = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: "personal-life", userId } },
    select: { teamId: true },
  });
  if (existing) return { teamId: existing.teamId };

  const org =
    (await db.organization.findFirst()) ??
    (await db.organization.create({
      data: { id: "default-org", name: "زندگی من", ownerId: userId },
    }));

  const role = await db.role.upsert({
    where: { name: "MEMBER" },
    create: { name: "MEMBER" },
    update: {},
  });

  const team = await db.team.upsert({
    where: { id: "personal-life" },
    create: {
      id: "personal-life",
      name: "زندگی من",
      description: "فضای شخصی",
      organizationId: org.id,
    },
    update: {},
  });

  await db.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId } },
    create: { teamId: team.id, userId, roleId: role.id },
    update: {},
  });

  for (const area of LIFE_AREAS) {
    const id = AREA_PROJECT_IDS[area];
    const meta = AREA_META[area];
    await db.project.upsert({
      where: { id },
      create: {
        id,
        name: meta.nameFa,
        description: meta.descriptionFa,
        status: "ACTIVE",
        area,
        teamId: team.id,
        members: { create: { userId, role: "OWNER" } },
      },
      // Do not overwrite name/description — users edit those on /projects
      update: { area, teamId: team.id },
    });

    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId, role: "OWNER" },
      update: {},
    });
  }

  return { teamId: team.id };
}

export function projectIdForArea(area: LifeArea): string {
  return AREA_PROJECT_IDS[area];
}
