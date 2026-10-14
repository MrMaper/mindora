"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import { getModuleAccess } from "@/lib/module-guard";
import { canAccessPersonalTask } from "@/lib/task-access";
import { areaRefForTemplate } from "@/lib/areas";
import { getMemberContext } from "@/lib/areas/server";
import { templateKeyForLifePart, isLifePartChip, isUiProfile } from "@/lib/ui-profile";
import { markLifecycleOnce } from "./lifecycle";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Records that the first-run state is finished. There is no modal any more (S-6). */
export async function completeOnboardingAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  await markLifecycleOnce(session.user.id, "onboardingCompletedAt");

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getOnboardingNeededAction(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const prefs = await db.userPreferences.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompletedAt: true },
  });
  return !prefs?.onboardingCompletedAt;
}

/** «قابلیت‌های بیشتر نشان بده» / back to Starter. The layout never changes on its own. */
export async function setUiProfileAction(profile: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (session.user.role === "ADMIN") {
    return { success: false, error: "مدیر سیستم نمایه رابط ندارد" };
  }
  if (!isUiProfile(profile)) return { success: false, error: "نمایه نامعتبر" };

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, uiProfile: profile },
    update: { uiProfile: profile },
  });
  await markLifecycleOnce(session.user.id, "uiProfileChangedAt");

  revalidatePath("/", "layout");
  return { success: true };
}

export async function dismissProfileSuggestionAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, uiSuggestionDismissedAt: new Date() },
    update: { uiSuggestionDismissedAt: new Date() },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

/** S-6: «این مال کدوم قسمت زندگیته؟» — assign the just-written task. */
export async function chooseLifePartAction(input: {
  taskId: string;
  chip: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };
  if (!isLifePartChip(input.chip)) return { success: false, error: "گزینه نامعتبر" };

  const task = await db.task.findUnique({
    where: { id: input.taskId },
    select: { id: true, assignedToId: true, createdById: true },
  });
  if (!task) return { success: false, error: "کار پیدا نشد" };
  if (!canAccessPersonalTask(session.user.id, session.user.role, task)) {
    return { success: false, error: "به این کار دسترسی ندارید" };
  }

  const access = await getModuleAccess(session.user.id);
  const templateKey = templateKeyForLifePart(input.chip, {
    research: access?.flags.research ?? false,
    language: access?.flags.language ?? false,
  });
  const ctx = await getMemberContext(session.user.id);
  const area =
    areaRefForTemplate(ctx.areas.filter(a => !a.archived), templateKey) ??
    ctx.defaultArea;

  await db.task.update({
    where: { id: task.id },
    data: {
      areaId: area.id,
      projectId: area.bucketProjectId || undefined,
      ...(area.hubFor ? { status: "BACKLOG" as const } : {}),
    },
  });
  await markLifecycleOnce(session.user.id, "firstAreaChosenAt");

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true };
}
