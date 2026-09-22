"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";
import type { BoardStatus } from "./types";
import { spawnNextIfRecurring } from "@/features/life/recurrence";

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
    select: { status: true, title: true, assignedToId: true },
  });
  if (!existing) return { success: false, error: "تسک یافت نشد" };

  await db.$transaction(
    params.orderedIds.map((id, index) =>
      db.task.update({
        where: { id },
        data:
          id === params.taskId
            ? { status: params.toStatus, position: index }
            : { position: index },
      })
    )
  );

  if (existing.status !== params.toStatus) {
    await logActivity({
      entityId: params.taskId,
      action: "status_changed",
      performedBy: session.user.id,
      oldValue: { status: existing.status },
      newValue: { status: params.toStatus },
    });

    if (params.toStatus === "DONE") {
      await spawnNextIfRecurring(params.taskId, session.user.id);
    }

    if (existing.assignedToId && existing.assignedToId !== session.user.id) {
      await notify({
        userId: existing.assignedToId,
        type: "STATUS_CHANGED",
        title: `وضعیت به «${params.toStatus.replace("_", " ")}» در «${existing.title}» تغییر کرد`,
        data: { taskId: params.taskId },
      });
    }
  }

  revalidatePath("/kanban");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}
