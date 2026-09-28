"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import {
  callBale,
  expectedWebhookUrl,
  getBaleRuntime,
  saveBaleConfig,
  type BaleSettingsInput,
} from "@/features/external/bots/bale/config";
import { deliverBale } from "@/features/external/bots/bale/deliver";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

function refresh() {
  revalidatePath("/bale-bot");
}

export async function saveBaleSettings(input: BaleSettingsInput) {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "forbidden" };
  await saveBaleConfig(input);
  refresh();
  return { success: true as const };
}

export async function setBaleWebhook() {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "forbidden" };
  const url = expectedWebhookUrl();
  if (!url) return { success: false as const, error: "no-app-url" };
  const runtime = await getBaleRuntime();
  if (!runtime.token) return { success: false as const, error: "no-token" };
  const result = await callBale<boolean>("setWebhook", { url });
  if (result.error) return { success: false as const, error: result.error };
  refresh();
  return { success: true as const, url };
}

export async function deleteBaleWebhook() {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "forbidden" };
  const runtime = await getBaleRuntime();
  if (!runtime.token) return { success: false as const, error: "no-token" };
  const result = await callBale<boolean>("deleteWebhook", { drop_pending_updates: false });
  if (result.error) return { success: false as const, error: result.error };
  refresh();
  return { success: true as const };
}

export async function sendBaleTestMessage(chatId: string, text: string) {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "forbidden" };
  const runtime = await getBaleRuntime();
  const target = chatId.trim() || runtime.adminChatId;
  if (!runtime.token) return { success: false as const, error: "no-token" };
  if (!target) return { success: false as const, error: "no-chat" };
  if (!text.trim()) return { success: false as const, error: "no-text" };
  const ok = await deliverBale({ chatId: target, text: text.trim(), kind: "test" });
  if (!ok) return { success: false as const, error: "send-failed" };
  return { success: true as const };
}

export async function setMemberBaleId(userId: string, baleUserId: string) {
  const session = await requireAdmin();
  if (!session) return { success: false as const, error: "forbidden" };
  const next = baleUserId.trim();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || user.role === "ADMIN") return { success: false as const, error: "not-found" };

  if (next) {
    const taken = await db.user.findFirst({
      where: { baleUserId: next, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) return { success: false as const, error: "taken" };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      baleUserId: next || null,
      baleLinkCode: null,
      baleLinkChatId: null,
      baleLinkExpires: null,
    },
  });
  refresh();
  return { success: true as const };
}

export async function listBaleMembers() {
  const session = await requireAdmin();
  if (!session) return [];
  return db.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, baleUserId: true, status: true },
  });
}
