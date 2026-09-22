"use client";
import type { Translations } from "@/i18n";
import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import { useSettings } from "./use-settings";
import type { Language, Theme } from "@/types/db";
import { UserPreferencesData } from "@/features/settings/queries";
import type { ChangePasswordInput } from "@/schemas/auth";
import type { UseFormReturn } from "react-hook-form";
import type { UpdatePreferencesInput } from "@/features/settings/actions";

type SettingsTab = "profile" | "security" | "notifications" | "appearance";

interface SettingsCCProps {
  currentLanguage: Language;
  currentTheme: Theme;
  preferences: UserPreferencesData | null;
}

export function SettingsCC({ currentLanguage, currentTheme, preferences }: SettingsCCProps) {
  const settings = useSettings(currentLanguage, currentTheme);
  const t = useTranslation();

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "profile", label: t.settings.profile, icon: "user" },
    { id: "security", label: t.settings.security, icon: "shield" },
    { id: "notifications", label: t.settings.notifications, icon: "bell" },
    { id: "appearance", label: t.settings.appearance, icon: "monitor" },
  ];

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <span
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-primary)",
          }}
        >
          {t.settings.title}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--space-1)",
          marginBottom: "var(--space-6)",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "var(--space-3)",
        }}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={settings.activeTab === tab.id}
            onClick={() => settings.setActiveTab(tab.id)}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "transparent",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color:
                settings.activeTab === tab.id
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              cursor: settings.activeTab === tab.id ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
            disabled={settings.activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${settings.activeTab}`}>
        {settings.activeTab === "profile" && (
          <ProfileSettingsSection
            t={t}
            language={settings.language}
            onLanguageChange={settings.onLanguageChange}
            languagePending={settings.languagePending}
            languageSuccess={settings.languageSuccess}
            languageError={settings.languageError}
          />
        )}
        {settings.activeTab === "security" && (
          <SecuritySettingsSection
            t={t}
            passwordPending={settings.passwordPending}
            passwordSuccess={settings.passwordSuccess}
            passwordError={settings.passwordError}
            onPasswordChange={settings.onPasswordChange}
            passwordForm={settings.passwordForm}
          />
        )}
        {settings.activeTab === "notifications" && (
          <NotificationSettingsSection
            t={t}
            preferences={preferences}
            notifyPending={settings.notifyPending}
            notifySuccess={settings.notifySuccess}
            notifyError={settings.notifyError}
            onNotifyChange={settings.onNotifyChange}
          />
        )}
        {settings.activeTab === "appearance" && (
          <AppearanceSettingsSection
            t={t}
            theme={settings.theme}
            themePending={settings.themePending}
            themeSuccess={settings.themeSuccess}
            themeError={settings.themeError}
            onThemeChange={settings.onThemeChange}
          />
        )}
      </div>
    </div>
  );
}

function ProfileSettingsSection({
  t,
  language,
  onLanguageChange,
  languagePending,
  languageSuccess,
  languageError,
}: {
  t: Translations;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  languagePending: boolean;
  languageSuccess: boolean;
  languageError: string | null;
}) {
  const languages: Array<{ value: Language; label: string }> = [
    { value: "EN", label: t.settings.english },
    { value: "FA", label: t.settings.persian },
  ];

  return (
    <section style={{ marginBottom: "var(--space-8)" }}>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          marginBottom: "var(--space-4)",
        }}
      >
        {t.settings.preferences}
      </div>

      <div
        style={{
          paddingBottom: "var(--space-6)",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "var(--space-6)",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--text-primary)",
            marginBottom: "var(--space-3)",
          }}
        >
          {t.settings.language}
        </label>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            marginBottom: "var(--space-3)",
          }}
        >
          {t.settings.languageDescription}
        </p>

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => onLanguageChange(lang.value)}
              disabled={languagePending}
              style={{
                flex: 1,
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                border:
                  language === lang.value
                    ? "2px solid var(--blue-500)"
                    : "1px solid var(--border-subtle)",
                backgroundColor:
                  language === lang.value
                    ? "var(--blue-50)"
                    : "var(--surface-default)",
                color:
                  language === lang.value
                    ? "var(--blue-600)"
                    : "var(--text-primary)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-medium)",
                cursor: languagePending ? "not-allowed" : "pointer",
                opacity: languagePending ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {languageError && (
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--red-500)",
              marginTop: "var(--space-2)",
            }}
            role="alert"
          >
            {languageError}
          </p>
        )}

        {languageSuccess && (
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--green-600)",
              marginTop: "var(--space-2)",
            }}
            role="status"
          >
            ✓ {t.settings.languageUpdated}
          </p>
        )}
      </div>
    </section>
  );
}

function SecuritySettingsSection({
  t,
  passwordPending,
  passwordSuccess,
  passwordError,
  onPasswordChange,
  passwordForm,
}: {
  t: Translations;
  passwordPending: boolean;
  passwordSuccess: boolean;
  passwordError: string | null;
  onPasswordChange: (e: React.FormEvent) => void;
  passwordForm: UseFormReturn<ChangePasswordInput>;
}) {
  return (
    <section>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          marginBottom: "var(--space-4)",
        }}
      >
        {t.settings.security}
      </div>

      <form
        onSubmit={onPasswordChange}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
        noValidate
      >
        {passwordError && (
          <div
            className="auth-card__alert auth-card__alert--error"
            role="alert"
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--red-tint)",
              border: "1px solid var(--red-500)",
              color: "var(--red-600)",
              fontSize: "var(--text-sm)",
            }}
          >
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div
            className="auth-card__alert auth-card__alert--success"
            role="status"
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--green-tint)",
              border: "1px solid var(--green-500)",
              color: "var(--green-600)",
              fontSize: "var(--text-sm)",
            }}
          >
            {t.settings.passwordChanged}
          </div>
        )}

        <div>
          <label
            style={{
              display: "block",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            {t.profile.currentPassword}
          </label>
          <input
            {...passwordForm.register("currentPassword")}
            type="password"
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "var(--surface-default)",
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
            }}
            disabled={passwordPending}
          />
          {passwordForm.formState.errors.currentPassword && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--red-500)",
                marginTop: "var(--space-1)",
              }}
            >
              {passwordForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            {t.profile.newPassword}
          </label>
          <input
            {...passwordForm.register("password")}
            type="password"
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "var(--surface-default)",
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
            }}
            disabled={passwordPending}
          />
          {passwordForm.formState.errors.password && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--red-500)",
                marginTop: "var(--space-1)",
              }}
            >
              {passwordForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            {t.profile.confirmNewPassword}
          </label>
          <input
            {...passwordForm.register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "var(--surface-default)",
              color: "var(--text-primary)",
              fontSize: "var(--text-sm)",
            }}
            disabled={passwordPending}
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--red-500)",
                marginTop: "var(--space-1)",
              }}
            >
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--action-primary)",
              color: "var(--text-on-brand)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              cursor: passwordPending ? "not-allowed" : "pointer",
              opacity: passwordPending ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
            disabled={passwordPending}
          >
            {passwordPending ? t.common.loading : t.profile.changePasswordSubmit}
          </button>
        </div>
      </form>
    </section>
  );
}

function NotificationSettingsSection({
  t,
  preferences,
  notifyPending,
  notifySuccess,
  notifyError,
  onNotifyChange,
}: {
  t: Translations;
  preferences: UserPreferencesData | null;
  notifyPending: boolean;
  notifySuccess: boolean;
  notifyError: string | null;
  onNotifyChange: (field: keyof UpdatePreferencesInput, value: boolean) => void;
}) {
  const notifyPrefs = [
    { key: "notifications", label: t.settings.masterNotifications },
    { key: "emailNotifs", label: t.settings.emailNotifs },
    { key: "soundNotifs", label: t.settings.soundNotifs },
    { key: "notifyTaskAssigned", label: t.settings.notifyTaskAssigned },
    { key: "notifyTaskUpdated", label: t.settings.notifyTaskUpdated },
    { key: "notifyTaskCommented", label: t.settings.notifyTaskCommented },
    { key: "notifyMention", label: t.settings.notifyMention },
    { key: "notifySprintStarted", label: t.settings.notifySprintStarted },
    { key: "notifySprintEnded", label: t.settings.notifySprintEnded },
    { key: "notifyDeadlineApproaching", label: t.settings.notifyDeadlineApproaching },
    { key: "notifyStatusChanged", label: t.settings.notifyStatusChanged },
  ] as const;

  return (
    <section>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          marginBottom: "var(--space-4)",
        }}
      >
        {t.settings.notifications}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {notifyPrefs.map((pref) => (
          <label
            key={pref.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-default)",
              border: "1px solid var(--border-subtle)",
              cursor: notifyPending ? "not-allowed" : "pointer",
              opacity: notifyPending ? 0.6 : 1,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
              {pref.label}
            </span>
            <input
              type="checkbox"
              checked={
                (preferences?.[
                  pref.key as keyof UserPreferencesData
                ] as boolean | undefined) ??
                (pref.key === "soundNotifs" ? false : true)
              }
              onChange={(e) => onNotifyChange(pref.key, e.target.checked)}
              disabled={notifyPending}
              style={{
                width: 20,
                height: 20,
                accentColor: "var(--action-primary)",
              }}
            />
          </label>
        ))}
      </div>

      {notifyError && (
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--red-500)",
            marginTop: "var(--space-2)",
          }}
          role="alert"
        >
          {notifyError}
        </p>
      )}

      {notifySuccess && (
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--green-600)",
            marginTop: "var(--space-2)",
          }}
          role="status"
        >
          ✓ {t.settings.preferencesSaved}
        </p>
      )}
    </section>
  );
}

function AppearanceSettingsSection({
  t,
  theme,
  themePending,
  themeSuccess,
  themeError,
  onThemeChange,
}: {
  t: Translations;
  theme: Theme;
  themePending: boolean;
  themeSuccess: boolean;
  themeError: string | null;
  onThemeChange: (theme: Theme) => void;
}) {
  const themes: Array<{ value: Theme; label: string; description: string }> = [
    { value: "LIGHT", label: t.settings.themeLight, description: t.settings.themeLightDesc },
    { value: "DARK", label: t.settings.themeDark, description: t.settings.themeDarkDesc },
    { value: "SYSTEM", label: t.settings.themeSystem, description: t.settings.themeSystemDesc },
  ];

  return (
    <section>
      <div
        style={{
          fontSize: "var(--text-2xs)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          marginBottom: "var(--space-4)",
        }}
      >
        {t.settings.appearance}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {themes.map((tItem) => (
          <button
            key={tItem.value}
            onClick={() => onThemeChange(tItem.value)}
            disabled={themePending}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              border:
                theme === tItem.value
                  ? "2px solid var(--blue-500)"
                  : "1px solid var(--border-subtle)",
              backgroundColor:
                theme === tItem.value
                  ? "var(--blue-50)"
                  : "var(--surface-default)",
              cursor: themePending ? "not-allowed" : "pointer",
              opacity: themePending ? 0.6 : 1,
              transition: "all 0.15s ease",
              textAlign: "left",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  color:
                    theme === tItem.value
                      ? "var(--blue-600)"
                      : "var(--text-primary)",
                }}
              >
                {tItem.label}
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                }}
              >
                {tItem.description}
              </div>
            </div>
            {theme === tItem.value && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--blue-500)",
                  color: "white",
                  fontSize: "12px",
                }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      {themeError && (
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--red-500)",
            marginTop: "var(--space-2)",
          }}
          role="alert"
        >
          {themeError}
        </p>
      )}

      {themeSuccess && (
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--green-600)",
            marginTop: "var(--space-2)",
          }}
          role="status"
        >
          ✓ {t.settings.themeUpdated}
        </p>
      )}
    </section>
  );
}