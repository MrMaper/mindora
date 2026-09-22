import { prisma as db } from "@/lib/db";

export async function linkBaleUser(baleUserId: number, email: string): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  if (!user) {
    return { success: false, error: "User with this email not found in Mindora" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { baleUserId: String(baleUserId) },
  });

  return { success: true };
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
    data: { baleUserId: null },
  });
}

export async function isBaleLinked(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { baleUserId: true },
  });
  return !!user?.baleUserId;
}