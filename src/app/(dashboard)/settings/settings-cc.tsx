"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Controller, type UseFormReturn } from "react-hook-form";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { useAppDialogs } from "@/components/ui-kit/overlays/app-dialogs";
import type { Translations } from "@/i18n";
import { useLanguage, useTranslation } from "@/i18n/provider";
import type { Language, Theme } from "@/types/db";
import type { UserPreferencesData } from "@/features/settings/queries";
import type { ChangePasswordInput } from "@/schemas/auth";
import {
  updateBaleSchedule,
  type UpdatePreferencesInput,
} from "@/features/settings/actions";
import type { SecuritySnapshot, UserRow } from "@/features/users/types";
import { logoutEverywhereAction } from "@/features/users/actions";
import {
  AVATAR_PRESETS,
  avatarPresetDisplaySrc,
} from "@/lib/avatar-presets";
import { formatJalaliDate } from "@/lib/life";
import { formatPresenceInstant } from "@/lib/presence";
import { summarizeUserAgent } from "@/lib/user-agent";
import { cn, formatNumber } from "@/lib/utils";
import { useSettings } from "./use-settings";
import { parseSettingsTab, type SettingsTab } from "./settings-tabs";
import { useProfile } from "../profile/use-profile";
import {
  CapabilitiesSection,
  type CapabilitiesData,
} from "./capabilities-section";
import { signOut } from "next-auth/react";

interface SettingsCCProps {
  currentLanguage: Language;
  currentTheme: Theme;
  preferences: UserPreferencesData | null;
  user: UserRow;
  baleCode?: string | null;
  baleLinked?: boolean;
  security: SecuritySnapshot;
  initialTab?: SettingsTab;
  /** Member module access (null for admin: no modules). */
  capabilities?: CapabilitiesData | null;
}

export function SettingsCC(props: SettingsCCProps) {
  return (
    <Suspense
      fallback={
        <div
          className="h-40 max-w-3xl animate-pulse rounded-xl border bg-muted/30"
          aria-hidden
        />
      }
    >
      <SettingsCCInner {...props} />
    </Suspense>
  );
}

