"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, type UseFormReturn } from "react-hook-form";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import type { Translations } from "@/i18n";
import { useTranslation } from "@/i18n/provider";
import type { Language, Theme } from "@/types/db";
import type { UserPreferencesData } from "@/features/settings/queries";
import type { ChangePasswordInput } from "@/schemas/auth";
import {
  updateBaleSchedule,
  type UpdatePreferencesInput,
} from "@/features/settings/actions";
import type { UserRow } from "@/features/users/types";
import { cn } from "@/lib/utils";
import { useSettings } from "./use-settings";
import type { SettingsTab } from "./settings-tabs";
import { useProfile } from "../profile/use-profile";

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
    <div className="min-w-0 w-full max-w-3xl overflow-x-hidden">
      <PageHeaderBar
        title={t.settings.title}
        description={t.settings.subtitle}
        className="mb-4"
      />

      <div
        role="tablist"
        className="mb-6 flex flex-wrap gap-1 border-b border-border pb-2"
      >
        {tabs.map(tab => {
          const active = settings.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function StatusLine({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (error) {
    return (
      <p className="mt-2 text-xs text-red-500" role="alert">
        <ResolvedValidationText text={error} />
      </p>
    );
  }
  if (success) {
    return (
      <p className="mt-2 text-xs text-green-600" role="status">
        ✓ {success}
      </p>
    );
  }
  return null;
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
  const [copied, setCopied] = React.useState(false);

  async function copyBaleCode() {
    if (!baleCode) return;
    try {
      await navigator.clipboard.writeText(baleCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      {baleCode ? (
        <section>
          <SectionTitle>{t.profile.baleCodeTitle}</SectionTitle>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <span className="font-mono text-xl tracking-[0.2em] text-foreground">
              {baleCode}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void copyBaleCode()}
            >
              {copied ? t.settings.copied : t.settings.copyCode}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.profile.baleCodeHint}
          </p>
        </section>
      ) : null}

      <section>
        <SectionTitle>{t.profile.avatar}</SectionTitle>
        <div className="flex items-center gap-4">
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
            <p className="mt-1 text-xs text-muted-foreground">
              {t.profile.avatarHint}
            </p>
            {p.avatarError ? (
              <p className="mt-1 text-xs text-red-500">{p.avatarError}</p>
            ) : null}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={p.onAvatarChange}
          />
        </div>
      </section>

      <section>
        <SectionTitle>{t.profile.personalInfo}</SectionTitle>
        <form
          onSubmit={p.onProfileSubmit}
          className="flex max-w-md flex-col gap-4"
          noValidate
        >
          {p.profileError ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600" role="alert">
              <ResolvedValidationText text={p.profileError} />
            </div>
          ) : null}
          {p.profileSuccess ? (
            <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700" role="status">
              {t.profile.changesSaved}
            </div>
          ) : null}
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
      </section>
    </div>
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
      <SectionTitle>{t.settings.security}</SectionTitle>
      <p className="mb-4 text-sm text-muted-foreground">
        {t.settings.securityHint}
      </p>
      <form
        onSubmit={onPasswordChange}
        className="flex max-w-md flex-col gap-4"
        noValidate
      >
        {passwordError ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600" role="alert">
            <ResolvedValidationText text={passwordError} />
          </div>
        ) : null}
        {passwordSuccess ? (
          <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700" role="status">
            {t.settings.passwordChanged}
          </div>
        ) : null}

        <Controller
          name="currentPassword"
          control={passwordForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="password"
              autoComplete="current-password"
              label={t.profile.currentPassword}
              error={fieldState.error?.message}
              disabled={passwordPending}
            />
          )}
        />
        <Controller
          name="password"
          control={passwordForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="password"
              autoComplete="new-password"
              label={t.profile.newPassword}
              error={fieldState.error?.message}
              disabled={passwordPending}
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={passwordForm.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              type="password"
              autoComplete="new-password"
              label={t.profile.confirmNewPassword}
              error={fieldState.error?.message}
              disabled={passwordPending}
            />
          )}
        />
        <div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={passwordPending}
          >
            {t.profile.changePasswordSubmit}
          </Button>
        </div>
      </form>
    </section>
  );
}

type NotifyKey = keyof UpdatePreferencesInput;

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

function NotifyToggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-opacity",
        disabled && "cursor-not-allowed opacity-55",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm text-foreground">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="size-5 shrink-0 accent-[var(--action-primary)]"
      />
    </label>
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
  onNotifyChange: (
    field: keyof UpdatePreferencesInput,
    value: boolean,
  ) => Promise<boolean>;
}) {
  const generalPrefs = [
    {
      key: "notifications" as const,
      label: t.settings.masterNotifications,
    },
    {
      key: "emailNotifs" as const,
      label: t.settings.emailNotifs,
      hint: t.settings.emailNotifsHint,
    },
    { key: "soundNotifs" as const, label: t.settings.soundNotifs },
  ];

  const eventPrefs = [
    { key: "notifyTaskAssigned" as const, label: t.settings.notifyTaskAssigned },
    { key: "notifyTaskUpdated" as const, label: t.settings.notifyTaskUpdated },
    {
      key: "notifyTaskCommented" as const,
      label: t.settings.notifyTaskCommented,
    },
    { key: "notifyMention" as const, label: t.settings.notifyMention },
    {
      key: "notifyDeadlineApproaching" as const,
      label: t.settings.notifyDeadlineApproaching,
    },
    {
      key: "batchDeadlineReminders" as const,
      label: t.settings.batchDeadlineReminders,
      hint: t.settings.batchDeadlineRemindersHint,
    },
    {
      key: "notifyStatusChanged" as const,
      label: t.settings.notifyStatusChanged,
    },
  ];

  const allKeys = [...generalPrefs, ...eventPrefs];

  const [localPrefs, setLocalPrefs] = React.useState(() => {
    const next: Record<string, boolean> = {};
    for (const pref of allKeys) {
      next[pref.key] = defaultNotifyValue(pref.key, preferences);
    }
    return next;
  });

  React.useEffect(() => {
    setLocalPrefs(() => {
      const next: Record<string, boolean> = {};
      for (const pref of allKeys) {
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

  async function toggle(key: NotifyKey, value: boolean) {
    const previous = localPrefs[key] ?? false;
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    const ok = await onNotifyChange(key, value);
    if (!ok) {
      setLocalPrefs(prev => ({ ...prev, [key]: previous }));
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>{t.settings.notifyGroupGeneral}</SectionTitle>
        <div className="flex flex-col gap-2">
          {generalPrefs.map(pref => (
            <NotifyToggle
              key={pref.key}
              label={pref.label}
              hint={"hint" in pref ? pref.hint : undefined}
              checked={localPrefs[pref.key] ?? false}
              disabled={notifyPending}
              onChange={v => void toggle(pref.key, v)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{t.settings.notifyGroupEvents}</SectionTitle>
        <div className="flex flex-col gap-2">
          {eventPrefs.map(pref => (
            <NotifyToggle
              key={pref.key}
              label={pref.label}
              hint={"hint" in pref ? pref.hint : undefined}
              checked={localPrefs[pref.key] ?? false}
              disabled={notifyPending || !masterOn}
              onChange={v => void toggle(pref.key, v)}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>{t.settings.notifyGroupChannels}</SectionTitle>
        {browserPerm !== "unsupported" ? (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-sm text-foreground">
                {t.settings.browserReminders}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t.settings.browserRemindersHint}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant={browserPerm === "granted" ? "primary" : "secondary"}
              disabled={browserPerm === "granted"}
              onClick={async () => {
                const next = await Notification.requestPermission();
                setBrowserPerm(next);
              }}
            >
              {browserPerm === "granted"
                ? t.settings.browserRemindersOn
                : t.settings.browserRemindersEnable}
            </Button>
          </div>
        ) : null}

        <BaleHours
          digestHour={preferences?.baleDigestHour ?? 8}
          habitHour={preferences?.baleHabitHour ?? 21}
          digestLabel={t.settings.baleDigestHour}
          habitLabel={t.settings.baleHabitHour}
          hint={t.settings.baleHoursHint}
          saveLabel={t.settings.baleHoursSave}
          savedLabel={t.settings.baleHoursSaved}
        />
      </section>

      <StatusLine
        error={notifyError}
        success={notifySuccess ? t.settings.preferencesSaved : null}
      />
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour));

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
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
      <div className="flex flex-wrap gap-4">
        <label className="text-sm text-foreground">
          {digestLabel}
          <select
            value={digest}
            onChange={e => setDigest(e.target.value)}
            className="mt-1 block rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {HOURS.map(hour => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-foreground">
          {habitLabel}
          <select
            value={habit}
            onChange={e => setHabit(e.target.value)}
            className="mt-1 block rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {HOURS.map(hour => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-3"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateBaleSchedule(
              Number(digest),
              Number(habit),
            );
            setNote(result.success ? savedLabel : (result.error ?? savedLabel));
          })
        }
      >
        {saveLabel}
      </Button>
      {note ? (
        <p className="mt-2 text-sm" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function ThemePreview({ theme }: { theme: Theme }) {
  if (theme === "SYSTEM") {
    return (
      <div
        className="grid h-[4.25rem] grid-cols-2 overflow-hidden rounded-md border border-border"
        aria-hidden
      >
        <div className="bg-zinc-50 p-1.5">
          <div className="mb-1 h-1.5 w-full rounded bg-zinc-300" />
          <div className="h-1.5 w-2/3 rounded bg-zinc-200" />
        </div>
        <div className="bg-zinc-900 p-1.5">
          <div className="mb-1 h-1.5 w-full rounded bg-zinc-600" />
          <div className="h-1.5 w-2/3 rounded bg-zinc-700" />
        </div>
      </div>
    );
  }

  const isDark = theme === "DARK";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border",
        isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-zinc-50",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "flex h-6 items-center gap-1 border-b px-2",
          isDark ? "border-zinc-700 bg-zinc-950" : "border-zinc-200 bg-white",
        )}
      >
        <span className="size-1.5 rounded-full bg-red-400/80" />
        <span className="size-1.5 rounded-full bg-amber-400/80" />
        <span className="size-1.5 rounded-full bg-emerald-400/80" />
      </div>
      <div className="space-y-1.5 p-2">
        <div
          className={cn(
            "h-1.5 w-3/4 rounded",
            isDark ? "bg-zinc-600" : "bg-zinc-300",
          )}
        />
        <div
          className={cn(
            "h-1.5 w-1/2 rounded",
            isDark ? "bg-zinc-700" : "bg-zinc-200",
          )}
        />
        <div
          className={cn(
            "mt-1 h-5 w-full rounded",
            isDark ? "bg-blue-600/40" : "bg-blue-500/25",
          )}
        />
      </div>
    </div>
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
    { value: "FA", label: t.settings.persian },
    { value: "EN", label: t.settings.english },
  ];

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>{t.settings.appearance}</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          {themes.map(item => {
            const active = theme === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={themePending}
                onClick={() => onThemeChange(item.value)}
                className={cn(
                  "rounded-lg border p-3 text-start transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-accent/40",
                  themePending && "cursor-not-allowed opacity-60",
                )}
              >
                <ThemePreview theme={item.value} />
                <div className="mt-2.5 text-sm font-medium text-foreground">
                  {item.label}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
        <StatusLine
          error={themeError}
          success={themeSuccess ? t.settings.themeUpdated : null}
        />
      </section>

      <section className="border-t border-border pt-6">
        <SectionTitle>{t.settings.language}</SectionTitle>
        <p className="mb-3 text-xs text-muted-foreground">
          {t.settings.languageDescription}
        </p>
        <div className="flex max-w-md gap-2">
          {languages.map(lang => {
            const active = language === lang.value;
            return (
              <button
                key={lang.value}
                type="button"
                disabled={languagePending}
                onClick={() => onLanguageChange(lang.value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:bg-accent/40",
                  languagePending && "cursor-not-allowed opacity-60",
                )}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
        <StatusLine
          error={languageError}
          success={languageSuccess ? t.settings.languageUpdated : null}
        />
      </section>
    </div>
  );
}
