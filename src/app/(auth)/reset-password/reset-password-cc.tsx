"use client";

import * as React from "react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useResetPassword } from "./use-reset-password";
import { useAuthLanguage } from "../auth-language";

interface ResetPasswordCCProps {
  token: string | undefined;
}

export function ResetPasswordCC({ token }: ResetPasswordCCProps) {
  const { form, onSubmit, error, isPending } = useResetPassword(token ?? "");
  const {
    control,
    formState: { errors },
  } = form;
  const { t } = useAuthLanguage();

  if (!token) {
    return (
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__logo">
            <Icon name="zap" size={14} strokeWidth={2.5} />
          </span>
          <span className="auth-card__wordmark">ScrumFlow</span>
        </div>
        <div className="auth-card__alert auth-card__alert--error" role="alert">
          {t.auth.invalidResetLink}
        </div>
        <Link href="/forgot-password" className="auth-card__back">
          <Icon name="chevron-left" size={13} />
          {t.auth.sendResetLink}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card__brand">
        <span className="auth-card__logo">
          <Icon name="zap" size={14} strokeWidth={2.5} />
        </span>
        <span className="auth-card__wordmark">ScrumFlow</span>
      </div>

      <div className="auth-card__header">
        <div className="auth-card__title">{t.auth.resetPasswordTitle}</div>
        <div className="auth-card__subtitle">{t.auth.enterNewPassword}</div>
      </div>

      <form onSubmit={onSubmit} className="auth-card__form" noValidate>
        {error && (
          <div
            className="auth-card__alert auth-card__alert--error"
            role="alert"
          >
            {error}
          </div>
        )}

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.newPassword}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.confirmPassword}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          style={{ width: "100%" }}
        >
          {t.auth.resetPassword}
        </Button>
      </form>

      <Link href="/login" className="auth-card__back">
        <Icon name="chevron-left" size={13} />
        {t.auth.backToLogin}
      </Link>
    </div>
  );
}
