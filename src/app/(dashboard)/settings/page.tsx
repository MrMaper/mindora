import type { Metadata } from "next";
import { requireAuth } from "@/lib/require-role";
import { getUserPreferences } from "@/features/settings/queries";
import { SettingsCC } from "./settings-cc";
import type { Language, Theme } from "@/types/db";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireAuth();
  const preferences = await getUserPreferences(session.user.id);

  const currentLanguage: Language = preferences?.language ?? "FA";
  const currentTheme: Theme = preferences?.theme ?? "SYSTEM";

  return <SettingsCC currentLanguage={currentLanguage} currentTheme={currentTheme} preferences={preferences} />;
}
