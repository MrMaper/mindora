"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import type { BoardStatus } from "./types";

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
  if (!session?.user) return { success: false, error: "Unauthorized." };

  const existing = await db.task.findUnique({
    where: { id: params.taskId },
    select: { status: true },
  });
  if (!existing) return { success: false, error: "Task not found." };

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
  }

  revalidatePath("/kanban");
  revalidatePath("/tasks");
  return { success: true };
}
