import { prisma as db } from "@/lib/db";

/**
 * Funnel timestamps on UserPreferences (docs/AREAS.md §6.7). Each is set once
 * and never overwritten. Not a server action: call from authenticated actions.
 */
export type LifecycleField =
  | "firstAreaChosenAt"
  | "firstCaptureAt"
  | "firstDoneAt"
  | "uiProfileChangedAt"
  | "onboardingCompletedAt";

/**
 * The member shell guarantees this row exists (see `ensureUserPreferencesRow`),
 * so a lifecycle write is a single cheap UPDATE that touches 0 rows once set.
 */
export async function ensureUserPreferencesRow(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await db.userPreferences.createMany({
      data: [{ userId }],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("ensureUserPreferencesRow failed", error);
  }
}

/**
 * Best-effort: a funnel write must never break the user's real action.
 */
export async function markLifecycleOnce(
  userId: string,
  field: LifecycleField,
): Promise<void> {
  if (!userId) return;
  try {
    await db.userPreferences.updateMany({
      where: { userId, [field]: null },
      data: { [field]: new Date() },
    });
  } catch (error) {
    console.error(`markLifecycleOnce(${field}) failed`, error);
  }
}

/** First thing the member ever wrote: also ends the (modal-free) first-run state. */
export async function markFirstCapture(userId: string): Promise<void> {
  await markLifecycleOnce(userId, "firstCaptureAt");
  await markLifecycleOnce(userId, "onboardingCompletedAt");
}
