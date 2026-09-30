"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";
import type { BoardStatus } from "./types";
import { spawnNextIfRecurring } from "@/features/life/recurrence";
import { syncResearchLinksFromTaskStatus } from "@/features/research/sync-links";
import {
  canAccessPersonalTask,
  personalTaskOwnership,
} from "@/lib/task-access";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function logActivity(opts: {
  entityId: string;
  action: string;
  performedBy: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await db.activityLog.create({
    data: {
      entity: "task",
      entityId: opts.entityId,
      action: opts.action,
      performedBy: opts.performedBy,
      oldValue: opts.oldValue === undefined ? undefined : (opts.oldValue as object),
      newValue: opts.newValue === undefined ? undefined : (opts.newValue as object),
    },
  });
}

// ─── Move task to a column / reorder within a column ──────────────────────

export async function moveTask(params: {
  taskId: string;
  toStatus: BoardStatus;
  orderedIds: string[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const existing = await db.task.findUnique({
    where: { id: params.taskId },
    select: {
      status: true,
      title: true,
      assignedToId: true,
      createdById: true,
      waitingOn: true,
    },
  });
  if (!existing) return { success: false, error: "کار پیدا نشد" };

  if (
    !canAccessPersonalTask(session.user.id, session.user.role, existing)
  ) {
    return { success: false, error: "اجازه ویرایش ندارید" };
  }

  const uniqueOrdered = [...new Set(params.orderedIds)];
  if (!uniqueOrdered.includes(params.taskId)) {
    uniqueOrdered.push(params.taskId);
  }

  const ownedRows =
    session.user.role === "ADMIN"
      ? uniqueOrdered.map(id => ({ id }))
      : await db.task.findMany({
          where: {
            AND: [
              { id: { in: uniqueOrdered } },
              personalTaskOwnership(session.user.id),
            ],
          },
          select: { id: true },
        });
  const ownedIds = new Set(ownedRows.map(row => row.id));
  if (!ownedIds.has(params.taskId)) {
    return { success: false, error: "اجازه ویرایش ندارید" };
  }
  const safeOrdered = uniqueOrdered.filter(id => ownedIds.has(id));

  let toStatus = params.toStatus;
  if (
    existing.waitingOn &&
    toStatus !== "DONE" &&
    toStatus !== "IN_PROGRESS"
  ) {
    toStatus = "BACKLOG";
  }

  try {
    if (safeOrdered.length > 0) {
      await db.$transaction(
        safeOrdered.map((id, index) =>
          db.task.update({
            where: { id },
            data:
              id === params.taskId
                ? {
                    status: toStatus,
                    position: index,
                    ...(toStatus === "DONE" ? { waitingOn: false } : {}),
                  }
                : { position: index },
          }),
        ),
      );
    } else {
      await db.task.update({
        where: { id: params.taskId },
        data: {
          status: toStatus,
          ...(toStatus === "DONE" ? { waitingOn: false } : {}),
        },
      });
    }
  } catch (error) {
    console.error("moveTask transaction failed", error);
    return { success: false, error: "جابجایی ذخیره نشد" };
  }

  if (existing.status !== toStatus) {
    try {
      await logActivity({
        entityId: params.taskId,
        action: "status_changed",
        performedBy: session.user.id,
        oldValue: { status: existing.status },
        newValue: { status: toStatus },
      });
    } catch (error) {
      console.error("activityLog after board move failed", error);
    }

    try {
      await syncResearchLinksFromTaskStatus(params.taskId, toStatus);
    } catch (error) {
      console.error("syncResearchLinksFromTaskStatus after board move failed", error);
    }

    if (toStatus === "DONE") {
      try {
        await spawnNextIfRecurring(params.taskId, session.user.id);
      } catch (error) {
        console.error("spawnNextIfRecurring after board DONE failed", error);
      }
    }

    if (existing.assignedToId && existing.assignedToId !== session.user.id) {
      try {
        await notify({
          userId: existing.assignedToId,
          type: "STATUS_CHANGED",
          title: `وضعیت به «${toStatus.replace("_", " ")}» در «${existing.title}» تغییر کرد`,
          data: { taskId: params.taskId },
        });
      } catch (error) {
        console.error("notify after board move failed", error);
      }
    }
  }

  revalidatePath("/kanban");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/research");
  return { success: true };
}
