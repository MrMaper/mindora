import { prisma as db } from "@/lib/db";
import { personalAreaProjectId, type SeedAreaKey } from "./buckets";
import {
  AREA_TEMPLATE_META,
  SEED_AREA_TEMPLATES,
  hubForToDb,
} from "./templates";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

/**
 * Ensure the member has a private workspace: one personal team and, on first
 * provisioning only, the four seeded areas with their bucket projects.
 * Callers use `ensureDefaultArea`.
 */
export async function ensurePersonalWorkspace(userId: string) {
  const teamId = `personal-${userId}`;

  const existing = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { teamId: true },
  });

  if (!existing) {
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
  }

  // Seed only a member with no areas: later deletes/merges must stick.
  const areaCount = await db.userArea.count({ where: { userId } });
  if (areaCount === 0) {
    try {
      await seedUserAreas(userId, teamId);
    } catch (err) {
      // A concurrent request seeded first (partial unique index / fixed bucket ids).
      if (!isUniqueViolation(err)) throw err;
    }
  }

  return { teamId };
}

/** Seam name from docs/AREAS.md §13. */
export const ensureDefaultArea = ensurePersonalWorkspace;

/** Create one area plus its bucket project, atomically. */
async function createAreaWithBucket(args: {
  userId: string;
  teamId: string;
  bucketId: string;
  area: {
    name: string;
    templateKey: string;
    sortOrder: number;
    isDefault: boolean;
    hubFor: "RESEARCH" | "LANGUAGE" | null;
  };
  description?: string | null;
}): Promise<{ id: string; bucketProjectId: string }> {
  const { userId, teamId, bucketId, area, description } = args;
  const created = await db.$transaction(async tx => {
    const row = await tx.userArea.create({
      data: {
        userId,
        name: area.name,
        nameIsDefault: true,
        templateKey: area.templateKey,
        sortOrder: area.sortOrder,
        archived: false,
        isDefault: area.isDefault,
        hubFor: area.hubFor,
      },
      select: { id: true },
    });
    await tx.project.create({
      data: {
        id: bucketId,
        name: area.name,
        description: description ?? null,
        status: "ACTIVE",
        areaId: row.id,
        teamId,
        members: { create: { userId, role: "OWNER" } },
      },
    });
    await tx.userArea.update({
      where: { id: row.id },
      data: { bucketProjectId: bucketId },
    });
    return row;
  });
  return { id: created.id, bucketProjectId: bucketId };
}

async function seedUserAreas(userId: string, teamId: string) {
  for (const tmpl of SEED_AREA_TEMPLATES) {
    const meta = AREA_TEMPLATE_META[tmpl.templateKey];
    await createAreaWithBucket({
      userId,
      teamId,
      bucketId: personalAreaProjectId(userId, tmpl.templateKey as SeedAreaKey),
      area: {
        name: tmpl.nameFa,
        templateKey: tmpl.templateKey,
        sortOrder: tmpl.sortOrder,
        isDefault: tmpl.isDefault,
        hubFor: hubForToDb(tmpl.hubFor),
      },
      description: meta?.descriptionFa ?? null,
    });
  }
}

/**
 * Inbox bucket project id for one of the member's areas (by `UserArea.id`).
 * Falls back to the default area's bucket when the id is unknown.
 */
export async function bucketProjectIdForArea(
  userId: string,
  areaId: string | null | undefined,
): Promise<string> {
  const own = areaId
    ? await db.userArea.findFirst({
        where: { id: areaId, userId },
        select: { bucketProjectId: true },
      })
    : null;
  if (own?.bucketProjectId) return own.bucketProjectId;
  const fallback = await db.userArea.findFirst({
    where: { userId, isDefault: true, archived: false },
    select: { bucketProjectId: true },
  });
  if (!fallback?.bucketProjectId) {
    throw new Error(`member ${userId} has no default area bucket`);
  }
  return fallback.bucketProjectId;
}

/**
 * P6: ensure the member has a dedicated hub area for Research or Language.
 * Idempotent. Creates from the template when missing (docs/AREAS.md §10.1).
 */
export async function ensureHubAreaForModule(
  userId: string,
  kind: "research" | "language",
): Promise<{ id: string; bucketProjectId: string }> {
  const { teamId } = await ensurePersonalWorkspace(userId);
  const dbHub = hubForToDb(kind)!;
  const existing = await db.userArea.findFirst({
    where: { userId, hubFor: dbHub, archived: false },
    select: { id: true, bucketProjectId: true },
  });
  if (existing?.bucketProjectId) {
    return { id: existing.id, bucketProjectId: existing.bucketProjectId };
  }

  const tmpl = SEED_AREA_TEMPLATES.find(t => t.hubFor === kind);
  if (!tmpl) throw new Error(`missing template for ${kind}`);

  // Prefer an existing row for this hub (archived) or the seeded template row.
  const reusable =
    existing ??
    (await db.userArea.findFirst({
      where: { userId, hubFor: dbHub },
      select: { id: true, bucketProjectId: true },
    })) ??
    (await db.userArea.findFirst({
      where: {
        userId,
        templateKey: tmpl.templateKey,
        hubFor: null,
        isDefault: false,
      },
      select: { id: true, bucketProjectId: true },
    }));

  if (reusable) {
    let bucketId = reusable.bucketProjectId;
    if (!bucketId) {
      bucketId = `area-inbox-${reusable.id}`;
      await db.project.create({
        data: {
          id: bucketId,
          name: tmpl.nameFa,
          status: "ACTIVE",
          areaId: reusable.id,
          teamId,
          members: { create: { userId, role: "OWNER" } },
        },
      });
    }
    await db.userArea.update({
      where: { id: reusable.id },
      data: {
        hubFor: dbHub,
        archived: false,
        isDefault: false,
        bucketProjectId: bucketId,
      },
    });
      return { id: reusable.id, bucketProjectId: bucketId };
  }

  // Fresh dedicated area.
  const maxSort = await db.userArea.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  // Bucket id embeds the new area id, so create the area first.
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
    },
    select: { id: true },
  });
  const bucketId = `area-inbox-${area.id}`;
  await db.project.create({
    data: {
      id: bucketId,
      name: tmpl.nameFa,
      description: null,
      status: "ACTIVE",
      areaId: area.id,
      teamId,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  await db.userArea.update({
    where: { id: area.id },
    data: { bucketProjectId: bucketId },
  });
  return { id: area.id, bucketProjectId: bucketId };
}
