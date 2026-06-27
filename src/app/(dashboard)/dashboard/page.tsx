import type { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
        Dashboard
      </h1>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
        Welcome back, {session?.user?.name}.
      </p>
    </div>
  );
}
