"use server";

import { prisma as db } from "@/lib/db";
import { requireAuth } from "@/lib/require-role";
import type { Language, Theme } from "@/types/db";
import type { UserPreferencesData } from "./queries";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface UpdatePreferencesInput {
  language?: Language;
  theme?: Theme;
  emailNotifs?: boolean;
  notifications?: boolean;
  soundNotifs?: boolean;
  notifyTaskAssigned?: boolean;
  notifyTaskUpdated?: boolean;
  notifyTaskCommented?: boolean;
  notifyMention?: boolean;
  notifySprintStarted?: boolean;
  notifySprintEnded?: boolean;
  notifyDeadlineApproaching?: boolean;
  notifyStatusChanged?: boolean;
}

export async function updateUserPreferences(
  input: UpdatePreferencesInput,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const updateData: Record<string, unknown> = {};
    if (input.language !== undefined) updateData.language = input.language;
    if (input.theme !== undefined) updateData.theme = input.theme;
    if (input.emailNotifs !== undefined) updateData.emailNotifs = input.emailNotifs;
    if (input.notifications !== undefined) updateData.notifications = input.notifications;
    if (input.soundNotifs !== undefined) updateData.soundNotifs = input.soundNotifs;
    if (input.notifyTaskAssigned !== undefined) updateData.notifyTaskAssigned = input.notifyTaskAssigned;
    if (input.notifyTaskUpdated !== undefined) updateData.notifyTaskUpdated = input.notifyTaskUpdated;
    if (input.notifyTaskCommented !== undefined) updateData.notifyTaskCommented = input.notifyTaskCommented;
    if (input.notifyMention !== undefined) updateData.notifyMention = input.notifyMention;
    if (input.notifySprintStarted !== undefined) updateData.notifySprintStarted = input.notifySprintStarted;
    if (input.notifySprintEnded !== undefined) updateData.notifySprintEnded = input.notifySprintEnded;
    if (input.notifyDeadlineApproaching !== undefined) updateData.notifyDeadlineApproaching = input.notifyDeadlineApproaching;
    if (input.notifyStatusChanged !== undefined) updateData.notifyStatusChanged = input.notifyStatusChanged;

    await db.userPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        language: input.language ?? "FA",
        theme: input.theme ?? "SYSTEM",
        emailNotifs: input.emailNotifs ?? true,
        notifications: input.notifications ?? true,
        soundNotifs: input.soundNotifs ?? false,
        notifyTaskAssigned: input.notifyTaskAssigned ?? true,
        notifyTaskUpdated: input.notifyTaskUpdated ?? true,
        notifyTaskCommented: input.notifyTaskCommented ?? true,
        notifyMention: input.notifyMention ?? true,
        notifySprintStarted: input.notifySprintStarted ?? true,
        notifySprintEnded: input.notifySprintEnded ?? true,
        notifyDeadlineApproaching: input.notifyDeadlineApproaching ?? true,
        notifyStatusChanged: input.notifyStatusChanged ?? true,
      },
      update: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return {
      success: false,
      error: "به‌روزرسانی ترجیحات ناموفق بود",
    };
  }
}

export async function updateBaleSchedule(digestHour: number, habitHour: number): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    const digest = clampHour(digestHour);
    const habit = clampHour(habitHour);
    await db.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, baleDigestHour: digest, baleHabitHour: habit },
      update: { baleDigestHour: digest, baleHabitHour: habit },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating Bale schedule:", error);
    return { success: false, error: "به‌روزرسانی ترجیحات ناموفق بود" };
  }
}

function clampHour(value: number) {
  if (!Number.isFinite(value)) return 8;
  return Math.min(23, Math.max(0, Math.round(value)));
}

export async function updateLanguagePreference(
  language: Language,
): Promise<ActionResult> {
  return updateUserPreferences({ language });
}
