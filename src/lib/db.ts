import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Plain Prisma client. P7 removed the dual-write extension: `areaId` is required
 * on Project/Task/Doc/Habit, so callers resolve it explicitly
 * (see `@/lib/areas/server`: `resolveMemberAreaId`, `areaIdForGuess`).
 */
export const prisma = new PrismaClient({ adapter });
