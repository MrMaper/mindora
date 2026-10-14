/**
 * Idempotent backfill for UserArea + areaId (docs/AREAS.md §9.5, §18).
 *
 *   npx tsx scripts/areas/backfill-areas.ts
 *
 * Safe to re-run. Batches members. Does not drop legacy enum columns.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const LIFE_AREAS = ["PHD", "WORK", "LIFE", "LANG"] as const;
type LifeArea = (typeof LIFE_AREAS)[number];

const TEMPLATES: {
  legacyEnum: LifeArea;
  templateKey: string;
  name: string;
  hubFor: "RESEARCH" | "LANGUAGE" | null;
  isDefault: boolean;
  sortOrder: number;
}[] = [
  { legacyEnum: "LIFE", templateKey: "life", name: "زندگی", hubFor: null, isDefault: true, sortOrder: 0 },
  { legacyEnum: "WORK", templateKey: "work", name: "کار", hubFor: null, isDefault: false, sortOrder: 1 },
  { legacyEnum: "PHD", templateKey: "research", name: "دکتری", hubFor: "RESEARCH", isDefault: false, sortOrder: 2 },
  { legacyEnum: "LANG", templateKey: "language", name: "زبان", hubFor: "LANGUAGE", isDefault: false, sortOrder: 3 },
];

function personalBucketId(userId: string, area: LifeArea): string {
  return `area-${area.toLowerCase()}-${userId}`;
}

async function ensureBuckets(userId: string) {
  const teamId = `personal-${userId}`;
  for (const area of LIFE_AREAS) {
    const id = personalBucketId(userId, area);
    const tmpl = TEMPLATES.find(t => t.legacyEnum === area)!;
    await db.project.upsert({
      where: { id },
      create: {
        id,
        name: tmpl.name,
        status: "ACTIVE",
        area,
        teamId: (await db.team.findUnique({ where: { id: teamId } })) ? teamId : undefined,
      },
      update: { area },
    });
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId, role: "OWNER" },
      update: {},
    });
  }
}

async function backfillMember(userId: string) {
  await ensureBuckets(userId);
  const prefs = await db.userAreaPreference.findMany({ where: { userId } });
  const prefBy = new Map(prefs.map(p => [p.area, p]));

  const areaIds = new Map<LifeArea, string>();
  for (const tmpl of TEMPLATES) {
    const pref = prefBy.get(tmpl.legacyEnum);
    const bucketId = personalBucketId(userId, tmpl.legacyEnum);
    const row = await db.userArea.upsert({
      where: {
        userId_legacyEnum: { userId, legacyEnum: tmpl.legacyEnum },
      },
      create: {
        userId,
        name: tmpl.name,
        nameIsDefault: true,
        templateKey: tmpl.templateKey,
        color: pref?.color ?? null,
        icon: pref?.icon ?? null,
        sortOrder: pref?.sortOrder ?? tmpl.sortOrder,
        archived: pref?.archived ?? false,
        isDefault: tmpl.isDefault,
        hubFor: tmpl.hubFor,
        bucketProjectId: bucketId,
        legacyEnum: tmpl.legacyEnum,
      },
      update: {
        bucketProjectId: bucketId,
        hubFor: tmpl.hubFor,
        isDefault: tmpl.isDefault,
        archived: tmpl.isDefault ? false : (pref?.archived ?? false),
      },
      select: { id: true },
    });
    areaIds.set(tmpl.legacyEnum, row.id);
    await db.project.update({
      where: { id: bucketId },
      data: { area: tmpl.legacyEnum, areaId: row.id },
    });
  }

  // Dual-write areaId on existing rows that still only have the enum.
  for (const [legacy, areaId] of areaIds) {
    await db.task.updateMany({
      where: {
        OR: [{ createdById: userId }, { assignedToId: userId }],
        area: legacy,
        areaId: null,
      },
      data: { areaId },
    });
    await db.doc.updateMany({
      where: { userId, area: legacy, areaId: null },
      data: { areaId },
    });
    await db.habit.updateMany({
      where: { userId, area: legacy, areaId: null },
      data: { areaId },
    });
    await db.docFolder.updateMany({
      where: { userId, area: legacy, areaId: null },
      data: { areaId },
    });
    // Named paths (non-bucket projects the member owns) that still use the enum.
    const owned = await db.projectMember.findMany({
      where: { userId, role: "OWNER" },
      select: { projectId: true },
    });
    const ownedIds = owned.map(o => o.projectId);
    if (ownedIds.length) {
      await db.project.updateMany({
        where: {
          id: { in: ownedIds },
          area: legacy,
          areaId: null,
        },
        data: { areaId },
      });
    }
  }
}

async function main() {
  const members = await db.user.findMany({
    where: { role: "MEMBER" },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`[backfill-areas] members=${members.length}`);
  let i = 0;
  for (const m of members) {
    i += 1;
    await backfillMember(m.id);
    if (i % 10 === 0 || i === members.length) {
      console.log(`[backfill-areas] ${i}/${members.length}`);
    }
  }
  console.log("[backfill-areas] done");
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
