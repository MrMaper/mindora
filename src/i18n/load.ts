import type { Language } from "@/types/db";
import type { Translations } from "./types";

/** Dynamic import — only the requested locale enters the module graph. */
export async function loadTranslations(
  language: Language,
): Promise<Translations> {
  if (language === "FA") {
    const { fa } = await import("./fa");
    return fa;
  }
  const { en } = await import("./en");
  return en;
}

const serverCache = new Map<Language, Translations>();

/** Cached per-process for repeated RSC calls in the same runtime. */
export async function getTranslationsAsync(
  language: Language,
): Promise<Translations> {
  const hit = serverCache.get(language);
  if (hit) return hit;
  const t = await loadTranslations(language);
  serverCache.set(language, t);
  return t;
}
