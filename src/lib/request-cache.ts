import { cache } from "react";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { ensureDeadlineReminders } from "@/features/life/reminders";
import { ensureVocabReviewReminders } from "@/features/language/reminders";
import { ensureBaleDigest, ensureBaleHabitNudge } from "@/features/external/bots/bale/digest";

/** Deduped within a single RSC request tree. */
export const getSessionCached = cache(async () => auth());

export const getUserPreferencesCached = cache(async (userId: string) =>
  getUserPreferences(userId),
);

export const ensurePersonalWorkspaceCached = cache(
  async (userId: string) => ensurePersonalWorkspace(userId),
);

/** Reminders: at most once per request (dashboard should call; cron covers daily). */
export const ensureDailyRemindersCached = cache(async (userId: string) => {
  await Promise.all([
    ensureDeadlineReminders(userId),
    ensureVocabReviewReminders(userId),
    ensureBaleDigest(userId),
    ensureBaleHabitNudge(userId),
  ]);
});
