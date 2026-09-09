"use server";

import { prisma as db } from "@/lib/db";
import { sendMessage } from "./actions";
import { linkBaleUser } from "./user-link";
import type { BaleUpdate, BaleMessage } from "./types";

const BALE_BASE_URL = process.env.BALE_BASE_URL || "https://tapi.bale.ai/business/bot";

export async function handleBaleUpdate(update: BaleUpdate): Promise<void> {
  if (update.message) {
    await handleMessage(update.message);
  } else if (update.callbackQuery) {
    await handleCallbackQuery(update.callbackQuery);
  }
}

async function handleMessage(message: BaleMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text?.trim() || "";
  const userId = message.from?.id;
  const username = message.from?.username;

  if (!userId) return;

  if (text.startsWith("/start")) {
    await sendWelcomeMessage(chatId, userId, username);
  } else if (text.startsWith("/email")) {
    await handleEmailCommand(chatId, userId, text);
  } else if (text.startsWith("/link")) {
    await handleLinkCommand(chatId, userId, text);
  } else if (text.startsWith("/unlink")) {
    await handleUnlinkCommand(chatId, userId);
  } else if (text.startsWith("/help")) {
    await sendHelpMessage(chatId);
  } else if (text.startsWith("/status")) {
    await sendStatusMessage(chatId, userId);
  }
}

async function sendWelcomeMessage(chatId: number, userId: number, username?: string): Promise<void> {
  const message = `🤖 *Welcome to ScrumFlow Bot!*

Hello${username ? ` @${username}` : ""}!

To receive task notifications, you need to link your ScrumFlow account.

*How to link:*
1. Send \`/email your@email.com\` with your ScrumFlow email
2. Or send \`/link your@email.com\`

*Available commands:*
• \`/email <email>\` - Link your account
• \`/unlink\` - Unlink your account  
• \`/status\` - Check link status
• \`/help\` - Show this help`;

  await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
}

async function sendHelpMessage(chatId: number): Promise<void> {
  const message = `📋 *ScrumFlow Bot Commands*

*Account Linking:*
• \`/email your@email.com\` - Link your ScrumFlow account
• \`/link your@email.com\` - Same as /email
• \`/unlink\` - Unlink your account

*Info:*
• \`/status\` - Check if your account is linked
• \`/help\` - Show this message

*Notifications:*
Once linked, you'll receive:
• 📋 New task assignments
• 🔄 Status changes on your tasks
• 💬 Comments on your tasks
• ⏱️ Work log updates`;

  await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
}

async function sendStatusMessage(chatId: number, baleUserId: number): Promise<void> {
  const user = await db.user.findFirst({
    where: { baleUserId: String(baleUserId) },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const message = `✅ *Account Linked*

*Name:* ${user.name}
*Email:* ${user.email}
*ScrumFlow ID:* \`${user.id}\``;
    await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
  } else {
    const message = `❌ *Not Linked*

Your Bale account (ID: \`${baleUserId}\`) is not linked to any ScrumFlow account.

Use \`/email your@email.com\` to link.`;
    await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
  }
}

async function handleEmailCommand(chatId: number, userId: number, text: string): Promise<void> {
  const email = text.replace(/^\/email\s+/i, "").trim();

  if (!email) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ Please provide your email: `/email your@email.com`",
      parse_mode: "Markdown",
    });
    return;
  }

  if (!email.includes("@")) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ Invalid email format",
      parse_mode: "Markdown",
    });
    return;
  }

  const result = await linkBaleUser(userId, email);

  if (result.success) {
    await sendMessage({
      chat_id: chatId,
      text: `✅ *Account Linked Successfully!*

Your Bale account is now linked to \`${email}\`.

You'll receive notifications for:
• 📋 New task assignments
• 🔄 Status changes
• 💬 Comments
• ⏱️ Work logs`,
      parse_mode: "Markdown",
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: `❌ *Link Failed*

${result.error}

Make sure:
• Email matches your ScrumFlow account
• You have access to ScrumFlow`,
      parse_mode: "Markdown",
    });
  }
}

async function handleLinkCommand(chatId: number, userId: number, text: string): Promise<void> {
  await handleEmailCommand(chatId, userId, text.replace(/^\/link\s+/i, ""));
}

async function handleUnlinkCommand(chatId: number, userId: number): Promise<void> {
  const user = await db.user.findFirst({
    where: { baleUserId: String(userId) },
    select: { id: true },
  });

  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { baleUserId: null },
    });
    await sendMessage({
      chat_id: chatId,
      text: "✅ *Account Unlinked*\n\nYou will no longer receive notifications. Use `/email` to link again.",
      parse_mode: "Markdown",
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: "ℹ️ Your account is not linked.",
      parse_mode: "Markdown",
    });
  }
}

async function handleCallbackQuery(callbackQuery: BaleUpdate["callbackQuery"]): Promise<void> {
  if (!callbackQuery?.data || !callbackQuery.message) return;

  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("task_")) {
    const taskId = data.replace("task_", "");
    const message = `📋 *Task Details*

Task ID: \`${taskId}\`
[Open in ScrumFlow](${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tasks/${taskId})`;

    await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
  }
}