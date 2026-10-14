import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const base = new PrismaClient({ adapter });

async function fillAreaId(
  userId: string | null | undefined,
  data: Record<string, unknown> | undefined,
) {
  if (!data || !userId) return;
  if (data.areaId != null) return;
  const { isLifeAreaValue } = await import("@/lib/areas");
  const area = data.area;
  if (typeof area !== "string" || !isLifeAreaValue(area)) return;
  const { areaIdForLegacy } = await import("@/lib/areas/dual-write");
  data.areaId = await areaIdForLegacy(userId, area);
}

/**
 * Dual-write `areaId` whenever a write sets the legacy `area` enum
 * (docs/AREAS.md §18.3). Lazy-imports helpers to avoid a cycle with `@/lib/areas`.
 */
export const prisma = base.$extends({
  query: {
    task: {
      async create({ args, query }) {
        const data = args.data as Record<string, unknown>;
        const userId =
          (typeof data.createdById === "string" && data.createdById) ||
          (typeof data.assignedToId === "string" && data.assignedToId) ||
          null;
        await fillAreaId(userId, data);
        return query(args);
      },
      async update({ args, query }) {
        const data = args.data as Record<string, unknown> | undefined;
        if (data && data.area !== undefined && data.areaId === undefined) {
          const id = typeof args.where?.id === "string" ? args.where.id : null;
          if (id) {
            const row = await base.task.findUnique({
              where: { id },
              select: { createdById: true, assignedToId: true },
            });
            await fillAreaId(row?.assignedToId ?? row?.createdById, data);
          }
        }
        return query(args);
      },
    },
    doc: {
      async create({ args, query }) {
        const data = args.data as Record<string, unknown>;
        await fillAreaId(
          typeof data.userId === "string" ? data.userId : null,
          data,
        );
        return query(args);
      },
      async update({ args, query }) {
        const data = args.data as Record<string, unknown> | undefined;
        if (data && data.area !== undefined && data.areaId === undefined) {
          const id = typeof args.where?.id === "string" ? args.where.id : null;
          if (id) {
            const row = await base.doc.findUnique({
              where: { id },
              select: { userId: true },
            });
            await fillAreaId(row?.userId, data);
          }
        }
        return query(args);
      },
    },
    habit: {
      async create({ args, query }) {
        const data = args.data as Record<string, unknown>;
        await fillAreaId(
          typeof data.userId === "string" ? data.userId : null,
          data,
        );
        return query(args);
      },
      async update({ args, query }) {
        const data = args.data as Record<string, unknown> | undefined;
        if (data && data.area !== undefined && data.areaId === undefined) {
          const id = typeof args.where?.id === "string" ? args.where.id : null;
          if (id) {
            const row = await base.habit.findUnique({
              where: { id },
              select: { userId: true },
            });
            await fillAreaId(row?.userId, data);
          }
        }
        return query(args);
      },
    },
    docFolder: {
      async create({ args, query }) {
        const data = args.data as Record<string, unknown>;
        await fillAreaId(
          typeof data.userId === "string" ? data.userId : null,
          data,
        );
        return query(args);
      },
      async update({ args, query }) {
        const data = args.data as Record<string, unknown> | undefined;
        if (data && data.area !== undefined && data.areaId === undefined) {
          const id = typeof args.where?.id === "string" ? args.where.id : null;
          if (id) {
            const row = await base.docFolder.findUnique({
              where: { id },
              select: { userId: true },
            });
            await fillAreaId(row?.userId, data);
          }
        }
        return query(args);
      },
    },
  },
});
