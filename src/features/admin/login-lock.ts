import { prisma as db } from "@/lib/db";

/** Max failed password attempts before temporary lock. */
export const LOGIN_MAX_FAILURES = 5;
/** Lock duration after hitting the failure cap. */
export const LOGIN_LOCK_MINUTES = 15;

export function isLoginLocked(lockedUntil: Date | null | undefined, now = new Date()) {
  return !!lockedUntil && lockedUntil.getTime() > now.getTime();
}

export async function recordFailedLogin(userId: string): Promise<{
  locked: boolean;
  lockedUntil: Date | null;
  remainingAttempts: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { failedLoginCount: true, lockedUntil: true },
  });
  if (!user) {
    return { locked: false, lockedUntil: null, remainingAttempts: LOGIN_MAX_FAILURES };
  }

  if (isLoginLocked(user.lockedUntil)) {
    return {
      locked: true,
      lockedUntil: user.lockedUntil,
      remainingAttempts: 0,
    };
  }

  const nextCount = user.failedLoginCount + 1;
  if (nextCount >= LOGIN_MAX_FAILURES) {
    const lockedUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000);
    await db.user.update({
      where: { id: userId },
      data: { failedLoginCount: nextCount, lockedUntil },
    });
    return { locked: true, lockedUntil, remainingAttempts: 0 };
  }

  await db.user.update({
    where: { id: userId },
    data: { failedLoginCount: nextCount, lockedUntil: null },
  });
  return {
    locked: false,
    lockedUntil: null,
    remainingAttempts: Math.max(0, LOGIN_MAX_FAILURES - nextCount),
  };
}

export async function clearLoginFailures(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
}

export async function unlockUserLogin(userId: string): Promise<void> {
  await clearLoginFailures(userId);
}
