/** Lightweight UA summary for security / login history UI (no deps). */

export type UserAgentSummary = {
  label: string;
  browser: string;
  os: string;
};

function pick(
  ua: string,
  patterns: Array<[RegExp, string]>,
  fallback: string,
): string {
  for (const [re, name] of patterns) {
    if (re.test(ua)) return name;
  }
  return fallback;
}

export function summarizeUserAgent(
  ua: string | null | undefined,
  language: "FA" | "EN" = "FA",
): UserAgentSummary {
  const empty =
    language === "EN" ? "Unknown device" : "دستگاه ناشناس";
  if (!ua?.trim()) {
    return { label: empty, browser: empty, os: empty };
  }

  const browser = pick(
    ua,
    [
      [/Edg\//i, "Edge"],
      [/OPR\/|Opera/i, "Opera"],
      [/SamsungBrowser/i, "Samsung Internet"],
      [/Chrome\//i, "Chrome"],
      [/CriOS\//i, "Chrome"],
      [/Firefox\//i, "Firefox"],
      [/FxiOS\//i, "Firefox"],
      [/Safari\//i, "Safari"],
    ],
    language === "EN" ? "Browser" : "مرورگر",
  );

  const os = pick(
    ua,
    [
      [/Android/i, "Android"],
      [/iPhone|iPad|iPod/i, "iOS"],
      [/Windows NT/i, "Windows"],
      [/Mac OS X|Macintosh/i, "macOS"],
      [/CrOS/i, "ChromeOS"],
      [/Linux/i, "Linux"],
    ],
    language === "EN" ? "OS" : "سیستم‌عامل",
  );

  return {
    browser,
    os,
    label: `${browser} · ${os}`,
  };
}
