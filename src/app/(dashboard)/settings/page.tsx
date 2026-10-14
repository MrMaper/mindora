import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-role";
import { getUserPreferences } from "@/features/settings/queries";
import { getUserById } from "@/features/users/queries";
import { getModuleAccess } from "@/lib/module-guard";
import { SettingsCC } from "./settings-cc";
import type { CapabilitiesData } from "./capabilities-section";
import { parseSettingsTab } from "./settings-tabs";
import type { Language, Theme } from "@/types/db";
import { localizedTitle } from "@/lib/page-title";
import { pendingBaleLink } from "@/features/external/bots/bale/user-link";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("تنظیمات", "Settings");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireAuth();
  const { tab } = await searchParams;

  const [preferences, user, baleLink] = await Promise.all([
    getUserPreferences(session.user.id),
    getUserById(session.user.id),
    pendingBaleLink(session.user.id),
  ]);

  if (!user) notFound();

  const currentLanguage: Language = preferences?.language ?? "FA";
  const currentTheme: Theme = preferences?.theme ?? "SYSTEM";

  const access =
    session.user.role === "ADMIN"
      ? null
      : await getModuleAccess(session.user.id);
  const capabilities: CapabilitiesData | null = access
    ? { policy: access.policy, flags: access.flags }
    : null;

  return (
    <SettingsCC
      capabilities={capabilities}
      currentLanguage={currentLanguage}
      currentTheme={currentTheme}
      preferences={preferences}
      user={user}
      baleCode={baleLink?.code ?? null}
      initialTab={parseSettingsTab(tab)}
    />
  );
}
