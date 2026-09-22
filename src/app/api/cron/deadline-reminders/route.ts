import { NextRequest, NextResponse } from "next/server";
import { runDeadlineRemindersForAllUsers } from "@/features/life/reminders";
import { runVocabReviewRemindersForAllUsers } from "@/features/language/reminders";

/**
 * Secure cron endpoint for deadline + vocab reminders.
 * Call daily with header: Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deadlines, vocab] = await Promise.all([
    runDeadlineRemindersForAllUsers(),
    runVocabReviewRemindersForAllUsers(),
  ]);
  return NextResponse.json({
    ok: true,
    deadlines,
    vocab,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
