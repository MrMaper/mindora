import { prisma as db } from "@/lib/db";
import type { LifeArea } from "@/types/db";
import { AREA_META, LIFE_AREAS } from "./legacy";
import { personalAreaProjectId, areaProjectIdsForUser } from "./buckets";
import { clearAreaIdCache } from "./dual-write";
import { LEGACY_AREA_TEMPLATES, hubForToDb } from "./templates";

/**
 * Ensure the member has a private workspace: one personal team + four area
 * bucket projects + four UserArea rows (P4). Callers use `ensureDefaultArea`.
 */
export async function ensurePersonalWorkspace(userId: string) {
  const teamId = `personal-${userId}`;
  const areaIds = areaProjectIdsForUser(userId);

  const existing = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { teamId: true },
  });

  if (existing) {
    await ensureAreaBuckets(userId, teamId, areaIds);
    await ensureUserAreas(userId, areaIds);
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
  await ensureUserAreas(userId, areaIds);
  return { teamId, areaIds };
}

/** Seam name from docs/AREAS.md §13. */
export const ensureDefaultArea = ensurePersonalWorkspace;

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

/**
 * Create the four UserArea rows for a member and link each to its bucket.
 * Idempotent. Copies color/icon/order/archived from UserAreaPreference when present.
 */
export async function ensureUserAreas(
  userId: string,
  areaIds: Record<LifeArea, string> = areaProjectIdsForUser(userId),
) {
  const prefs = await db.userAreaPreference.findMany({
    where: { userId },
    select: {
      area: true,
      color: true,
      icon: true,
      sortOrder: true,
      archived: true,
    },
  });
  const prefBy = new Map(prefs.map(p => [p.area, p]));

  for (const tmpl of LEGACY_AREA_TEMPLATES) {
    const pref = prefBy.get(tmpl.legacyEnum);
    const bucketId = areaIds[tmpl.legacyEnum];
    const hubFor = hubForToDb(tmpl.hubFor);
    const row = await db.userArea.upsert({
      where: {
        userId_legacyEnum: { userId, legacyEnum: tmpl.legacyEnum },
      },
      create: {
        userId,
        name: tmpl.nameFa,
        nameIsDefault: true,
        templateKey: tmpl.templateKey,
        color: pref?.color ?? null,
        icon: pref?.icon ?? null,
        sortOrder: pref?.sortOrder ?? tmpl.sortOrder,
        archived: pref?.archived ?? false,
        isDefault: tmpl.isDefault,
        hubFor,
        bucketProjectId: bucketId,
        legacyEnum: tmpl.legacyEnum,
      },
      update: {
        // Keep bucket link and hub/default flags stable; prefs may refresh visuals.
        bucketProjectId: bucketId,
        hubFor,
        isDefault: tmpl.isDefault,
        ...(pref
          ? {
              color: pref.color,
              icon: pref.icon,
              sortOrder: pref.sortOrder,
              archived: tmpl.isDefault ? false : pref.archived,
            }
          : {}),
      },
      select: { id: true },
    });

    await db.project.update({
      where: { id: bucketId },
      data: { area: tmpl.legacyEnum, areaId: row.id },
    });
  }

  clearAreaIdCache(userId);
}

export function projectIdForArea(userId: string, area: LifeArea): string {
  return personalAreaProjectId(userId, area);
}

/**
 * P6: ensure the member has a dedicated hub area for Research or Language.
 * Idempotent. Creates from the legacy template when missing (docs/AREAS.md §10.1).
 */
export async function ensureHubAreaForModule(
  userId: string,
  kind: "research" | "language",
): Promise<{ id: string; bucketProjectId: string }> {
  await ensurePersonalWorkspace(userId);
  const dbHub = hubForToDb(kind);
  const existing = await db.userArea.findFirst({
    where: { userId, hubFor: dbHub, archived: false },
    select: { id: true, bucketProjectId: true },
  });
  if (existing?.bucketProjectId) {
    return { id: existing.id, bucketProjectId: existing.bucketProjectId };
  }

  const tmpl = LEGACY_AREA_TEMPLATES.find(t => t.hubFor === kind);
  if (!tmpl) throw new Error(`missing template for ${kind}`);

  // Prefer the seeded legacy row (may have hubFor cleared somehow).
  const legacy = await db.userArea.findFirst({
    where: { userId, legacyEnum: tmpl.legacyEnum },
    select: { id: true, bucketProjectId: true },
  });
  if (legacy) {
    const bucketId =
      legacy.bucketProjectId ?? personalAreaProjectId(userId, tmpl.legacyEnum);
    await db.userArea.update({
      where: { id: legacy.id },
      data: {
        hubFor: dbHub,
        archived: false,
        isDefault: false,
        bucketProjectId: bucketId,
      },
    });
    await db.project.update({
      where: { id: bucketId },
      data: { area: tmpl.legacyEnum, areaId: legacy.id },
    });
    clearAreaIdCache(userId);
    return { id: legacy.id, bucketProjectId: bucketId };
  }

  // Fresh dedicated area (no legacy enum).
  const maxSort = await db.userArea.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  const area = await db.userArea.create({
    data: {
      userId,
      name: tmpl.nameFa,
      nameIsDefault: true,
      templateKey: tmpl.templateKey,
      sortOrder,
      archived: false,
      isDefault: false,
      hubFor: dbHub,
      legacyEnum: null,
    },
    select: { id: true },
  });
  const bucketId = `area-inbox-${area.id}`;
  const teamId = `personal-${userId}`;
  await db.project.create({
    data: {
      id: bucketId,
      name: tmpl.nameFa,
      description: null,
      status: "ACTIVE",
      area: tmpl.legacyEnum,
      areaId: area.id,
      teamId,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  await db.userArea.update({
    where: { id: area.id },
    data: { bucketProjectId: bucketId },
  });
  clearAreaIdCache(userId);
  return { id: area.id, bucketProjectId: bucketId };
}
