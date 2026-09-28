/**
 * Remove leftover sample / legacy rows from early Mindora production.
 * Keeps real member accounts and per-member area buckets.
 *
 *   npx tsx scripts/clean-sample-content.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const SAMPLE_TASK_TITLES = [
  "رزرو وقت دندانپزشکی",
  "نوشتن پیش‌نویس بخش مقدمه",
  "پیگیری تسک شغلی باز",
  "مرور مقاله مرتبط با موضوع رساله",
  "ایده: مقایسه روش‌های ارزیابی کیفیت داده",
];

const SAMPLE_DOC_TITLES = [
  "پیش‌نویس مقدمه رساله",
  "یادداشت جلسه کاری",
  "چک‌لیست خانه",
  "صورت‌جلسه",
  "تست",
  "پیش‌نویس فصل",
];

const LEGACY_PROJECT_IDS = [
  "default-project",
  "area-phd",
  "area-work",
  "area-life",
  "area-lang",
];

async function main() {
  const fakeUsers = await db.user.deleteMany({
    where: {
      OR: [
        { email: "superadmin@mindora.app" },
        { email: "superadmin@scrumflow.app" },
        { email: { endsWith: "@scrumflow.app" }, role: "MEMBER" },
      ],
    },
  });

  const tasks = await db.task.deleteMany({
    where: { title: { in: SAMPLE_TASK_TITLES } },
  });

  const docs = await db.doc.deleteMany({
    where: { title: { in: SAMPLE_DOC_TITLES } },
  });

  // Drop legacy shared buckets / default project after moving dependents off
  await db.task.updateMany({
    where: { projectId: { in: LEGACY_PROJECT_IDS } },
    data: { projectId: null },
  });
  await db.doc.updateMany({
    where: { projectId: { in: LEGACY_PROJECT_IDS } },
    data: { projectId: null },
  });
  const projects = await db.project.deleteMany({
    where: { id: { in: LEGACY_PROJECT_IDS } },
  });

  console.log("Sample cleanup done:");
  console.log(`  fake users: ${fakeUsers.count}`);
  console.log(`  sample tasks: ${tasks.count}`);
  console.log(`  sample docs: ${docs.count}`);
  console.log(`  legacy projects: ${projects.count}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
