import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MEMBER";
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "MEMBER";
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "MEMBER";
    sv?: number;
  }
}
