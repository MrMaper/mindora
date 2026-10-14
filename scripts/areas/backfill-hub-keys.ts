/**
 * P6: migrate Doc.systemKey `phd-library:*` → `library:*`
 * and ensure hub areas exist for members with Research/Language effectively on.
 *
 *   npx tsx scripts/areas/backfill-hub-keys.ts
 *
 * Idempotent. Safe to re-run.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function migrateLibraryKeys() {
  const rows = await db.doc.findMany({
    where: { systemKey: { startsWith: "phd-library:" } },
    select: { id: true, systemKey: true },
  });
  let n = 0;
  for (const row of rows) {
    if (!row.systemKey?.startsWith("phd-library:")) continue;
    const next = `library:${row.systemKey.slice("phd-library:".length)}`;
    await db.doc.update({
      where: { id: row.id },
      data: { systemKey: next },
    });
    n += 1;
  }
  return n;
}

async function ensureHubsForEffectiveModules() {
  // Lightweight: rely on ensureHubAreaForModule via app import path.
  const { ensureHubAreaForModule, getEffectiveFlagsForUser } = await import(
    "../../src/lib/areas/server"
  );
  const members = await db.user.findMany({
    where: { role: "MEMBER", status: "ACTIVE" },
    select: { id: true },
  });
  let research = 0;
  let language = 0;
  for (const m of members) {
    const flags = await getEffectiveFlagsForUser(m.id);
    if (flags?.research) {
      await ensureHubAreaForModule(m.id, "research");
      research += 1;
    }
    if (flags?.language) {
      await ensureHubAreaForModule(m.id, "language");
      language += 1;
    }
  }
  return { members: members.length, research, language };
}

async function main() {
  const keys = await migrateLibraryKeys();
  const hubs = await ensureHubsForEffectiveModules();
  console.log(
    `[backfill-hub-keys] libraryKeys=${keys} members=${hubs.members} researchHubs=${hubs.research} languageHubs=${hubs.language}`,
  );
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
