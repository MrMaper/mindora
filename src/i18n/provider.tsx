"use client";

import * as React from "react";
import type { Language } from "@/types/db";
import type { Translations } from "./types";

const I18nContext = React.createContext<{
  language: Language;
  t: Translations;
} | null>(null);

export function I18nProvider({
  children,
  language,
  translations,
}: {
  children: React.ReactNode;
  language: Language;
  translations: Translations;
}) {
  return (
    <I18nContext.Provider value={{ language, t: translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLanguage(): Language {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useLanguage must be used within I18nProvider");
  return ctx.language;
}

export function useTranslation(): Translations {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx.t;
}
