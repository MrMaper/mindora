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

import * as React from "react";

const I18nContext = React.createContext<Language>("FA");

export function I18nProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: Language;
}) {
  return (
    <I18nContext.Provider value={language}>{children}</I18nContext.Provider>
  );
}

export function useLanguage(): Language {
  return React.useContext(I18nContext);
}

export function useTranslation(): Translations {
  return getTranslations(useLanguage());
}

export { en, fa };
