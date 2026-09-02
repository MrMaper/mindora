import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/features/external/bots/bale/actions";

export async function POST(request: NextRequest) {
  try {
    const { chatId, text } = await request.json();

    if (!chatId || !text) {
      return NextResponse.json(
        { success: false, error: "chatId and text are required" },
        { status: 400 },
      );
    }

    const chat_id = isNaN(Number(chatId)) ? chatId : Number(chatId);

    const result = await sendMessage({
      chat_id,
      text,
      parse_mode: "Markdown",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}