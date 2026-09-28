import { randomInt } from "crypto";
import { prisma as db } from "@/lib/db";

const LINK_TTL_MS = 15 * 60 * 1000;

export async function beginBaleLink(
  baleUserId: number,
  email: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await db.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { id: true, role: true, status: true, baleUserId: true },
  });

  const quiet = {
    success: true as const,
  };

  if (!user || user.role === "ADMIN" || user.status !== "ACTIVE") return quiet;

  if (user.baleUserId === String(baleUserId)) {
    return { success: false, error: "already" };
  }

  const code = String(randomInt(100000, 1000000));
  await db.user.update({
    where: { id: user.id },
    data: {
      baleLinkCode: code,
      baleLinkChatId: String(baleUserId),
      baleLinkExpires: new Date(Date.now() + LINK_TTL_MS),
    },
  });
  return quiet;
}

export async function confirmBaleLink(
  baleUserId: number,
  code: string,
): Promise<{ success: true; name: string } | { success: false; error: string }> {
  const chatId = String(baleUserId);
  const normalized = code.trim();
  const user = await db.user.findFirst({
    where: { baleLinkChatId: chatId, baleLinkCode: normalized },
    select: { id: true, name: true, baleLinkExpires: true, role: true, status: true },
  });

  if (
    !user ||
    user.role === "ADMIN" ||
    user.status !== "ACTIVE" ||
    !user.baleLinkExpires ||
    user.baleLinkExpires.getTime() < Date.now()
  ) {
    return { success: false, error: "expired" };
  }

  const taken = await db.user.findFirst({
    where: { baleUserId: chatId, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken) return { success: false, error: "taken" };

  await db.user.update({
    where: { id: user.id },
    data: {
      baleUserId: chatId,
      baleLinkCode: null,
      baleLinkChatId: null,
      baleLinkExpires: null,
    },
  });
  return { success: true, name: user.name };
}

export async function getBaleUserId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { baleUserId: true },
  });
  return user?.baleUserId ?? null;
}

export async function unlinkBaleUser(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      baleUserId: null,
      baleLinkCode: null,
      baleLinkChatId: null,
      baleLinkExpires: null,
    },
  });
}

export async function isBaleLinked(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { baleUserId: true },
  });
  return !!user?.baleUserId;
}

export async function pendingBaleLink(userId: string): Promise<{ code: string; expires: Date } | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { baleLinkCode: true, baleLinkExpires: true },
  });
  if (!user?.baleLinkCode || !user.baleLinkExpires) return null;
  if (user.baleLinkExpires.getTime() < Date.now()) {
    await db.user.update({
      where: { id: userId },
      data: { baleLinkCode: null, baleLinkChatId: null, baleLinkExpires: null },
    });
    return null;
  }
  return { code: user.baleLinkCode, expires: user.baleLinkExpires };
}
