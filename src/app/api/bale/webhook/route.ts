import { NextRequest, NextResponse } from "next/server";
import { handleBaleUpdate } from "@/features/external/bots/bale/webhook";
import type { BaleUpdate } from "@/features/external/bots/bale/types";

function webhookSecretOk(request: NextRequest): boolean {
  const expected = (process.env.BALE_WEBHOOK_SECRET ?? "").trim();
  // No secret configured → accept (local/dev); production should set one.
  if (!expected) return true;

  const header =
    request.headers.get("x-telegram-bot-api-secret-token") ??
    request.headers.get("x-bale-bot-api-secret-token") ??
    "";
  if (header && header === expected) return true;

  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${expected}`) return true;

  const q = request.nextUrl.searchParams.get("secret") ?? "";
  return q === expected;
}

export async function POST(request: NextRequest) {
  if (!webhookSecretOk(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = (await request.json()) as BaleUpdate;

    await handleBaleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Bale Webhook] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!webhookSecretOk(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    status: "Bale webhook endpoint",
    timestamp: new Date().toISOString(),
  });
}
