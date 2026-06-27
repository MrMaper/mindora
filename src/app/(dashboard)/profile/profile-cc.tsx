"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useProfile } from "./use-profile";
import { getTranslations } from "@/i18n";
import type { UserRow } from "@/features/users/types";
import type { Language } from "@/types/db";

interface ProfileCCProps {
  user: UserRow;
  language: Language;
}

export function ProfileCC({ user, language }: ProfileCCProps) {
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const p = useProfile(user.id);
  const t = getTranslations(language);

  React.useEffect(() => {
    p.profileForm.reset({ name: user.name });
  }, [user.name]);

  return (
    <div style={{ maxWidth: 560 }}>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-primary)",
          marginBottom: "var(--space-6)",
        }}
      >
        {t.profile.title}
      </h1>

      {/* ── Avatar ───────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "var(--space-8)" }}>
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
      </section>

      {/* ── Personal info ────────────────────────────────────────────── */}
      <section
        style={{
          marginBottom: "var(--space-8)",
          paddingBottom: "var(--space-8)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
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
              {p.profileError}
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

      {/* ── Change password ──────────────────────────────────────────── */}
      <section>
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
          {t.profile.changePassword}
        </div>

        <form
          onSubmit={p.onPasswordSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
          noValidate
        >
          {p.passwordError && (
            <div
              className="auth-card__alert auth-card__alert--error"
              role="alert"
            >
              {p.passwordError}
            </div>
          )}
          {p.passwordSuccess && (
            <div
              className="auth-card__alert auth-card__alert--success"
              role="status"
            >
              {t.profile.passwordChanged}
            </div>
          )}
          <Controller
            name="currentPassword"
            control={p.passwordForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.profile.currentPassword}
                type="password"
                autoComplete="current-password"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={p.passwordForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.profile.newPassword}
                type="password"
                autoComplete="new-password"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={p.passwordForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.profile.confirmNewPassword}
                type="password"
                autoComplete="new-password"
                error={fieldState.error?.message}
              />
            )}
          />
          <div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={p.passwordPending}
            >
              {t.profile.changePasswordSubmit}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
