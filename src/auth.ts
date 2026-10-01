import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma as db } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";
import { recordUserLogin } from "@/features/users/presence";
import {
  clearLoginFailures,
  isLoginLocked,
  recordFailedLogin,
} from "@/features/admin/login-lock";

class AccountLockedError extends CredentialsSignin {
  code = "account_locked";
}

async function loginRequestMeta(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null;
    const userAgent = h.get("user-agent");
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            avatar: true,
            role: true,
            status: true,
            sessionVersion: true,
            failedLoginCount: true,
            lockedUntil: true,
          },
        });

        if (!user?.password || user.status !== "ACTIVE") return null;

        if (isLoginLocked(user.lockedUntil)) {
          throw new AccountLockedError();
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) {
          const fail = await recordFailedLogin(user.id);
          if (fail.locked) throw new AccountLockedError();
          return null;
        }

        await clearLoginFailures(user.id);
        const meta = await loginRequestMeta();
        await recordUserLogin(user.id, meta);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    // NextAuth v5 JWT index signature requires explicit casting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sv = user.sessionVersion ?? 0;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: any) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.sessionVersion =
        typeof token.sv === "number" ? token.sv : 0;
      return session;
    },
  },
});
