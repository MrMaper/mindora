"use server";

import { prisma as db } from "@/lib/db";
import { sendMessage } from "./actions";
import { linkBaleUser } from "./user-link";
import type { BaleUpdate, BaleMessage } from "./types";

const BALE_BASE_URL = process.env.BALE_BASE_URL || "https://tapi.bale.ai/bot";

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

async function sendWelcomeMessage(
  chatId: number,
  userId: number,
  username?: string,
): Promise<void> {
  const message = `🤖 *به ربات اسکرام‌فلو خوش آمدید!*

سلام${username ? ` @${username}` : ""}! 👋

برای دریافت اعلان‌های وظایف، ابتدا باید حساب اسکرام‌فلو خود را به این ربات متصل کنید.

*نحوه اتصال حساب:*
1. ایمیل حساب اسکرام‌فلو خود را با دستور \`/email your@email.com\` ارسال کنید.
2. یا از دستور \`/link your@email.com\` استفاده کنید.

*دستورات موجود:*
• \`/email <email>\` - اتصال حساب
• \`/link <email>\` - اتصال حساب
• \`/unlink\` - قطع اتصال حساب
• \`/status\` - بررسی وضعیت اتصال
• \`/help\` - نمایش راهنما`;

  await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
}

async function sendHelpMessage(chatId: number): Promise<void> {
  const message = `📋 *دستورات ربات اسکرام‌فلو*

*اتصال حساب:*
• \`/email your@email.com\` - اتصال حساب اسکرام‌فلو
• \`/link your@email.com\` - مشابه دستور /email
• \`/unlink\` - قطع اتصال حساب

*اطلاعات:*
• \`/status\` - بررسی وضعیت اتصال حساب
• \`/help\` - نمایش این راهنما

*اعلان‌ها:*
پس از اتصال حساب، اعلان‌های زیر را دریافت خواهید کرد:
• 📋 اختصاص وظیفه جدید
• 🔄 تغییر وضعیت وظایف
• 💬 نظرهای ثبت‌شده روی وظایف
• ⏱️ به‌روزرسانی ثبت زمان کار`;

  await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
}

async function sendStatusMessage(
  chatId: number,
  baleUserId: number,
): Promise<void> {
  const user = await db.user.findFirst({
    where: { baleUserId: String(baleUserId) },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const message = `✅ *حساب متصل است*

*نام:* ${user.name}
*ایمیل:* ${user.email}
*شناسه اسکرام‌فلو:* \`${user.id}\``;

    await sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } else {
    const message = `❌ *حساب متصل نیست*

حساب شما در بله (شناسه: \`${baleUserId}\`) به هیچ حساب اسکرام‌فلو متصل نشده است.

برای اتصال حساب، از دستور \`/email your@email.com\` استفاده کنید.`;

    await sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  }
}

async function handleEmailCommand(
  chatId: number,
  userId: number,
  text: string,
): Promise<void> {
  const email = text.replace(/^\/email\s+/i, "").trim();

  if (!email) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ لطفاً ایمیل خود را وارد کنید:\n`/email your@email.com`",
      parse_mode: "Markdown",
    });
    return;
  }

  if (!email.includes("@")) {
    await sendMessage({
      chat_id: chatId,
      text: "❌ فرمت ایمیل واردشده صحیح نیست.",
      parse_mode: "Markdown",
    });
    return;
  }

  const result = await linkBaleUser(userId, email);

  if (result.success) {
    await sendMessage({
      chat_id: chatId,
      text: `✅ *حساب با موفقیت متصل شد!*

حساب بله شما به ایمیل \`${email}\` در اسکرام‌فلو متصل شد.

اعلان‌های زیر را دریافت خواهید کرد:
• 📋 اختصاص وظیفه جدید
• 🔄 تغییر وضعیت وظایف
• 💬 نظرهای ثبت‌شده روی وظایف
• ⏱️ ثبت و به‌روزرسانی زمان کار`,
      parse_mode: "Markdown",
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: `❌ *اتصال حساب ناموفق بود*

${result.error}

لطفاً موارد زیر را بررسی کنید:
• ایمیل واردشده با ایمیل حساب اسکرام‌فلو مطابقت داشته باشد.
• به حساب اسکرام‌فلو دسترسی داشته باشید.`,
      parse_mode: "Markdown",
    });
  }
}

async function handleLinkCommand(
  chatId: number,
  userId: number,
  text: string,
): Promise<void> {
  await handleEmailCommand(chatId, userId, text.replace(/^\/link\s+/i, ""));
}

async function handleUnlinkCommand(
  chatId: number,
  userId: number,
): Promise<void> {
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
      text: "✅ *اتصال حساب قطع شد*\n\nاز این پس اعلان‌های اسکرام‌فلو را دریافت نخواهید کرد.\n\nبرای اتصال مجدد، از دستور `/email your@email.com` استفاده کنید.",
      parse_mode: "Markdown",
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: "ℹ️ حساب شما در حال حاضر به اسکرام‌فلو متصل نیست.",
      parse_mode: "Markdown",
    });
  }
}

async function handleCallbackQuery(
  callbackQuery: BaleUpdate["callbackQuery"],
): Promise<void> {
  if (!callbackQuery?.data || !callbackQuery.message) return;

  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("task_")) {
    const taskId = data.replace("task_", "");

    const message = `📋 *جزئیات وظیفه*

*شناسه وظیفه:* \`${taskId}\`

[مشاهده وظیفه در اسکرام‌فلو](${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tasks/${taskId})`;

    await sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  }
}
