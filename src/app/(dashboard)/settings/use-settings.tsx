"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import {
  localizedZodResolver,
  resolveValidationMessage,
} from "@/lib/validation-message";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import {
  updateUserPreferences,
  type UpdatePreferencesInput,
} from "@/features/settings/actions";
import { applyThemeToDocument } from "@/lib/theme";
import { useTranslation } from "@/i18n/provider";
import type { Language, Theme } from "@/types/db";

export type SettingsTab =
  | "profile"
  | "security"
  | "notifications"
  | "appearance";

const TABS: SettingsTab[] = [
  "profile",
  "security",
  "notifications",
  "appearance",
];

export function parseSettingsTab(raw: string | null | undefined): SettingsTab {
  if (raw && (TABS as string[]).includes(raw)) return raw as SettingsTab;
  return "profile";
}

export function useSettings(
  initialLanguage: Language,
  initialTheme: Theme,
  initialTab: SettingsTab = "profile",
) {
  const router = useRouter();
  const t = useTranslation();

  const [activeTab, setActiveTab] = React.useState<SettingsTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [language, setLanguage] = React.useState<Language>(initialLanguage);
  const [languagePending, startLanguageTransition] = React.useTransition();
  const [languageSuccess, setLanguageSuccess] = React.useState(false);
  const [languageError, setLanguageError] = React.useState<string | null>(null);

  const [theme, setTheme] = React.useState<Theme>(initialTheme);
  const [themePending, startThemeTransition] = React.useTransition();
  const [themeSuccess, setThemeSuccess] = React.useState(false);
  const [themeError, setThemeError] = React.useState<string | null>(null);

  const [passwordPending, startPasswordTransition] = React.useTransition();
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const [notifyPending, startNotifyTransition] = React.useTransition();
  const [notifySuccess, setNotifySuccess] = React.useState(false);
  const [notifyError, setNotifyError] = React.useState<string | null>(null);

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: localizedZodResolver(changePasswordSchema, t),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  React.useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  // When preference is SYSTEM, follow OS changes without remount side-effects.
  React.useEffect(() => {
    if (theme !== "SYSTEM" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeToDocument("SYSTEM");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const onLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setLanguageError(null);
    setLanguageSuccess(false);
    startLanguageTransition(async () => {
      const result = await updateUserPreferences({ language: newLanguage });
      if (!result.success) {
        setLanguageError(
          resolveValidationMessage(
            t,
            result.error ?? t.settings.failedToUpdateLanguage,
          ),
        );
        setLanguage(initialLanguage);
      } else {
        setLanguageSuccess(true);
        router.refresh();
        setTimeout(() => setLanguageSuccess(false), 2000);
      }
    });
  };

  const onThemeChange = (newTheme: Theme) => {
    const previous = theme;
    setTheme(newTheme);
    applyThemeToDocument(newTheme);
    setThemeError(null);
    setThemeSuccess(false);
    startThemeTransition(async () => {
      const result = await updateUserPreferences({ theme: newTheme });
      if (!result.success) {
        setThemeError(
          resolveValidationMessage(t, result.error ?? "genericError"),
        );
        setTheme(previous);
        applyThemeToDocument(previous);
      } else {
        setThemeSuccess(true);
        router.refresh();
        setTimeout(() => setThemeSuccess(false), 2000);
      }
    });
  };

  const onPasswordChange = passwordForm.handleSubmit(async data => {
    setPasswordError(null);
    setPasswordSuccess(false);
    startPasswordTransition(async () => {
      const { changePassword } = await import("@/features/users/actions");
      const fd = new FormData();
      fd.append("currentPassword", data.currentPassword);
      fd.append("password", data.password);
      fd.append("confirmPassword", data.confirmPassword);
      const result = await changePassword(fd);
      if (!result.success) {
        setPasswordError(
          resolveValidationMessage(t, result.error ?? "genericError"),
        );
      } else {
        setPasswordSuccess(true);
        passwordForm.reset();
        setTimeout(() => setPasswordSuccess(false), 2000);
      }
    });
  });

  const onNotifyChange = (
    field: keyof UpdatePreferencesInput,
    value: boolean,
  ): Promise<boolean> => {
    setNotifyError(null);
    setNotifySuccess(false);
    return new Promise(resolve => {
      startNotifyTransition(async () => {
        const result = await updateUserPreferences({
          [field]: value,
        } as UpdatePreferencesInput);
        if (!result.success) {
          setNotifyError(
            resolveValidationMessage(t, result.error ?? "genericError"),
          );
          resolve(false);
        } else {
          setNotifySuccess(true);
          router.refresh();
          setTimeout(() => setNotifySuccess(false), 2000);
          resolve(true);
        }
      });
    });
  };

  return {
    activeTab,
    setActiveTab,
    language,
    languagePending,
    languageSuccess,
    languageError,
    onLanguageChange,
    theme,
    themePending,
    themeSuccess,
    themeError,
    onThemeChange,
    passwordForm: passwordForm as UseFormReturn<ChangePasswordInput>,
    passwordPending,
    passwordSuccess,
    passwordError,
    onPasswordChange,
    notifyPending,
    notifySuccess,
    notifyError,
    onNotifyChange,
  };
}
