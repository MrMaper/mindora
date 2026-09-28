/**
 * Remove namespace demo / mock rows (titles and names starting with [DEMO]).
 *
 * Run locally:
 *   npx tsx scripts/clean-demo-data.ts
 *
 * On production (inside the app container, after migrate):
 *   npx tsx scripts/clean-demo-data.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEMO_PREFIX = "[DEMO]";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const demoProjects = await db.project.findMany({
    where: { name: { startsWith: DEMO_PREFIX } },
    select: { id: true, name: true },
  });
  const projectIds = demoProjects.map(p => p.id);

  const tasks = await db.task.deleteMany({
    where: {
      OR: [
        ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
        { title: { startsWith: DEMO_PREFIX } },
        { description: { startsWith: "داده ماک namespace" } },
      ],
    },
  });

  const docs = await db.doc.deleteMany({
    where: {
      OR: [
        ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
        { title: { startsWith: DEMO_PREFIX } },
      ],
    },
  });

  const sessions = projectIds.length
    ? await db.langSession.deleteMany({ where: { projectId: { in: projectIds } } })
    : { count: 0 };

  const cards = await db.langCard.deleteMany({
    where: {
      OR: [
        ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
        { front: { startsWith: DEMO_PREFIX } },
        { back: { startsWith: DEMO_PREFIX } },
      ],
    },
  });

  const mocks = await db.mockAttempt.deleteMany({
    where: {
      OR: [
        ...(projectIds.length ? [{ projectId: { in: projectIds } }] : []),
        { note: { startsWith: DEMO_PREFIX } },
      ],
    },
  });

  const tracks = await db.examTrack.deleteMany({
    where: { name: { startsWith: DEMO_PREFIX } },
  });

  const habits = await db.habit.deleteMany({
    where: { title: { startsWith: DEMO_PREFIX } },
  });

  const projects = projectIds.length
    ? await db.project.deleteMany({ where: { id: { in: projectIds } } })
    : { count: 0 };

  // Fixed demo ids from the seed script, in case names were edited
  const fixedIds = [
    "demo-ws-home",
    "demo-ws-job",
    "demo-path-phd-thesis",
    "demo-path-phd-paper",
    "demo-path-lang-msrt",
  ];
  const leftover = await db.project.deleteMany({
    where: { id: { in: fixedIds } },
  });

  console.log("Demo cleanup done:");
  console.log(`  tasks: ${tasks.count}`);
  console.log(`  docs: ${docs.count}`);
  console.log(`  lang sessions: ${sessions.count}`);
  console.log(`  lang cards: ${cards.count}`);
  console.log(`  mock attempts: ${mocks.count}`);
  console.log(`  exam tracks: ${tracks.count}`);
  console.log(`  habits: ${habits.count}`);
  console.log(`  projects: ${projects.count + leftover.count}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