function SettingsCCInner({
  currentLanguage,
  currentTheme,
  preferences,
  user,
  baleCode,
  baleLinked = false,
  security,
  initialTab = "profile",
  capabilities = null,
}: SettingsCCProps) {
  const settings = useSettings(currentLanguage, currentTheme);
  const t = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTabTransition] = React.useTransition();

  const urlTab = parseSettingsTab(searchParams.get("tab") ?? initialTab);
  const [activeTab, setOptimisticTab] = React.useOptimistic(urlTab);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "profile", label: t.settings.profile },
    { id: "security", label: t.settings.security },
    ...(capabilities
      ? [
          {
            id: "capabilities" as const,
            label: currentLanguage === "FA" ? "قابلیت‌ها" : "Capabilities",
          },
        ]
      : []),
    { id: "notifications", label: t.settings.notifications },
    { id: "appearance", label: t.settings.appearance },
  ];

  const selectTab = (id: SettingsTab) => {
    startTabTransition(() => {
      setOptimisticTab(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="min-w-0 w-full max-w-4xl overflow-x-hidden">
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
          const active = activeTab === tab.id;
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

      <div role="tabpanel" id={`panel-${activeTab}`}>
        {activeTab === "profile" && (
          <ProfileSettingsSection
            t={t}
            user={user}
            baleCode={baleCode}
            baleLinked={baleLinked}
          />
        )}
        {activeTab === "security" && (
          <SecuritySettingsSection
            t={t}
            language={currentLanguage === "EN" ? "EN" : "FA"}
            security={security}
            passwordPending={settings.passwordPending}
            passwordSuccess={settings.passwordSuccess}
            passwordError={settings.passwordError}
            onPasswordChange={settings.onPasswordChange}
            passwordForm={settings.passwordForm}
          />
        )}
        {activeTab === "capabilities" && capabilities && (
          <CapabilitiesSection
            data={capabilities}
            language={currentLanguage === "EN" ? "EN" : "FA"}
          />
        )}
        {activeTab === "notifications" && (
          <NotificationSettingsSection
            t={t}
            preferences={preferences}
            notifyPending={settings.notifyPending}
            notifySuccess={settings.notifySuccess}
            notifyError={settings.notifyError}
            onNotifyChange={settings.onNotifyChange}
          />
        )}
        {activeTab === "appearance" && (
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
  baleLinked,
}: {
  t: Translations;
  user: UserRow;
  baleCode?: string | null;
  baleLinked: boolean;
}) {
  const language = useLanguage();
  const { confirm } = useAppDialogs();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const p = useProfile(user.id, {
    name: user.name,
    phone: user.phone ?? "",
    bio: user.bio ?? "",
  });
  const [copied, setCopied] = React.useState(false);

  const memberSince = formatJalaliDate(
    new Date(user.createdAt),
    language === "EN" ? "EN" : "FA",
  );
  const lastLogin = user.lastLoginAt
    ? formatJalaliDate(
        new Date(user.lastLoginAt),
        language === "EN" ? "EN" : "FA",
      )
    : t.profile.neverLoggedIn;

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

  async function onUnlinkBale() {
    const ok = await confirm({
      title: t.profile.baleUnlinkConfirm,
      danger: true,
      confirmLabel: t.profile.baleUnlink,
    });
    if (!ok) return;
    p.onUnlinkBale();
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-primary/12 via-bg-surface to-bg-sunken p-4 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-12 -top-16 size-44 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -start-10 size-40 rounded-full bg-brand-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="mx-auto flex w-[7.25rem] shrink-0 flex-col items-center gap-2.5 sm:mx-0">
            <div className="relative size-[94px]">
              <div className="rounded-full bg-gradient-to-br from-primary/40 via-brand-300/30 to-transparent p-[3px] shadow-[0_12px_32px_rgb(63_76_187/0.18)]">
                <div className="overflow-hidden rounded-full bg-bg-surface ring-2 ring-bg-surface">
                  <Avatar
                    name={user.name}
                    src={
                      user.avatar
                        ? avatarPresetDisplaySrc(user.avatar)
                        : undefined
                    }
                    size={88}
                    className="size-[88px] text-2xl"
                  />
                </div>
              </div>
              <button
                type="button"
                className="absolute bottom-0 end-0 inline-flex size-8 items-center justify-center rounded-full border border-border-default bg-bg-surface text-foreground shadow-md transition hover:bg-accent disabled:opacity-60"
                disabled={p.avatarPending}
                onClick={() => avatarInputRef.current?.click()}
                aria-label={t.profile.changeAvatar}
                title={t.profile.changeAvatar}
              >
                <Icon name="camera" size={14} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/*"
                className="hidden"
                onChange={p.onAvatarChange}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={p.avatarPending}
              onClick={() => avatarInputRef.current?.click()}
              className="w-full justify-center"
            >
              {t.profile.changeAvatar}
            </Button>
            <p className="w-full text-center text-[11px] leading-snug text-muted-foreground">
              {t.profile.avatarHint}
            </p>
          </div>

          <div className="min-w-0 flex-1 text-start">
            <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {user.name}
            </h2>
            <p
              className="mt-0.5 w-fit max-w-full truncate text-sm text-muted-foreground"
              dir="ltr"
            >
              {user.email}
            </p>
            {user.bio ? (
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                {user.bio}
              </p>
            ) : null}

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.profile.pickAvatar}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.profile.pickAvatarHint}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {AVATAR_PRESETS.map(preset => {
                  const selected = user.avatar === preset.src;
                  const label =
                    language === "EN" ? preset.labelEn : preset.labelFa;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={p.avatarPending}
                      title={label}
                      aria-label={label}
                      aria-pressed={selected}
                      onClick={() => p.onAvatarPreset(preset.id)}
                      className={cn(
                        "relative size-11 overflow-hidden rounded-full border-2 transition",
                        "hover:scale-105 hover:shadow-md disabled:opacity-60",
                        selected
                          ? "border-primary ring-2 ring-primary/25"
                          : "border-transparent ring-1 ring-border-default/80",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarPresetDisplaySrc(preset.src)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
              {p.avatarError ? (
                <p className="mt-2 text-xs text-red-500" role="alert">
                  {p.avatarError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5">
          <SectionTitle>{t.profile.personalInfo}</SectionTitle>
          <form
            onSubmit={p.onProfileSubmit}
            className="flex flex-col gap-4"
            noValidate
          >
            {p.profileError ? (
              <div
                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600"
                role="alert"
              >
                <ResolvedValidationText text={p.profileError} />
              </div>
            ) : null}
            {p.profileSuccess ? (
              <div
                className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700"
                role="status"
              >
                {t.profile.changesSaved}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="name"
                control={p.profileForm.control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    label={t.profile.fullName}
                    error={fieldState.error?.message}
                    autoComplete="name"
                  />
                )}
              />
              <Controller
                name="phone"
                control={p.profileForm.control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    label={t.profile.phone}
                    hint={t.profile.phoneHint}
                    placeholder={t.profile.phonePlaceholder}
                    error={fieldState.error?.message}
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                  />
                )}
              />
            </div>

            <Input
              label={t.profile.email}
              value={user.email}
              disabled
              hint={t.profile.emailCannotBeChanged}
              dir="ltr"
            />

            <Controller
              name="bio"
              control={p.profileForm.control}
              render={({ field, fieldState }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  label={t.profile.bio}
                  hint={t.profile.bioHint}
                  placeholder={t.profile.bioPlaceholder}
                  error={fieldState.error?.message}
                  rows={3}
                />
              )}
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

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5">
            <SectionTitle>{t.profile.account}</SectionTitle>
            <dl className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{t.profile.memberSince}</dt>
                <dd className="text-end font-medium text-foreground">
                  {memberSince}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{t.profile.lastLogin}</dt>
                <dd className="text-end font-medium text-foreground">
                  {lastLogin}
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 sm:p-5",
              baleLinked
                ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-bg-surface to-bg-surface"
                : "border-primary/20 bg-gradient-to-br from-primary/10 via-bg-surface to-bg-sunken",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -end-8 -top-10 size-28 rounded-full blur-2xl",
                baleLinked ? "bg-emerald-400/20" : "bg-primary/20",
              )}
            />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <SectionTitle>{t.profile.baleTitle}</SectionTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      baleLinked
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        baleLinked ? "bg-emerald-500" : "bg-amber-500",
                      )}
                      aria-hidden
                    />
                    {baleLinked
                      ? t.profile.baleLinked
                      : t.profile.baleNotLinked}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {baleLinked
                    ? t.profile.baleLinkedHint
                    : t.profile.baleConnectLead}
                </p>
              </div>
              {baleLinked ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  loading={p.balePending}
                  onClick={() => void onUnlinkBale()}
                >
                  {t.profile.baleUnlink}
                </Button>
              ) : null}
            </div>

            {p.baleError ? (
              <p className="relative mt-3 text-xs text-red-500" role="alert">
                <ResolvedValidationText text={p.baleError} />
              </p>
            ) : null}

            {!baleLinked ? (
              <ol className="relative mt-4 space-y-2.5 text-xs text-muted-foreground">
                {[t.profile.baleStep1, t.profile.baleStep2, t.profile.baleStep3].map(
                  (step, i) => (
                    <li key={step} className="flex gap-2.5">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {language === "EN"
                          ? String(i + 1)
                          : formatNumber(i + 1, "FA")}
                      </span>
                      <span className="leading-5 text-foreground/80">{step}</span>
                    </li>
                  ),
                )}
              </ol>
            ) : null}

            {baleCode ? (
              <div className="relative mt-4 rounded-xl border border-primary/25 bg-bg-surface/90 px-3 py-3 shadow-sm">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-primary/80">
                  {t.profile.baleCodeTitle}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="font-mono text-2xl font-semibold tracking-[0.22em] text-foreground"
                    dir="ltr"
                  >
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
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t.profile.baleCodeHint}
                </p>
              </div>
            ) : !baleLinked ? (
              <p className="relative mt-4 rounded-lg border border-dashed border-border-default bg-bg-sunken/60 px-3 py-2.5 text-[11px] text-muted-foreground">
                {t.profile.baleWaitingCode}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function SecuritySettingsSection({
  t,
  language,
  security,
  passwordPending,
  passwordSuccess,
  passwordError,
  onPasswordChange,
  passwordForm,
}: {
  t: Translations;
  language: "FA" | "EN";
  security: SecuritySnapshot;
  passwordPending: boolean;
  passwordSuccess: boolean;
  passwordError: string | null;
  onPasswordChange: (e: React.FormEvent) => void;
  passwordForm: UseFormReturn<ChangePasswordInput>;
}) {
  const { confirm } = useAppDialogs();
  const [logoutPending, startLogoutTransition] = React.useTransition();
  const [logoutError, setLogoutError] = React.useState<string | null>(null);

  const locked =
    security.lockedUntil != null &&
    new Date(security.lockedUntil).getTime() > Date.now();
  const lastLoginLabel = security.lastLoginAt
    ? formatPresenceInstant(security.lastLoginAt, language)
    : t.settings.securityNeverLogin;
  const lockLabel = locked
    ? t.settings.securityLockedUntil.replace(
        "{time}",
        formatPresenceInstant(security.lockedUntil, language),
      )
    : t.settings.securityLockOk;
  const failedLabel =
    security.failedLoginCount > 0
      ? t.settings.securityFailedAttempts.replace(
          "{n}",
          formatNumber(security.failedLoginCount, language),
        )
      : t.settings.securityNoFailedAttempts;

  async function onLogoutEverywhere() {
    const ok = await confirm({
      title: t.settings.securityLogoutEverywhereConfirm,
      danger: true,
      confirmLabel: t.settings.securityLogoutEverywhere,
    });
    if (!ok) return;
    setLogoutError(null);
    startLogoutTransition(async () => {
      const result = await logoutEverywhereAction();
      if (!result.success) {
        setLogoutError(result.error ?? "Failed");
        return;
      }
      await signOut({ callbackUrl: "/login" });
    });
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border-default bg-gradient-to-br from-primary/10 via-bg-surface to-bg-sunken p-4 sm:p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -start-8 -top-10 size-32 rounded-full bg-primary/15 blur-3xl"
        />
        <SectionTitle>{t.settings.securityOverview}</SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.settings.securityHint}
        </p>
        <div className="relative grid gap-3 sm:grid-cols-3">
          <SecurityStat
            label={t.settings.securityLastLogin}
            value={lastLoginLabel}
          />
          <SecurityStat
            label={t.settings.securityPasswordLabel}
            value={
              security.hasPassword
                ? t.settings.securityPasswordOk
                : t.settings.securityPasswordMissing
            }
            tone={security.hasPassword ? "ok" : "warn"}
            hint={failedLabel}
          />
          <SecurityStat
            label={t.settings.securityLockLabel}
            value={lockLabel}
            tone={locked ? "danger" : "ok"}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5">
          <SectionTitle>{t.settings.securityChangePassword}</SectionTitle>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.settings.securityChangePasswordHint}
          </p>
          <form
            onSubmit={onPasswordChange}
            className="flex flex-col gap-4"
            noValidate
          >
            {passwordError ? (
              <div
                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600"
                role="alert"
              >
                <ResolvedValidationText text={passwordError} />
              </div>
            ) : null}
            {passwordSuccess ? (
              <div
                className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700"
                role="status"
              >
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

        <section className="rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5">
          <SectionTitle>{t.settings.securitySessions}</SectionTitle>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.settings.securitySessionsHint}
          </p>
          {logoutError ? (
            <p className="mb-3 text-xs text-red-500" role="alert">
              <ResolvedValidationText text={logoutError} />
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={logoutPending}
            onClick={() => void onLogoutEverywhere()}
          >
            {t.settings.securityLogoutEverywhere}
          </Button>
        </section>
      </div>

      <section className="rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <SectionTitle>{t.settings.securityLoginHistory}</SectionTitle>
          <p className="mb-3 text-[11px] text-muted-foreground">
            {t.settings.securityThisDeviceHint}
          </p>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.settings.securityLoginHistoryHint}
        </p>
        {security.loginEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-sm text-muted-foreground">
            {t.settings.securityLoginHistoryEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {security.loginEvents.map((ev, index) => {
              const device = summarizeUserAgent(ev.userAgent, language);
              return (
                <li
                  key={ev.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {formatPresenceInstant(ev.createdAt, language)}
                      </p>
                      {index === 0 ? (
                        <Badge tone="solid">{t.settings.securityLatest}</Badge>
                      ) : null}
                    </div>
                    <p
                      className="mt-0.5 truncate text-xs text-muted-foreground"
                      dir="ltr"
                      title={ev.userAgent ?? undefined}
                    >
                      {device.label}
                    </p>
                  </div>
                  <div
                    className="shrink-0 text-xs tabular-nums text-muted-foreground"
                    dir="ltr"
                  >
                    {ev.ip ? (
                      <span>
                        {t.settings.securityLoginIp}: {ev.ip}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SecurityStat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        tone === "ok" && "border-emerald-500/25 bg-emerald-500/5",
        tone === "warn" && "border-amber-500/30 bg-amber-500/5",
        tone === "danger" && "border-red-500/30 bg-red-500/5",
        tone === "neutral" && "border-border-default bg-bg-surface/70",
      )}
    >
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
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
