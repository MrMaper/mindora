import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";

export type ActiveSessionUser = {
  id: string;
  role?: string;
  sessionVersion?: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type ActiveSession = {
  user: ActiveSessionUser;
};

/**
 * Session that is still valid against the current DB user row
 * (active status + force-logout sessionVersion).
 */
export async function requireActiveSession(): Promise<ActiveSession | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !session?.user) return null;

  const account = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, sessionVersion: true },
  });
  if (!account || account.status !== "ACTIVE") return null;

  const tokenSv =
    typeof session.user.sessionVersion === "number"
      ? session.user.sessionVersion
      : 0;
  if (account.sessionVersion !== tokenSv) return null;

  return {
    user: {
      id: userId,
      role: session.user.role,
      sessionVersion: tokenSv,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}
