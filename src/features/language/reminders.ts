import { prisma as db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { formatNumber } from "@/lib/utils";
import { getBaleRuntime } from "@/features/external/bots/bale/config";
import { baleAppOrigin, deliverBale } from "@/features/external/bots/bale/deliver";
import { REVIEW_DAILY_CAP } from "./srs";
import { startOfAppDay } from "./day";

async function sendBaleVocabDm(
  userId: string,
  title: string,
): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { baleUserId: true },
    });
    if (!user?.baleUserId) return;
    const runtime = await getBaleRuntime();
    if (!runtime.enabled || !runtime.notifyVocab) return;
    const href = `${baleAppOrigin()}/language?tab=vocab`;
    await deliverBale({
      chatId: user.baleUserId,
      text: `📚 ${title.replace(/[*_`]/g, "")}\n\n${href}`,
      kind: "vocab",
    });
  } catch (err) {
    console.error("Bale vocab DM failed:", err);
  }
}

/**
 * Server-only helper (not a server action). Call from layout/cron with a known userId.
 * One in-app (+ optional Bale) reminder per app-day when vocab cards are due.
 */
export async function ensureVocabReviewReminders(
  userId: string,
): Promise<void> {
  if (!userId) return;

  const prefs = await db.userPreferences.findUnique({
    where: { userId },
    select: { notifications: true, language: true },
  });
  if (prefs?.notifications === false) return;

  const now = new Date();
  const today = startOfAppDay(now);
  const dueCount = await db.langCard.count({
    where: { userId, nextReviewAt: { lte: now } },
  });
  if (dueCount <= 0) return;

  const already = await db.notification.findFirst({
    where: {
      userId,
      type: "VOCAB_REVIEW_DUE",
      createdAt: { gte: today },
    },
    select: { id: true },
  });
  if (already) return;

  const language = prefs?.language === "EN" ? "EN" : "FA";
  const n = formatNumber(dueCount, language);
  const title =
    language === "EN"
      ? `${n} vocab cards due — review today`
      : `${n} واژه موعد مرور دارد — امروز مرور کن`;
  const body =
    language === "EN"
      ? `Daily quota up to ${REVIEW_DAILY_CAP} cards.`
      : `سهم روزانه تا ${formatNumber(REVIEW_DAILY_CAP, language)} کارت.`;

  await notify({
    userId,
    type: "VOCAB_REVIEW_DUE",
    title,
    body,
    data: {
      dueCount,
      href: "/language?tab=vocab",
      bucket: "daily",
    },
  });

  await sendBaleVocabDm(userId, title);
}

/** Cron helper: vocab reminders for all active users with notifications on. */
export async function runVocabReviewRemindersForAllUsers(): Promise<{
  users: number;
}> {
  const allActive = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  let count = 0;
  for (const user of allActive) {
    const prefs = await db.userPreferences.findUnique({
      where: { userId: user.id },
      select: { notifications: true },
    });
    if (prefs?.notifications === false) continue;
    await ensureVocabReviewReminders(user.id);
    count += 1;
  }
  return { users: count };
}
