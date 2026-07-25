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
