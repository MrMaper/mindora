"use server";

import { revalidatePath } from "next/cache";
import { prisma as db } from "@/lib/db";
import { requireAuth } from "@/lib/require-role";
import { MAX_ACTIVE_AREAS } from "@/lib/areas";
import {
  ensurePersonalWorkspace,
} from "@/lib/areas/server";
export interface ActionResult<T = Record<string, unknown>> {
  success: boolean;
  error?: string;
  data?: T;
}

function revalidateAreas(areaId?: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  if (areaId) revalidatePath(`/projects/areas/${areaId}`);
}

async function ownedArea(userId: string, areaId: string) {
  return db.userArea.findFirst({
    where: { id: areaId, userId },
  });
}

/** S-2: create a custom area (cap 8 active). */
export async function createUserAreaAction(input: {
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const name = input.name.trim();
  if (!name || name.length > 100) {
    return { success: false, error: "نام حوزه نامعتبر است" };
  }

  await ensurePersonalWorkspace(session.user.id);
  const userId = session.user.id;

  const active = await db.userArea.count({
    where: { userId, archived: false },
  });
  if (active >= MAX_ACTIVE_AREAS) {
    return { success: false, error: "حداکثر ۸ حوزه" };
  }

  const clash = await db.userArea.findFirst({
    where: {
      userId,
      archived: false,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (clash) return { success: false, error: "این نام از قبل هست" };

  const maxSort = await db.userArea.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  const area = await db.userArea.create({
    data: {
      userId,
      name,
      nameIsDefault: false,
      templateKey: "custom",
      sortOrder,
      archived: false,
      isDefault: false,
      hubFor: null,
    },
    select: { id: true },
  });

  const bucketId = `area-inbox-${area.id}`;
  const teamId = `personal-${userId}`;
  await db.project.create({
    data: {
      id: bucketId,
      name,
      description: null,
      status: "ACTIVE",
      areaId: area.id,
      teamId,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  await db.userArea.update({
    where: { id: area.id },
    data: { bucketProjectId: bucketId },
  });
  revalidateAreas(area.id);
  return { success: true, data: { id: area.id } };
}

/** S-2: rename / color / icon / archive on UserArea. */
export async function updateUserAreaAction(input: {
  areaId: string;
  name?: string;
  color?: string | null;
  icon?: string | null;
  archived?: boolean;
}): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const row = await ownedArea(session.user.id, input.areaId);
  if (!row) return { success: false, error: "حوزه پیدا نشد" };

  if (input.archived === true) {
    if (row.isDefault) {
      return { success: false, error: "حوزهٔ پیش‌فرض را نمی‌شود بایگانی کرد" };
    }
    if (row.hubFor) {
      return { success: false, error: "حوزهٔ هاب را نمی‌شود بایگانی کرد" };
    }
  }
  if (input.archived === false) {
    const active = await db.userArea.count({
      where: { userId: session.user.id, archived: false },
    });
    if (active >= MAX_ACTIVE_AREAS) {
      return { success: false, error: "حداکثر ۸ حوزه" };
    }
  }

  const name = input.name?.trim();
  if (name !== undefined) {
    if (!name || name.length > 100) {
      return { success: false, error: "نام حوزه نامعتبر است" };
    }
    const clash = await db.userArea.findFirst({
      where: {
        userId: session.user.id,
        archived: false,
        id: { not: row.id },
        name: { equals: name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (clash) return { success: false, error: "این نام از قبل هست" };
  }

  await db.userArea.update({
    where: { id: row.id },
    data: {
      ...(name !== undefined
        ? { name, nameIsDefault: false }
        : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.archived !== undefined ? { archived: input.archived } : {}),
    },
  });

  if (name !== undefined && row.bucketProjectId) {
    await db.project.update({
      where: { id: row.bucketProjectId },
      data: { name },
    });
  }
  revalidateAreas(row.id);
  return { success: true };
}

/** S-2: reorder by UserArea ids (any length ≥ 1). */
export async function reorderUserAreasAction(
  orderedIds: string[],
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  if (!orderedIds.length) {
    return { success: false, error: "ترتیب حوزه‌ها نامعتبر است" };
  }

  const rows = await db.userArea.findMany({
    where: { userId: session.user.id, id: { in: orderedIds } },
    select: { id: true },
  });
  if (rows.length !== orderedIds.length) {
    return { success: false, error: "ترتیب حوزه‌ها نامعتبر است" };
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.userArea.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  revalidateAreas();
  return { success: true };
}

/** S-2: set default area (active, non-hub). */
export async function setDefaultUserAreaAction(
  areaId: string,
): Promise<ActionResult> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const row = await ownedArea(session.user.id, areaId);
  if (!row || row.archived) return { success: false, error: "حوزه پیدا نشد" };
  if (row.hubFor) {
    return { success: false, error: "حوزهٔ هاب نمی‌تواند پیش‌فرض باشد" };
  }

  await db.$transaction([
    db.userArea.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    }),
    db.userArea.update({
      where: { id: row.id },
      data: { isDefault: true, archived: false },
    }),
  ]);
  revalidateAreas(row.id);
  return { success: true };
}

/**
 * S-3: move all content from area A to B, then optionally delete/archive A.
 * When \`deleteSource\` is true and A has no hubFor, A is deleted after the move.
 */
export async function moveAllAreaContentAction(input: {
  fromAreaId: string;
  toAreaId: string;
  deleteSource?: boolean;
}): Promise<ActionResult<{ moved: number }>> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;
  if (input.fromAreaId === input.toAreaId) {
    return { success: false, error: "مقصد باید متفاوت باشد" };
  }

  const [from, to] = await Promise.all([
    ownedArea(userId, input.fromAreaId),
    ownedArea(userId, input.toAreaId),
  ]);
  if (!from || !to) return { success: false, error: "حوزه پیدا نشد" };
  if (to.archived) return { success: false, error: "مقصد بایگانی است" };
  if (from.isDefault && input.deleteSource) {
    return { success: false, error: "حوزهٔ پیش‌فرض را نمی‌شود حذف کرد" };
  }
  if (from.hubFor && input.deleteSource) {
    // Hub change: transfer hubFor to empty non-default target.
    if (to.isDefault || to.hubFor) {
      return {
        success: false,
        error: "برای انتقال هاب، مقصد باید خالی از هاب و غیرپیش‌فرض باشد",
      };
    }
  }

  const toAreaId = to.id;
  const fromAreaId = from.id;

  const [taskN, docN, habitN, folderN, pathN] = await db.$transaction([
    db.task.updateMany({
      where: {
        OR: [{ createdById: userId }, { assignedToId: userId }],
        areaId: fromAreaId,
      },
      data: { areaId: toAreaId },
    }),
    db.doc.updateMany({
      where: { userId, areaId: fromAreaId },
      data: { areaId: toAreaId },
    }),
    db.habit.updateMany({
      where: { userId, areaId: fromAreaId },
      data: { areaId: toAreaId },
    }),
    db.docFolder.updateMany({
      where: { userId, areaId: fromAreaId },
      data: { areaId: toAreaId },
    }),
    db.project.updateMany({
      where: {
        areaId: fromAreaId,
        id: { not: from.bucketProjectId ?? "" },
        members: { some: { userId, role: "OWNER" } },
      },
      data: { areaId: toAreaId },
    }),
  ]);

  // Move tasks that still sit in the source bucket project.
  if (from.bucketProjectId && to.bucketProjectId) {
    await db.task.updateMany({
      where: { projectId: from.bucketProjectId },
      data: {
        projectId: to.bucketProjectId,
        areaId: toAreaId,
      },
    });
  }

  if (from.hubFor) {
    await db.$transaction([
      db.userArea.update({
        where: { id: fromAreaId },
        data: { hubFor: null },
      }),
      db.userArea.update({
        where: { id: toAreaId },
        data: { hubFor: from.hubFor },
      }),
    ]);
  }

  let deleted = false;
  if (input.deleteSource) {
    if (from.bucketProjectId) {
      await db.project.delete({ where: { id: from.bucketProjectId } }).catch(() => {
        /* bucket may still have rows; archive instead */
      });
    }
    try {
      await db.userArea.delete({ where: { id: fromAreaId } });
      deleted = true;
    } catch {
      await db.userArea.update({
        where: { id: fromAreaId },
        data: { archived: true, isDefault: false, hubFor: null },
      });
    }
  }
  revalidateAreas(toAreaId);
  if (!deleted) revalidateAreas(fromAreaId);

  const moved =
    taskN.count + docN.count + habitN.count + folderN.count + pathN.count;
  return { success: true, data: { moved } };
}

/** Preview counts for S-3 confirm dialog. */
export async function previewAreaMoveAction(areaId: string): Promise<
  ActionResult<{
    tasks: number;
    docs: number;
    habits: number;
    paths: number;
  }>
> {
  const session = await requireAuth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const row = await ownedArea(session.user.id, areaId);
  if (!row) return { success: false, error: "حوزه پیدا نشد" };
  const userId = session.user.id;

  const [tasks, docs, habits, paths] = await Promise.all([
    db.task.count({
      where: {
        AND: [
          { OR: [{ createdById: userId }, { assignedToId: userId }] },
          {
            OR: [
              { areaId },
              ...(row.bucketProjectId
                ? [{ projectId: row.bucketProjectId }]
                : []),
            ],
          },
        ],
      },
    }),
    db.doc.count({ where: { userId, areaId } }),
    db.habit.count({ where: { userId, areaId } }),
    db.project.count({
      where: {
        areaId,
        id: { not: row.bucketProjectId ?? "" },
        members: { some: { userId, role: "OWNER" } },
      },
    }),
  ]);

  return {
    success: true,
    data: { tasks, docs, habits, paths },
  };
}
