export function formatBytes(bytes: number, language: "FA" | "EN" = "FA"): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units =
    language === "FA"
      ? ["بایت", "کیلوبایت", "مگابایت", "گیگابایت", "ترابایت"]
      : ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const value = i === 0 ? String(Math.round(n)) : n.toFixed(n >= 10 ? 0 : 1);
  return `${value} ${units[i]}`;
}
