"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import {
  updateUserPreferences,
  type UpdatePreferencesInput,
} from "@/features/settings/actions";
import type { Language, Theme } from "@/types/db";

export function useSettings(
  initialLanguage: Language,
  initialTheme: Theme,
) {
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<
    "profile" | "security" | "notifications" | "appearance"
  >("profile");

  // Language state
  const [language, setLanguage] = React.useState<Language>(initialLanguage);
  const [languagePending, startLanguageTransition] = React.useTransition();
  const [languageSuccess, setLanguageSuccess] = React.useState(false);
  const [languageError, setLanguageError] = React.useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = React.useState<Theme>(initialTheme);
  const [themePending, startThemeTransition] = React.useTransition();
  const [themeSuccess, setThemeSuccess] = React.useState(false);
  const [themeError, setThemeError] = React.useState<string | null>(null);

  // Password state
  const [passwordPending, startPasswordTransition] = React.useTransition();
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Notification state
  const [notifyPending, startNotifyTransition] = React.useTransition();
  const [notifySuccess, setNotifySuccess] = React.useState(false);
  const [notifyError, setNotifyError] = React.useState<string | null>(null);

  // Password form
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: localizedZodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setLanguageError(null);
    setLanguageSuccess(false);
    startLanguageTransition(async () => {
      const result = await updateUserPreferences({ language: newLanguage });
      if (!result.success) {
        setLanguageError(result.error ?? "Failed to update language");
        setLanguage(initialLanguage);
      } else {
        setLanguageSuccess(true);
        router.refresh();
        setTimeout(() => setLanguageSuccess(false), 2000);
      }
    });
  };

  const onThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeError(null);
    setThemeSuccess(false);
    startThemeTransition(async () => {
      const result = await updateUserPreferences({ theme: newTheme });
      if (!result.success) {
        setThemeError(result.error ?? "Failed to update theme");
        setTheme(initialTheme);
      } else {
        setThemeSuccess(true);
        router.refresh();
        setTimeout(() => setThemeSuccess(false), 2000);
      }
    });
  };

  const onPasswordChange = passwordForm.handleSubmit(async (data) => {
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
        setPasswordError(result.error ?? "Failed to change password");
      } else {
        setPasswordSuccess(true);
        passwordForm.reset();
        setTimeout(() => setPasswordSuccess(false), 2000);
      }
    });
  });

  const onNotifyChange = (field: keyof UpdatePreferencesInput, value: boolean) => {
    setNotifyError(null);
    setNotifySuccess(false);
    startNotifyTransition(async () => {
      const result = await updateUserPreferences({ [field]: value } as UpdatePreferencesInput);
      if (!result.success) {
        setNotifyError(result.error ?? "Failed to update notification preference");
      } else {
        setNotifySuccess(true);
        router.refresh();
        setTimeout(() => setNotifySuccess(false), 2000);
      }
    });
  };

  function applyTheme(themeValue: Theme) {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (themeValue === "SYSTEM") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", themeValue.toLowerCase());
    }
  }

  // Apply theme on mount and change
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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