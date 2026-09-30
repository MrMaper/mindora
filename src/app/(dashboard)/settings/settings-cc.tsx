"use client";

import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import type { Translations } from "@/i18n";
import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { useSettings } from "./use-settings";
import type { SettingsTab } from "./settings-tabs";
import { useProfile } from "../profile/use-profile";
import type { Language, Theme } from "@/types/db";
import type { UserPreferencesData } from "@/features/settings/queries";
import type { ChangePasswordInput } from "@/schemas/auth";
import type { UseFormReturn } from "react-hook-form";
import {
  updateBaleSchedule,
  type UpdatePreferencesInput,
} from "@/features/settings/actions";
import type { UserRow } from "@/features/users/types";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";

interface SettingsCCProps {
  currentLanguage: Language;
  currentTheme: Theme;
  preferences: UserPreferencesData | null;
  user: UserRow;
  baleCode?: string | null;
  initialTab?: SettingsTab;
}

export function SettingsCC({
  currentLanguage,
  currentTheme,
  preferences,
  user,
  baleCode,
  initialTab = "profile",
}: SettingsCCProps) {
  const settings = useSettings(currentLanguage, currentTheme, initialTab);
  const t = useTranslation();
  const router = useRouter();

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "profile", label: t.settings.profile },
    { id: "security", label: t.settings.security },
    { id: "notifications", label: t.settings.notifications },
    { id: "appearance", label: t.settings.appearance },
  ];

  const selectTab = (id: SettingsTab) => {
    settings.setActiveTab(id);
    router.replace(`/settings?tab=${id}`, { scroll: false });
  };

  return (
    <div style={{ maxWidth: 720 }} className="min-w-0 w-full overflow-x-hidden">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
        className="flex-wrap"
      >
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
          flexWrap: "wrap",
        }}
        role="tablist"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={settings.activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
            style={{
              padding: "var(--space-2) var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: "none",
              background:
                settings.activeTab === tab.id
                  ? "var(--surface-sunken, var(--surface-default))"
                  : "transparent",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)",
              color:
                settings.activeTab === tab.id
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              cursor: settings.activeTab === tab.id ? "default" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${settings.activeTab}`}>
        {settings.activeTab === "profile" && (
          <ProfileSettingsSection t={t} user={user} baleCode={baleCode} />
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
            language={settings.language}
            onLanguageChange={settings.onLanguageChange}
            languagePending={settings.languagePending}
            languageSuccess={settings.languageSuccess}
            languageError={settings.languageError}
          />
        )}
      </div>
    </div>
  );
}

function ProfileSettingsSection({
  t,
  user,
  baleCode,
}: {
  t: Translations;
  user: UserRow;
  baleCode?: string | null;
}) {
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const p = useProfile(user.id, user.name);

  return (
    <section>
      {baleCode ? (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <div
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-semibold)",
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            {t.profile.baleCodeTitle}
          </div>
          <p
            style={{
              fontSize: "var(--text-xl)",
              letterSpacing: "0.2em",
              color: "var(--text-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            {baleCode}
          </p>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {t.profile.baleCodeHint}
          </p>
        </div>
      ) : null}

      <div style={{ marginBottom: "var(--space-8)" }}>
        <div
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            marginBottom: "var(--space-3)",
          }}
        >
          {t.profile.avatar}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <Avatar name={user.name} src={user.avatar ?? undefined} size="xl" />
          <div>
            <Button
              variant="secondary"
              size="sm"
              loading={p.avatarPending}
              onClick={() => avatarInputRef.current?.click()}
            >
              {t.profile.changeAvatar}
            </Button>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
                marginTop: "var(--space-1)",
              }}
            >
              {t.profile.avatarHint}
            </p>
            {p.avatarError && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--red-500)",
                  marginTop: "var(--space-1)",
                }}
              >
                {p.avatarError}
              </p>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={p.onAvatarChange}
          />
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-caps)",
            color: "var(--text-secondary)",
            marginBottom: "var(--space-4)",
          }}
        >
          {t.profile.personalInfo}
        </div>

        <form
          onSubmit={p.onProfileSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
          noValidate
        >
          {p.profileError && (
            <div
              className="auth-card__alert auth-card__alert--error"
              role="alert"
            >
              <ResolvedValidationText text={p.profileError} />
            </div>
          )}
          {p.profileSuccess && (
            <div
              className="auth-card__alert auth-card__alert--success"
              role="status"
            >
              {t.profile.changesSaved}
            </div>
          )}
          <Controller
            name="name"
            control={p.profileForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label={t.profile.fullName}
                error={fieldState.error?.message}
              />
            )}
          />
          <Input
            label={t.profile.email}
            value={user.email}
            disabled
            hint={t.profile.emailCannotBeChanged}
          />
          <div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={p.profilePending}
            >
              {t.profile.updateProfile}
            </Button>
          </div>
        </form>
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
            <ResolvedValidationText text={passwordError} />
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
              <ResolvedValidationText
                text={passwordForm.formState.errors.currentPassword.message}
              />
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
              <ResolvedValidationText
                text={passwordForm.formState.errors.password.message}
              />
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
              <ResolvedValidationText
                text={passwordForm.formState.errors.confirmPassword.message}
              />
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

function BaleHours({
  digestHour,
  habitHour,
  digestLabel,
  habitLabel,
  hint,
  saveLabel,
  savedLabel,
}: {
  digestHour: number;
  habitHour: number;
  digestLabel: string;
  habitLabel: string;
  hint: string;
  saveLabel: string;
  savedLabel: string;
}) {
  const [digest, setDigest] = React.useState(String(digestHour));
  const [habit, setHabit] = React.useState(String(habitHour));
  const [note, setNote] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setDigest(String(digestHour));
    setHabit(String(habitHour));
  }, [digestHour, habitHour]);

  return (
    <div style={{ marginTop: "var(--space-6)" }}>
      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-secondary)",
          marginBottom: "var(--space-3)",
        }}
      >
        {hint}
      </p>
      <div
        style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}
      >
        <label
          style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}
        >
          {digestLabel}
          <select
            value={digest}
            onChange={event => setDigest(event.target.value)}
            style={{ display: "block", marginTop: "var(--space-1)" }}
          >
            {HOURS.map(hour => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
        <label
          style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}
        >
          {habitLabel}
          <select
            value={habit}
            onChange={event => setHabit(event.target.value)}
            style={{ display: "block", marginTop: "var(--space-1)" }}
          >
            {HOURS.map(hour => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateBaleSchedule(
              Number(digest),
              Number(habit),
            );
            setNote(result.success ? savedLabel : (result.error ?? savedLabel));
          })
        }
        style={{
          marginTop: "var(--space-3)",
          padding: "var(--space-2) var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-default)",
          background: "var(--surface-default)",
          color: "var(--text-primary)",
          cursor: "pointer",
        }}
      >
        {saveLabel}
      </button>
      {note ? (
        <p
          style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}
          role="status"
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour));

function defaultNotifyValue(
  key: string,
  preferences: UserPreferencesData | null,
): boolean {
  const fromPrefs = preferences?.[key as keyof UserPreferencesData];
  if (typeof fromPrefs === "boolean") return fromPrefs;
  return key === "soundNotifs" || key === "batchDeadlineReminders"
    ? false
    : true;
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
  onNotifyChange: (
    field: keyof UpdatePreferencesInput,
    value: boolean,
  ) => Promise<boolean>;
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
    {
      key: "notifyDeadlineApproaching",
      label: t.settings.notifyDeadlineApproaching,
    },
    {
      key: "batchDeadlineReminders",
      label: t.settings.batchDeadlineReminders,
      hint: t.settings.batchDeadlineRemindersHint,
    },
    { key: "notifyStatusChanged", label: t.settings.notifyStatusChanged },
  ] as const;

  const [localPrefs, setLocalPrefs] = React.useState(() => {
    const next: Record<string, boolean> = {};
    for (const pref of notifyPrefs) {
      next[pref.key] = defaultNotifyValue(pref.key, preferences);
    }
    return next;
  });

  React.useEffect(() => {
    setLocalPrefs(prev => {
      const next = { ...prev };
      for (const pref of notifyPrefs) {
        next[pref.key] = defaultNotifyValue(pref.key, preferences);
      }
      return next;
    });
  }, [preferences]);

  const masterOn = localPrefs.notifications !== false;

  const [browserPerm, setBrowserPerm] = React.useState<string>("unsupported");
  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPerm("unsupported");
      return;
    }
    setBrowserPerm(Notification.permission);
  }, []);

  return (
    <section className="min-w-0 overflow-x-hidden">
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

      {browserPerm !== "unsupported" ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-default)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "var(--space-3)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-primary)",
              }}
            >
              {t.settings.browserReminders}
            </div>
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
                marginTop: 4,
              }}
            >
              {t.settings.browserRemindersHint}
            </div>
          </div>
          <button
            type="button"
            disabled={browserPerm === "granted"}
            onClick={async () => {
              const next = await Notification.requestPermission();
              setBrowserPerm(next);
            }}
            style={{
              flexShrink: 0,
              fontSize: "var(--text-xs)",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background:
                browserPerm === "granted"
                  ? "var(--action-primary)"
                  : "transparent",
              color:
                browserPerm === "granted" ? "#fff" : "var(--text-primary)",
              cursor: browserPerm === "granted" ? "default" : "pointer",
            }}
          >
            {browserPerm === "granted"
              ? t.settings.browserRemindersOn
              : t.settings.browserRemindersEnable}
          </button>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        {notifyPrefs.map(pref => {
          const isMaster = pref.key === "notifications";
          const disabled = notifyPending || (!isMaster && !masterOn);
          return (
            <label
              key={pref.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                background: "var(--surface-default)",
                border: "1px solid var(--border-subtle)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.55 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-primary)",
                  }}
                >
                  {pref.label}
                </span>
                {"hint" in pref && pref.hint ? (
                  <span
                    style={{
                      display: "block",
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                      marginTop: 4,
                    }}
                  >
                    {pref.hint}
                  </span>
                ) : null}
              </span>
              <input
                type="checkbox"
                checked={localPrefs[pref.key] ?? false}
                onChange={async e => {
                  const value = e.target.checked;
                  const previous = localPrefs[pref.key] ?? false;
                  setLocalPrefs(prev => ({ ...prev, [pref.key]: value }));
                  const ok = await onNotifyChange(pref.key, value);
                  if (!ok) {
                    setLocalPrefs(prev => ({ ...prev, [pref.key]: previous }));
                  }
                }}
                disabled={disabled}
                style={{
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  accentColor: "var(--action-primary)",
                }}
              />
            </label>
          );
        })}
      </div>

      <BaleHours
        digestHour={preferences?.baleDigestHour ?? 8}
        habitHour={preferences?.baleHabitHour ?? 21}
        digestLabel={t.settings.baleDigestHour}
        habitLabel={t.settings.baleHabitHour}
        hint={t.settings.baleHoursHint}
        saveLabel={t.settings.baleHoursSave}
        savedLabel={t.settings.baleHoursSaved}
      />

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
  language,
  onLanguageChange,
  languagePending,
  languageSuccess,
  languageError,
}: {
  t: Translations;
  theme: Theme;
  themePending: boolean;
  themeSuccess: boolean;
  themeError: string | null;
  onThemeChange: (theme: Theme) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  languagePending: boolean;
  languageSuccess: boolean;
  languageError: string | null;
}) {
  const themes: Array<{ value: Theme; label: string; description: string }> = [
    {
      value: "LIGHT",
      label: t.settings.themeLight,
      description: t.settings.themeLightDesc,
    },
    {
      value: "DARK",
      label: t.settings.themeDark,
      description: t.settings.themeDarkDesc,
    },
    {
      value: "SYSTEM",
      label: t.settings.themeSystem,
      description: t.settings.themeSystemDesc,
    },
  ];

  const languages: Array<{ value: Language; label: string }> = [
    { value: "EN", label: t.settings.english },
    { value: "FA", label: t.settings.persian },
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
          marginBottom: "var(--space-8)",
        }}
      >
        {themes.map(tItem => (
          <button
            key={tItem.value}
            type="button"
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
            marginBottom: "var(--space-4)",
          }}
          role="status"
        >
          ✓ {t.settings.themeUpdated}
        </p>
      )}

      <div
        style={{
          paddingTop: "var(--space-6)",
          borderTop: "1px solid var(--border-subtle)",
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
          {languages.map(lang => (
            <button
              key={lang.value}
              type="button"
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
