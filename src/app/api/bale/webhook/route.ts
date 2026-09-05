import { NextRequest, NextResponse } from "next/server";
import { getUpdates, sendMessage } from "@/lib/bale/handlers";
import { BaleUpdate } from "@/lib/bale/types";

export async function GET(req: NextRequest) {
  // const update = await req.json();

  const updates = await getUpdates();

  console.log(updates);

  // console.log("Bale update:", JSON.stringify(update, null, 2));

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const update = (await request.json()) satisfies BaleUpdate;

  // console.log(update);

  return NextResponse.json({ ok: true });
}
