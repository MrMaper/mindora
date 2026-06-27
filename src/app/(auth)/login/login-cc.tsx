"use client";

import * as React from "react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useLogin } from "./use-login";
import { en } from "@/i18n";

export function LoginCC() {
  const { form, onSubmit, error, isPending } = useLogin();
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
        <div className="auth-card__title">{t.auth.signIn}</div>
        <div className="auth-card__subtitle">{t.auth.login}</div>
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

        <div>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label={t.auth.password}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
              />
            )}
          />
          <div className="auth-card__forgot">
            <Link href="/forgot-password">{t.auth.forgotPassword}</Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          style={{ width: "100%" }}
        >
          {t.auth.signIn}
        </Button>
      </form>
    </div>
  );
}
