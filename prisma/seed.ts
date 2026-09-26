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

  const adminHashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Admin",
      email: adminEmail,
      password: adminHashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      enabledModules: {},
    },
    update: {},
  });

  console.log(`  ✓ Admin user — ${adminEmail} / ${adminPassword}`);
  console.log("  ✓ (single system admin — no second admin seeded)");

  const defaultOrg = await db.organization.upsert({
    where: { id: "default-org" },
    create: {
      id: "default-org",
      name: "Default Organization",
      ownerId: adminUser.id,
    },
    update: {},
  });

  console.log(`  ✓ Default organization: ${defaultOrg.name}`);

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

  const allPermIds = permissions.map(p => p.id);
  const leadPermIds = permissions
    .filter(p => p.key !== "team:delete" && p.key !== "member:role")
    .map(p => p.id);
  const memberPermIds = permissions
    .filter(
      p =>
        p.key === "task:create" ||
        p.key === "task:view" ||
        p.key === "report:view",
    )
    .map(p => p.id);

  await Promise.all(
    allPermIds.map(permissionId =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId } },
        create: { roleId: adminRole.id, permissionId },
        update: {},
      }),
    ),
  );

  await Promise.all(
    leadPermIds.map(permissionId =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: leadRole.id, permissionId } },
        create: { roleId: leadRole.id, permissionId },
        update: {},
      }),
    ),
  );

  await Promise.all(
    memberPermIds.map(permissionId =>
      db.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: memberRole.id, permissionId },
        },
        create: { roleId: memberRole.id, permissionId },
        update: {},
      }),
    ),
  );

  console.log(
    `  ✓ Roles created: ${adminRole.name}, ${leadRole.name}, ${memberRole.name}`,
  );

  // Admin is management-only — no personal workspace / shared area buckets.
  // MEMBER workspaces are created on user create via ensurePersonalWorkspace().

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
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
