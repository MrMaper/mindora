"use client";

import * as React from "react";
import type { Language } from "@/types/db";

const SelectLanguageContext = React.createContext<Language | null>(null);

export function SelectProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: Language;
}) {
  return (
    <SelectLanguageContext.Provider value={language}>
      {children}
    </SelectLanguageContext.Provider>
  );
}

export function useSelectLanguage(): Language {
  const ctx = React.useContext(SelectLanguageContext);
  if (!ctx)
    throw new Error("useSelectLanguage must be used within SelectProvider");
  return ctx;
}
