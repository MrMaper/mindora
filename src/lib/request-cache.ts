import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { syncPlanningStatusesForUser } from "@/features/life/actions";
import { ensureDeadlineReminders } from "@/features/life/reminders";
import { ensureVocabReviewReminders } from "@/features/language/reminders";
import { ensureBaleDigest, ensureBaleHabitNudge } from "@/features/external/bots/bale/digest";

/** Deduped within a single RSC request tree. */
export const getSessionCached = cache(async () => auth());

export const getUserPreferencesCached = cache(async (userId: string) =>
  getUserPreferences(userId),
);

/**
 * Ensure once per request, and skip DB for ~30m across navigations.
 * Soft tab switches no longer pay findMany+count on every click.
 */
export const ensurePersonalWorkspaceCached = cache(async (userId: string) => {
  if (!userId) throw new Error("ensurePersonalWorkspaceCached: missing userId");
  return unstable_cache(
    () => ensurePersonalWorkspace(userId),
    ["personal-workspace", userId],
    { revalidate: 60 * 30 },
  )();
});

/** Planning sync once per request even if dashboard + board both ask. */
export const syncPlanningStatusesCached = cache(async (userId: string) => {
  if (!userId) return;
  await syncPlanningStatusesForUser(userId);
});

/** Reminders: at most once per request (prefer `after()` on Today so nav isn't blocked). */
export const ensureDailyRemindersCached = cache(async (userId: string) => {
  await Promise.all([
    ensureDeadlineReminders(userId),
    ensureVocabReviewReminders(userId),
    ensureBaleDigest(userId),
    ensureBaleHabitNudge(userId),
  ]);
});
