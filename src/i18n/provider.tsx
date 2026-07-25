"use client";

import * as React from "react";
import type { Language } from "@/types/db";
import { getTranslations, Translations } from ".";

export const I18nContext = React.createContext<Language>("FA");

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
