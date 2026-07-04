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

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@scrumflow.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@1234";
  const superadminEmail =
    process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@scrumflow.app";
  const superadminPassword =
    process.env.SEED_SUPERADMIN_PASSWORD ?? "SuperAdmin@1234";

  const adminHashedPassword = await bcrypt.hash(adminPassword, 12);
  const superadminHashedPassword = await bcrypt.hash(superadminPassword, 12);

  await db.user.upsert({
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

  const labelCount = await db.label.count();
  if (labelCount === 0) {
    await db.label.createMany({
      data: [
        { name: "Bug", color: "#e0484d" },
        { name: "Feature", color: "#3f4cbb" },
        { name: "Enhancement", color: "#1f9d57" },
        { name: "Documentation", color: "#e8820c" },
        { name: "Design", color: "#8a4fd6" },
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
