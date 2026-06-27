import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "./generated";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("Admin@1234", 12);

  await db.user.upsert({
    where: { email: "admin@scrumflow.app" },
    create: {
      name: "Admin",
      email: "admin@scrumflow.app",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {},
  });

  console.log("  ✓ Admin user — admin@scrumflow.app / Admin@1234");

  const labelCount = await db.label.count();
  if (labelCount === 0) {
    await db.label.createMany({
      data: [
        { name: "Bug",           color: "#e0484d" },
        { name: "Feature",       color: "#3f4cbb" },
        { name: "Enhancement",   color: "#1f9d57" },
        { name: "Documentation", color: "#e8820c" },
        { name: "Design",        color: "#8a4fd6" },
      ],
    });
    console.log("  ✓ Default labels");
  }

  console.log("✅ Done.");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
