import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { getTranslations } from "@/i18n";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();

  const preferences = await getUserPreferences(session?.user?.id ?? "");
  const language = preferences?.language ?? "EN";
  const t = getTranslations(language);

  return (
    <div>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-1)",
        }}
      >
        {t.dashboard.title}
      </h1>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
        {t.dashboard.welcome}, {session?.user?.name}.
      </p>
    </div>
  );
}
