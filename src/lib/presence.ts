/** Considered online if last heartbeat was within this window. */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

/** Client beacon interval while the dashboard tab is visible. */
export const PRESENCE_HEARTBEAT_MS = 60_000;

export function isUserOnline(
  lastSeenAt: Date | string | null | undefined,
  now = new Date(),
): boolean {
  if (!lastSeenAt) return false;
  const seen =
    typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  if (Number.isNaN(seen.getTime())) return false;
  return now.getTime() - seen.getTime() <= ONLINE_WINDOW_MS;
}

/** Seconds to add for a heartbeat given previous lastSeenAt. */
export function onlineSecondsToAdd(
  lastSeenAt: Date | null | undefined,
  now = new Date(),
): number {
  if (!lastSeenAt) return 0;
  const gapMs = now.getTime() - lastSeenAt.getTime();
  if (gapMs <= 0 || gapMs > ONLINE_WINDOW_MS) return 0;
  return Math.floor(gapMs / 1000);
}

export function formatOnlineDuration(
  totalSeconds: number,
  language: "FA" | "EN",
): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (language === "FA") {
    if (hours <= 0 && minutes <= 0) return "کمتر از ۱ دقیقه";
    if (hours <= 0) return `${minutes} دقیقه`;
    if (minutes <= 0) return `${hours} ساعت`;
    return `${hours} ساعت و ${minutes} دقیقه`;
  }
  if (hours <= 0 && minutes <= 0) return "< 1 min";
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatPresenceInstant(
  value: Date | string | null | undefined,
  language: "FA" | "EN",
): string {
  if (!value) return language === "FA" ? "—" : "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const locale = language === "FA" ? "fa-IR" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
