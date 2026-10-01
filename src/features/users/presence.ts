import { prisma as db } from "@/lib/db";
import { onlineSecondsToAdd } from "@/lib/presence";

export type LoginMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

/** Record a successful password login + audit row. */
export async function recordUserLogin(
  userId: string,
  meta: LoginMeta = {},
): Promise<void> {
  const now = new Date();
  const ip = meta.ip?.slice(0, 128) || null;
  const userAgent = meta.userAgent?.slice(0, 512) || null;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: now,
        lastSeenAt: now,
      },
    }),
    db.userLoginEvent.create({
      data: {
        userId,
        createdAt: now,
        ip,
        userAgent,
      },
    }),
  ]);
}

/**
 * Heartbeat from an open dashboard tab.
 * Adds elapsed seconds only when the previous pulse was within the online window
 * (so long offline gaps are not counted as session time).
 */
export async function recordUserPresence(userId: string): Promise<void> {
  const now = new Date();
  const row = await db.user.findUnique({
    where: { id: userId },
    select: { lastSeenAt: true },
  });
  if (!row) return;

  const add = onlineSecondsToAdd(row.lastSeenAt, now);
  await db.user.update({
    where: { id: userId },
    data: {
      lastSeenAt: now,
      ...(add > 0 ? { totalOnlineSeconds: { increment: add } } : {}),
    },
  });
}

/** Invalidate all existing JWTs for this user. */
export async function revokeUserSessions(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}
