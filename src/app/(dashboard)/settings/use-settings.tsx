"use client";

import * as React from "react";
import { updateLanguagePreference } from "@/features/settings/actions";
import type { Language } from "@/types/db";

export function useSettings(initialLanguage: Language) {
  const [language, setLanguage] = React.useState<Language>(initialLanguage);
  const [languagePending, startLanguageTransition] = React.useTransition();
  const [languageSuccess, setLanguageSuccess] = React.useState(false);
  const [languageError, setLanguageError] = React.useState<string | null>(null);

  const onLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setLanguageError(null);
    setLanguageSuccess(false);
    startLanguageTransition(async () => {
      const result = await updateLanguagePreference(newLanguage);
      if (!result.success) {
        setLanguageError(result.error ?? "Failed to update language");
        setLanguage(initialLanguage);
      } else {
        setLanguageSuccess(true);
        setTimeout(() => setLanguageSuccess(false), 2000);
      }
    });
  };

  return {
    language,
    languagePending,
    languageSuccess,
    languageError,
    onLanguageChange,
  };
}
