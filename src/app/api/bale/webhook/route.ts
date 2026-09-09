import { NextRequest, NextResponse } from "next/server";
import { handleBaleUpdate } from "@/features/external/bots/bale/webhook";
import type { BaleUpdate } from "@/features/external/bots/bale/types";

export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as BaleUpdate;

    await handleBaleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Bale Webhook] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "Bale webhook endpoint",
    timestamp: new Date().toISOString(),
  });
}