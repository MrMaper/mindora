"use client";

import * as React from "react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useForgotPassword } from "./use-forgot-password";
import { en } from "@/i18n";

export function ForgotPasswordCC() {
  const { form, onSubmit, success, error, isPending } = useForgotPassword();
  const {
    control,
    formState: { errors },
  } = form;
  const t = en;

  return (
    <div className="auth-card">
      <div className="auth-card__brand">
        <span className="auth-card__logo">
          <Icon name="zap" size={14} strokeWidth={2.5} />
        </span>
        <span className="auth-card__wordmark">ScrumFlow</span>
      </div>

      <div className="auth-card__header">
        <div className="auth-card__title">{t.auth.forgotPasswordTitle}</div>
        <div className="auth-card__subtitle">
          {t.auth.forgotPasswordDescription}
        </div>
      </div>

      {success ? (
        <div
          className="auth-card__alert auth-card__alert--success"
          role="status"
        >
          {t.auth.passwordResetSent}
        </div>
      ) : (
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
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label={t.auth.email}
                type="email"
                placeholder={t.auth.enterEmail}
                icon="user"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />

          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            style={{ width: "100%" }}
          >
            {t.auth.sendResetLink}
          </Button>
        </form>
      )}

      <Link href="/login" className="auth-card__back">
        <Icon name="chevron-left" size={13} />
        {t.auth.backToLogin}
      </Link>
    </div>
  );
}
