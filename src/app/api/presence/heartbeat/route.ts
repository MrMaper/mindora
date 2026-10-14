import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/active-session";
import { recordUserPresence } from "@/features/users/presence";

export async function POST() {
  const session = await requireActiveSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    await recordUserPresence(userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
