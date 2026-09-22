"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function assertCanManageSprint(
  sprintId: string,
  userId: string,
  role: string,
) {
  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: {
      id: true,
      goal: true,
      status: true,
      projectId: true,
      project: {
        select: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });
  if (!sprint) return null;
  if (role === "ADMIN") return sprint;
  const member = sprint.project.members[0];
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return null;
  }
  return sprint;
}

async function notifyProjectMembers(
  projectId: string,
  type: "SPRINT_STARTED" | "SPRINT_ENDED",
  title: string,
  body: string,
  sprintId: string,
) {
  const members = await db.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  for (const m of members) {
    await notify({
      userId: m.userId,
      type,
      title,
      body,
      data: { sprintId, projectId },
    });
  }
}

function sprintLabel(goal: string | null): string {
  return goal?.trim() || "اسپرینت";
}

export async function startSprintAction(sprintId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const sprint = await assertCanManageSprint(
    sprintId,
    session.user.id,
    session.user.role,
  );
  if (!sprint) return { success: false, error: "اسپرینت پیدا نشد یا اجازه ندارید" };
  if (sprint.status === "ACTIVE") {
    return { success: false, error: "اسپرینت از قبل فعال است" };
  }

  await db.sprint.update({
    where: { id: sprintId },
    data: { status: "ACTIVE" },
  });

  const label = sprintLabel(sprint.goal);
  await notifyProjectMembers(
    sprint.projectId,
    "SPRINT_STARTED",
    `اسپرینت «${label}» شروع شد`,
    "اسپرینت فعال شد — ترجیحات اعلان را در تنظیمات می‌توانی کنترل کنی.",
    sprintId,
  );

  revalidatePath("/projects");
  revalidatePath("/kanban");
  return { success: true };
}

export async function endSprintAction(sprintId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  const sprint = await assertCanManageSprint(
    sprintId,
    session.user.id,
    session.user.role,
  );
  if (!sprint) return { success: false, error: "اسپرینت پیدا نشد یا اجازه ندارید" };

  await db.sprint.update({
    where: { id: sprintId },
    data: { status: "COMPLETED" },
  });

  const label = sprintLabel(sprint.goal);
  await notifyProjectMembers(
    sprint.projectId,
    "SPRINT_ENDED",
    `اسپرینت «${label}» تمام شد`,
    "اسپرینت به وضعیت تمام‌شده رفت.",
    sprintId,
  );

  revalidatePath("/projects");
  revalidatePath("/kanban");
  return { success: true };
}
