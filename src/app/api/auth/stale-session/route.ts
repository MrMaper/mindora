import { signOut } from "@/auth";

/** Clears a stale JWT when the user row is gone (RSC cannot mutate cookies). */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
