export type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance";

const TABS: SettingsTab[] = [
  "profile",
  "security",
  "notifications",
  "appearance",
];

export function parseSettingsTab(raw: string | null | undefined): SettingsTab {
  if (raw && (TABS as string[]).includes(raw)) return raw as SettingsTab;
  return "profile";
}
