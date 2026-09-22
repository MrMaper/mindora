"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function completeOnboardingAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "غیرمجاز" };

  await db.userPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      onboardingCompletedAt: new Date(),
    },
    update: { onboardingCompletedAt: new Date() },
  });

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
