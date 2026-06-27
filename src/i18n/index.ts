import { en } from "./en";
import { fa } from "./fa";
import type { Language } from "@/types/db";

export type Translations = typeof en;

const translations: Record<Language, Translations> = {
  EN: en,
  FA: fa,
};

export function getTranslations(language: Language): Translations {
  return translations[language] || en;
}

export { en, fa };
