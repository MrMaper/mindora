"use server";

import { prisma as db } from "@/lib/db";
import { sendMessage } from "./actions";
import { getBaleRuntime } from "./config";
import { beginBaleLink, confirmBaleLink } from "./user-link";
import { completeFromBaleReply, isDoneReply } from "./reply";
import { baleAppOrigin, escapeBale } from "./deliver";
import type { BaleUpdate, BaleMessage } from "./types";

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

  const runtime = await getBaleRuntime();
  if (!runtime.enabled) {
    if (text.startsWith("/")) {
      await sendMessage({
        chat_id: chatId,
        text: "ربات Mindora الان خاموش است. مدیر می‌تواند آن را از پنل روشن کند.",
      });
    }
    return;
  }

  if (isDoneReply(text)) {
    await completeFromBaleReply(chatId, text, message.reply_to_message?.message_id);
    return;
  }

  if (text.startsWith("/start")) {
    await sendWelcomeMessage(chatId, userId, username);
  } else if (text.startsWith("/email")) {
    await handleEmailCommand(chatId, userId, text);
  } else if (text.startsWith("/code")) {
    await handleCodeCommand(chatId, userId, text);
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
  const message = `🤖 *به ربات Mindora خوش آمدید!*

سلام${username ? ` @${username}` : ""}! 👋

برای دریافت اعلان کارها، حساب Mindora را به این ربات وصل کن.

*نحوه اتصال:*
1. \`/email your@email.com\`
2. کد را در پروفایل Mindora ببین و با \`/code 123456\` بفرست.

*دستورات موجود:*
• \`/email <email>\` - شروع اتصال
• \`/code <code>\` - تأیید کدی که در پروفایل دیدی
• \`/link <email>\` - مثل /email
• \`/unlink\` - قطع اتصال
• \`/status\` - بررسی وضعیت اتصال
• \`/help\` - نمایش راهنما`;

  await sendMessage({ chat_id: chatId, text: message, parse_mode: "Markdown" });
}

async function sendHelpMessage(chatId: number): Promise<void> {
  const message = `📋 *دستورات ربات Mindora*

*اتصال حساب:*
• \`/email your@email.com\` - شروع اتصال
• \`/code 123456\` - کد پروفایل
• \`/link your@email.com\` - مثل /email
• \`/unlink\` - قطع اتصال

*اطلاعات:*
• \`/status\` - بررسی وضعیت اتصال حساب
• \`/help\` - نمایش این راهنما

*اعلان‌ها:*
اگر مدیر روشن کرده باشد:
• سپردن، وضعیت، دیدگاه و تغییر سررسید
• یادآوری موعد — روی همان پیام «تمام» بفرست تا کار بسته شود
• خلاصهٔ صبح و یادآوری عادت
• مرور واژه‌ها

رویدادهای کانال، از جمله ثبت ساعت، جداگانه در کانال کارها می‌رود.`;

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

*نام:* ${escapeBale(user.name)}
*ایمیل:* ${escapeBale(user.email)}
*شناسه Mindora:* \`${user.id}\``;

    await sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } else {
    const message = `❌ *حساب متصل نیست*

حساب شما در بله (شناسه: \`${baleUserId}\`) به هیچ حساب Mindora متصل نشده است.

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

  const result = await beginBaleLink(userId, email);

  if (result.success) {
    await sendMessage({
      chat_id: chatId,
      text: `اگر این ایمیل یک عضو فعال باشد، یک کد در پروفایل Mindora ظاهر می‌شود.

آن را با این دستور بفرست:
\`/code 123456\`

کد ۱۵ دقیقه اعتبار دارد.`,
      parse_mode: "Markdown",
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: "این گفتگو از قبل به همین حساب وصل است.",
    });
  }
}

async function handleCodeCommand(
  chatId: number,
  userId: number,
  text: string,
): Promise<void> {
  const code = text.replace(/^\/code\s+/i, "").trim();
  if (!/^\d{6}$/.test(code)) {
    await sendMessage({
      chat_id: chatId,
      text: "کد شش‌رقمی پروفایل را بفرست:\n`/code 123456`",
      parse_mode: "Markdown",
    });
    return;
  }
  const result = await confirmBaleLink(userId, code);
  if (result.success) {
    await sendMessage({
      chat_id: chatId,
      text: `حساب به ${result.name} وصل شد.`,
    });
    return;
  }
  const note =
    result.error === "taken"
      ? "این گفتگو به عضو دیگری وصل است."
      : "کد درست نیست یا منقضی شده. دوباره /email را بفرست.";
  await sendMessage({ chat_id: chatId, text: note });
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
      data: {
        baleUserId: null,
        baleLinkCode: null,
        baleLinkChatId: null,
        baleLinkExpires: null,
      },
    });

    await sendMessage({
      chat_id: chatId,
      text: "✅ *اتصال حساب قطع شد*\n\nاز این پس اعلان‌های Mindora را دریافت نخواهید کرد.\n\nبرای اتصال مجدد، از دستور `/email your@email.com` استفاده کنید.",
      parse_mode: "Markdown",
    });
  } else {
    await sendMessage({
      chat_id: chatId,
      text: "ℹ️ حساب شما در حال حاضر به Mindora متصل نیست.",
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

    const message = `📋 *جزئیات کار*

*شناسه کار:* \`${taskId}\`

[مشاهده کار در Mindora](${baleAppOrigin()}/tasks/${taskId})`;

    await sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  }
}
