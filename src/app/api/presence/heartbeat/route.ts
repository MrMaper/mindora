import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordUserPresence } from "@/features/users/presence";

export async function POST() {
  const session = await auth();
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
