import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@mindora.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@1234";
  const superadminEmail =
    process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@mindora.app";
  const superadminPassword =
    process.env.SEED_SUPERADMIN_PASSWORD ?? "SuperAdmin@1234";

  const adminHashedPassword = await bcrypt.hash(adminPassword, 12);
  const superadminHashedPassword = await bcrypt.hash(superadminPassword, 12);

  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Admin",
      email: adminEmail,
      password: adminHashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {},
  });

  await db.user.upsert({
    where: { email: superadminEmail },
    create: {
      name: "Super Admin",
      email: superadminEmail,
      password: superadminHashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {},
  });

  console.log(`  ✓ Admin user — ${adminEmail} / ${adminPassword}`);
  console.log(
    `  ✓ Superadmin user — ${superadminEmail} / ${superadminPassword}`,
  );

  // Create default organization
  const defaultOrg = await db.organization.upsert({
    where: { id: "default-org" },
    create: {
      id: "default-org",
      name: "Default Organization",
      ownerId: adminEmail,
    },
    update: {},
  });

  console.log(`  ✓ Default organization: ${defaultOrg.name}`);

  // Create default permissions
  const permissionKeys = [
    "team:manage",
    "team:delete",
    "team:archive",
    "member:invite",
    "member:remove",
    "member:role",
    "task:create",
    "task:manage_all",
    "task:view",
    "report:view",
    "project:manage",
    "project:delete",
    "project:member",
  ];

  const permissions = [];
  for (const key of permissionKeys) {
    const perm = await db.permission.upsert({
      where: { key },
      create: { key },
      update: {},
    });
    permissions.push(perm);
  }

  // Create default team roles
  const adminRole = await db.role.upsert({
    where: { name: "ADMINISTRATOR" },
    create: { name: "ADMINISTRATOR" },
    update: {},
  });

  const leadRole = await db.role.upsert({
    where: { name: "TEAM_LEAD" },
    create: { name: "TEAM_LEAD" },
    update: {},
  });

  const memberRole = await db.role.upsert({
    where: { name: "MEMBER" },
    create: { name: "MEMBER" },
    update: {},
  });

  // Connect permissions to team roles
  const allPermIds = permissions.map((p) => p.id);
  const leadPermIds = permissions
    .filter((p) => p.key !== "team:delete" && p.key !== "member:role")
    .map((p) => p.id);
  const memberPermIds = permissions
    .filter(
      (p) =>
        p.key === "task:create" || p.key === "task:view" || p.key === "report:view",
    )
    .map((p) => p.id);

  await Promise.all(
    allPermIds.map((permissionId) =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId } },
        create: { roleId: adminRole.id, permissionId },
        update: {},
      }),
    ),
  );

  await Promise.all(
    leadPermIds.map((permissionId) =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: leadRole.id, permissionId } },
        create: { roleId: leadRole.id, permissionId },
        update: {},
      }),
    ),
  );

  await Promise.all(
    memberPermIds.map((permissionId) =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: memberRole.id, permissionId } },
        create: { roleId: memberRole.id, permissionId },
        update: {},
      }),
    ),
  );

  console.log(
    `  ✓ Roles created: ${adminRole.name}, ${leadRole.name}, ${memberRole.name}`,
  );

  // Create default project
  const defaultProject = await db.project.upsert({
    where: { id: "default-project" },
    create: {
      id: "default-project",
      name: "Default Project",
      description: "Default project for all users",
      status: "ACTIVE",
      members: {
        create: {
          userId: adminUser.id,
          role: "OWNER",
        },
      },
    },
    update: {},
  });

  console.log(`  ✓ Default project: ${defaultProject.name}`);

  const personalTeam = await db.team.upsert({
    where: { id: "personal-life" },
    create: {
      id: "personal-life",
      name: "زندگی من",
      description: "فضای شخصی",
      organizationId: defaultOrg.id,
    },
    update: {},
  });

  await db.teamMember.upsert({
    where: { teamId_userId: { teamId: personalTeam.id, userId: adminUser.id } },
    create: {
      teamId: personalTeam.id,
      userId: adminUser.id,
      roleId: memberRole.id,
    },
    update: {},
  });

  const areaProjects = [
    {
      id: "area-phd",
      name: "دکتری",
      description: "تحصیل، پژوهش و نوشتن",
      area: "PHD" as const,
    },
    {
      id: "area-work",
      name: "کار",
      description: "کارها و پروژه‌های شغلی",
      area: "WORK" as const,
    },
    {
      id: "area-life",
      name: "زندگی",
      description: "خانه، سلامت و امور شخصی",
      area: "LIFE" as const,
    },
  ];

  for (const area of areaProjects) {
    await db.project.upsert({
      where: { id: area.id },
      create: {
        id: area.id,
        name: area.name,
        description: area.description,
        status: "ACTIVE",
        area: area.area,
        teamId: personalTeam.id,
        members: { create: { userId: adminUser.id, role: "OWNER" } },
      },
      update: { area: area.area, name: area.name },
    });
    await db.projectMember.upsert({
      where: {
        projectId_userId: { projectId: area.id, userId: adminUser.id },
      },
      create: { projectId: area.id, userId: adminUser.id, role: "OWNER" },
      update: {},
    });
  }
  console.log("  ✓ Life areas: دکتری، کار، زندگی");

  const existingPersonalTasks = await db.task.count({
    where: { projectId: { in: ["area-phd", "area-work", "area-life"] } },
  });
  if (existingPersonalTasks === 0) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);

    await db.task.createMany({
      data: [
        {
          title: "مرور مقاله مرتبط با موضوع رساله",
          status: "TODO",
          priority: "HIGH",
          type: "TASK",
          area: "PHD",
          projectId: "area-phd",
          teamId: personalTeam.id,
          createdById: adminUser.id,
          assignedToId: adminUser.id,
          dueDate: today,
        },
        {
          title: "نوشتن پیش‌نویس بخش مقدمه",
          status: "IN_PROGRESS",
          priority: "HIGH",
          type: "TASK",
          area: "PHD",
          projectId: "area-phd",
          teamId: personalTeam.id,
          createdById: adminUser.id,
          assignedToId: adminUser.id,
          dueDate: inThreeDays,
        },
        {
          title: "ایده: مقایسه روش‌های ارزیابی کیفیت داده",
          status: "BACKLOG",
          priority: "MEDIUM",
          type: "TASK",
          area: "PHD",
          projectId: "area-phd",
          teamId: personalTeam.id,
          createdById: adminUser.id,
          assignedToId: adminUser.id,
        },
        {
          title: "پیگیری تسک شغلی باز",
          status: "BLOCKED",
          priority: "MEDIUM",
          type: "TASK",
          area: "WORK",
          projectId: "area-work",
          teamId: personalTeam.id,
          createdById: adminUser.id,
          assignedToId: adminUser.id,
          dueDate: today,
        },
        {
          title: "رزرو وقت دندانپزشکی",
          status: "TODO",
          priority: "LOW",
          type: "TASK",
          area: "LIFE",
          projectId: "area-life",
          teamId: personalTeam.id,
          createdById: adminUser.id,
          assignedToId: adminUser.id,
          dueDate: yesterday,
          recurrence: "MONTHLY",
        },
      ],
    });
    console.log("  ✓ Sample personal tasks");
  }

  const existingDocs = await db.doc.count({ where: { userId: adminUser.id } });
  if (existingDocs === 0) {
    const introTask = await db.task.findFirst({
      where: {
        createdById: adminUser.id,
        title: "نوشتن پیش‌نویس بخش مقدمه",
      },
      select: { id: true },
    });

    const thesisDoc = await db.doc.create({
      data: {
        title: "پیش‌نویس مقدمه رساله",
        area: "PHD",
        pinned: true,
        userId: adminUser.id,
        content:
          "<h2>مقدمه</h2><p>اینجا می‌توانی پیش‌نویس فصل یا ایده‌های پژوهش را بنویسی و به تسک‌ها وصل کنی.</p><ul><li>بیان مسئله</li><li>اهمیت موضوع</li><li>سوالات پژوهش</li></ul>",
        contentText:
          "مقدمه اینجا می‌توانی پیش‌نویس فصل یا ایده‌های پژوهش را بنویسی و به تسک‌ها وصل کنی. بیان مسئله اهمیت موضوع سوالات پژوهش",
      },
    });

    await db.doc.create({
      data: {
        title: "یادداشت جلسه کاری",
        area: "WORK",
        userId: adminUser.id,
        content:
          "<h3>جلسه</h3><p>نکات مهم جلسه را اینجا نگه دار.</p><ul><li>تصمیم‌ها</li><li>اقدام‌ها</li></ul>",
        contentText: "جلسه نکات مهم جلسه را اینجا نگه دار. تصمیم‌ها اقدام‌ها",
      },
    });

    await db.doc.create({
      data: {
        title: "چک‌لیست خانه",
        area: "LIFE",
        userId: adminUser.id,
        content:
          "<p>کارهای شخصی و خانه.</p><ul><li>خرید</li><li>سلامت</li><li>امور اداری</li></ul>",
        contentText: "کارهای شخصی و خانه. خرید سلامت امور اداری",
      },
    });

    if (introTask) {
      await db.docTask.create({
        data: { docId: thesisDoc.id, taskId: introTask.id },
      });
    }
    console.log("  ✓ Sample docs");
  }

  // Create default labels
  const labelCount = await db.label.count();
  if (labelCount === 0) {
    await db.label.createMany({
      data: [
        { name: "مطالعه", color: "#3f4cbb" },
        { name: "نوشتن", color: "#8a4fd6" },
        { name: "جلسه", color: "#e8820c" },
        { name: "خانه", color: "#1f9d57" },
        { name: "فوری", color: "#e0484d" },
      ],
    });
    console.log("  ✓ Default labels");
  }

  console.log("✅ Done.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());