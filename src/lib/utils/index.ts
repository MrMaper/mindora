import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PERSIAN_DIGITS } from "../constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: string | number,
  language: "FA" | "EN",
): string {
  const str = String(value);
  if (language === "EN") return str;
  return str.replace(/\d/g, d => PERSIAN_DIGITS[parseInt(d)]);
}

/** e.g. FA «۰٫۰ ساعت», EN «0.0h» */
export function formatHours(
  hours: number,
  language: "FA" | "EN",
  digits = 1,
): string {
  const raw =
    Number.isInteger(hours) && digits === 0
      ? String(hours)
      : hours.toFixed(digits);
  let num = formatNumber(raw, language);
  if (language === "FA") {
    num = num.replace(/\./g, "٫");
    return `${num} ساعت`;
  }
  return `${num}h`;
}
