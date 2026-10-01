import { NextRequest, NextResponse } from "next/server";
import { runDeadlineRemindersForAllUsers } from "@/features/life/reminders";
import { runVocabReviewRemindersForAllUsers } from "@/features/language/reminders";
import { runBaleDigestsForAllUsers } from "@/features/external/bots/bale/digest";
import {
  CRON_JOB_DEADLINES,
  touchCronHeartbeat,
} from "@/features/admin/system";

/**
 * Secure cron endpoint for deadline + timed due + vocab + Bale digests.
 * Prefer every 5–10 minutes: Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [deadlines, vocab, bale] = await Promise.all([
      runDeadlineRemindersForAllUsers(),
      runVocabReviewRemindersForAllUsers(),
      runBaleDigestsForAllUsers(),
    ]);
    await touchCronHeartbeat(CRON_JOB_DEADLINES, true, {
      deadlines,
      vocab,
      bale,
    });
    return NextResponse.json({
      ok: true,
      deadlines,
      vocab,
      bale,
      note: "Schedule this route every 5–10 minutes so timed dues fire on time.",
    });
  } catch (err) {
    await touchCronHeartbeat(CRON_JOB_DEADLINES, false, {
      error: err instanceof Error ? err.message : "unknown",
    }).catch(() => {});
    throw err;
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
