import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendMessage } from "@/features/external/bots/bale/actions";
import { sendMessageSchema } from "@/schemas/bale";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request body",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await sendMessage(validation.data);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error, errorCode: result.errorCode },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[Bale API] Send message error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
