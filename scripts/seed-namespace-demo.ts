/**
 * Demo data for Project namespaces (Bucket / Path / Workspace).
 *
 * Run:
 *   npx tsx scripts/seed-namespace-demo.ts
 *
 * Then log in as the seed admin and check:
 *   /projects  → only Workspace
 *   /kanban    → only life/work tasks
 *   /calendar  → only life/work (default chips)
 *   /research  → research paths + PHD tasks
 *   /language  → language paths
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AREA_META, AREA_PROJECT_IDS, LIFE_AREAS } from "../src/lib/life";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DEMO_PREFIX = "[DEMO]";

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function ensureWorkspace(userId: string) {
  const org =
    (await db.organization.findFirst()) ??
    (await db.organization.create({
      data: {
        id: "default-org",
        name: "زندگی من",
        ownerId: userId,
      },
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
      update: { area, name: meta.nameFa },
    });
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      create: { projectId: id, userId, role: "OWNER" },
      update: {},
    });
  }

  return team.id;
}

async function upsertDemoProject(input: {
  id: string;
  name: string;
  description: string;
  area: "PHD" | "WORK" | "LIFE" | "LANG";
  userId: string;
  teamId?: string | null;
}) {
  const project = await db.project.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      name: input.name,
      description: input.description,
      status: "ACTIVE",
      area: input.area,
      teamId: input.teamId ?? null,
      members: { create: { userId: input.userId, role: "OWNER" } },
    },
    update: {
      name: input.name,
      description: input.description,
      area: input.area,
      status: "ACTIVE",
    },
  });
  await db.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: input.userId },
    },
    create: { projectId: project.id, userId: input.userId, role: "OWNER" },
    update: {},
  });
  return project;
}

async function clearPreviousDemo(userId: string) {
  const demoProjects = await db.project.findMany({
    where: { name: { startsWith: DEMO_PREFIX } },
    select: { id: true },
  });
  const ids = demoProjects.map(p => p.id);
  if (ids.length === 0) return;

  await db.task.deleteMany({
    where: {
      OR: [
        { projectId: { in: ids } },
        { title: { startsWith: DEMO_PREFIX } },
      ],
      createdById: userId,
    },
  });
  await db.doc.deleteMany({
    where: {
      userId,
      OR: [{ projectId: { in: ids } }, { title: { startsWith: DEMO_PREFIX } }],
    },
  });
  await db.langSession.deleteMany({
    where: { userId, projectId: { in: ids } },
  });
  await db.langCard.deleteMany({
    where: { userId, projectId: { in: ids } },
  });
  await db.mockAttempt.deleteMany({
    where: { userId, projectId: { in: ids } },
  });
  await db.examTrack.deleteMany({
    where: { userId, name: { startsWith: DEMO_PREFIX } },
  });
  await db.project.deleteMany({ where: { id: { in: ids } } });
}

async function createTask(input: {
  id: string;
  title: string;
  projectId: string;
  area: "PHD" | "WORK" | "LIFE" | "LANG";
  userId: string;
  status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
  dueInDays?: number | null;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}) {
  return db.task.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      title: input.title,
      description: `داده ماک namespace — ${input.area}`,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      type: "TASK",
      area: input.area,
      projectId: input.projectId,
      dueDate:
        input.dueInDays === null || input.dueInDays === undefined
          ? null
          : daysFromNow(input.dueInDays),
      createdById: input.userId,
      assignedToId: input.userId,
      position: 0,
    },
    update: {
      title: input.title,
      area: input.area,
      projectId: input.projectId,
      status: input.status ?? "TODO",
      dueDate:
        input.dueInDays === null || input.dueInDays === undefined
          ? null
          : daysFromNow(input.dueInDays),
    },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@mindora.app";
  const user = await db.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    throw new Error(
      `User ${adminEmail} not found. Run \`npm run db:seed\` first.`,
    );
  }

  console.log(`Seeding namespace demo for ${user.email}…`);
  const teamId = await ensureWorkspace(user.id);
  await clearPreviousDemo(user.id);

  // Hide legacy seed project from workspace pickers
  await db.project.updateMany({
    where: { id: "default-project" },
    data: { status: "ARCHIVED", area: "LIFE" },
  });

  // ── Workspace (should appear in /projects, /kanban, /calendar) ──
  const wsHome = await upsertDemoProject({
    id: "demo-ws-home",
    name: `${DEMO_PREFIX} خانه و زندگی`,
    description: "Workspace · باید در Projects / بورد / تقویم دیده شود",
    area: "LIFE",
    userId: user.id,
    teamId,
  });
  const wsJob = await upsertDemoProject({
    id: "demo-ws-job",
    name: `${DEMO_PREFIX} پروژه شغلی`,
    description: "Workspace · کار روزمره — نه پژوهش",
    area: "WORK",
    userId: user.id,
    teamId,
  });

  // ── Research paths (ONLY /research) ──
  const phdThesis = await upsertDemoProject({
    id: "demo-path-phd-thesis",
    name: `${DEMO_PREFIX} رساله فصل ۳`,
    description: "Path PHD · فقط هاب پژوهش — نه بورد کلی",
    area: "PHD",
    userId: user.id,
  });
  const phdPaper = await upsertDemoProject({
    id: "demo-path-phd-paper",
    name: `${DEMO_PREFIX} مقاله ISI`,
    description: "Path PHD · سوئیچر پژوهش",
    area: "PHD",
    userId: user.id,
  });

  // ── Language paths (ONLY /language) ──
  const langMsrt = await upsertDemoProject({
    id: "demo-path-lang-msrt",
    name: `${DEMO_PREFIX} MSRT 1405`,
    description: "Path LANG · فقط هاب زبان",
    area: "LANG",
    userId: user.id,
  });

  // Tasks
  await createTask({
    id: "demo-task-ws-1",
    title: `${DEMO_PREFIX} خرید مواد غذایی`,
    projectId: wsHome.id,
    area: "LIFE",
    userId: user.id,
    dueInDays: 0,
    status: "TODO",
  });
  await createTask({
    id: "demo-task-ws-2",
    title: `${DEMO_PREFIX} جلسه تیم محصول`,
    projectId: wsJob.id,
    area: "WORK",
    userId: user.id,
    dueInDays: 1,
    status: "IN_PROGRESS",
    priority: "HIGH",
  });
  await createTask({
    id: "demo-task-ws-3",
    title: `${DEMO_PREFIX} پرداخت قبض`,
    projectId: AREA_PROJECT_IDS.LIFE,
    area: "LIFE",
    userId: user.id,
    dueInDays: 2,
  });

  await createTask({
    id: "demo-task-phd-1",
    title: `${DEMO_PREFIX} خواندن منبع A`,
    projectId: phdThesis.id,
    area: "PHD",
    userId: user.id,
    dueInDays: 0,
    status: "TODO",
  });
  await createTask({
    id: "demo-task-phd-2",
    title: `${DEMO_PREFIX} پیش‌نویس بخش روش`,
    projectId: phdThesis.id,
    area: "PHD",
    userId: user.id,
    dueInDays: 3,
    status: "IN_PROGRESS",
  });
  await createTask({
    id: "demo-task-phd-3",
    title: `${DEMO_PREFIX} ایده مقاله`,
    projectId: phdPaper.id,
    area: "PHD",
    userId: user.id,
    dueInDays: 1,
    status: "BACKLOG",
  });
  await createTask({
    id: "demo-task-phd-inbox",
    title: `${DEMO_PREFIX} یادداشت پژوهش بدون مسیر`,
    projectId: AREA_PROJECT_IDS.PHD,
    area: "PHD",
    userId: user.id,
    dueInDays: 0,
    status: "BACKLOG",
  });

  await createTask({
    id: "demo-task-lang-1",
    title: `${DEMO_PREFIX} تمرین Listening MSRT`,
    projectId: langMsrt.id,
    area: "LANG",
    userId: user.id,
    dueInDays: 0,
    status: "TODO",
  });

  // Docs
  await db.doc.upsert({
    where: { id: "demo-doc-phd-1" },
    create: {
      id: "demo-doc-phd-1",
      title: `${DEMO_PREFIX} نوت منبع A`,
      content: "<h2>منبع</h2><p>یادداشت پژوهش ماک</p>",
      contentText: "یادداشت پژوهش ماک",
      area: "PHD",
      projectId: phdThesis.id,
      userId: user.id,
      status: "DRAFTING",
    },
    update: {
      title: `${DEMO_PREFIX} نوت منبع A`,
      area: "PHD",
      projectId: phdThesis.id,
    },
  });
  await db.doc.upsert({
    where: { id: "demo-doc-lang-1" },
    create: {
      id: "demo-doc-lang-1",
      title: `${DEMO_PREFIX} جلسه واژگان`,
      content: "<h2>جلسه زبان</h2><p>ماک</p>",
      contentText: "جلسه زبان ماک",
      area: "LANG",
      projectId: langMsrt.id,
      userId: user.id,
      status: "DRAFTING",
    },
    update: {
      title: `${DEMO_PREFIX} جلسه واژگان`,
      area: "LANG",
      projectId: langMsrt.id,
    },
  });

  await db.langCard.upsert({
    where: { id: "demo-card-1" },
    create: {
      id: "demo-card-1",
      userId: user.id,
      projectId: langMsrt.id,
      front: "ubiquitous",
      back: "همه‌جا حاضر / فراگیر",
      example: "Smartphones are ubiquitous.",
      tags: "MSRT, DEMO",
      box: 0,
      intervalDays: 0,
      nextReviewAt: new Date(),
    },
    update: {
      front: "ubiquitous",
      back: "همه‌جا حاضر / فراگیر",
      projectId: langMsrt.id,
      nextReviewAt: new Date(),
    },
  });

  await db.langSession.create({
    data: {
      userId: user.id,
      projectId: langMsrt.id,
      skill: "VOCAB",
      minutes: 25,
      note: `${DEMO_PREFIX} جلسه ماک`,
      practicedAt: new Date(),
    },
  });

  const track = await db.examTrack.upsert({
    where: { id: "demo-exam-msrt" },
    create: {
      id: "demo-exam-msrt",
      userId: user.id,
      projectId: langMsrt.id,
      kind: "MSRT",
      name: `${DEMO_PREFIX} MSRT آمادگی`,
      targetScore: "50",
      examDate: daysFromNow(45),
    },
    update: {
      name: `${DEMO_PREFIX} MSRT آمادگی`,
      projectId: langMsrt.id,
    },
  });

  await db.mockAttempt.create({
    data: {
      userId: user.id,
      trackId: track.id,
      projectId: langMsrt.id,
      kind: "MSRT",
      status: "COMPLETED",
      startedAt: daysFromNow(-2),
      finishedAt: daysFromNow(-2),
      durationSec: 85 * 60,
      totalCorrect: 62,
      totalQuestions: 100,
      percent: 62,
      sections: [
        {
          key: "listening",
          skill: "LISTENING",
          labelFa: "شنیداری",
          labelEn: "Listening",
          questionCount: 30,
          correct: 18,
          timeSec: 25 * 60,
          timeLimitMin: 25,
        },
        {
          key: "grammar",
          skill: "GRAMMAR",
          labelFa: "گرامر",
          labelEn: "Grammar",
          questionCount: 30,
          correct: 22,
          timeSec: 20 * 60,
          timeLimitMin: 20,
        },
        {
          key: "reading",
          skill: "READING",
          labelFa: "خواندن",
          labelEn: "Reading",
          questionCount: 40,
          correct: 22,
          timeSec: 40 * 60,
          timeLimitMin: 40,
        },
      ],
      note: `${DEMO_PREFIX} mock نمونه`,
    },
  });

  console.log(`
Done. Titles start with ${DEMO_PREFIX}

Where to look (logged in as ${adminEmail}):

  /projects     → فقط «خانه و زندگی» و «پروژه شغلی»
                  (نه رساله / مقاله / MSRT)

  /kanban       → فقط تسک‌های زندگی/کار
                  (نه «خواندن منبع A» و نه Listening)

  /calendar     → همان؛ چیپ پیش‌فرض کار+زندگی
                  (برای دیدن پژوهش، چیپ دکتری را روشن کن — ولی تسک‌های hub از API نمی‌آیند)

  /research     → سوئیچر: رساله فصل ۳ + مقاله ISI
                  بورد: تسک‌های PHD

  /language     → مسیر MSRT 1405 + کارت واژگان + mock

  /dashboard    → لیست امروز بدون تسک پژوهش/زبان
`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
