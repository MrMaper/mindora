"use client";

import * as React from "react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useForgotPassword } from "./use-forgot-password";

export function ForgotPasswordCC() {
  const { form, onSubmit, success, error, isPending } = useForgotPassword();
  const { control, formState: { errors } } = form;

  return (
    <div className="auth-card">
      <div className="auth-card__brand">
        <span className="auth-card__logo">
          <Icon name="zap" size={14} strokeWidth={2.5} />
        </span>
        <span className="auth-card__wordmark">ScrumFlow</span>
      </div>

      <div className="auth-card__header">
        <div className="auth-card__title">Forgot password</div>
        <div className="auth-card__subtitle">
          Enter your email and we&rsquo;ll send a reset link.
        </div>
      </div>

      {success ? (
        <div className="auth-card__alert auth-card__alert--success" role="status">
          Check your inbox — a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="auth-card__form" noValidate>
          {error && (
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {error}
            </div>
          )}

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Email"
                type="email"
                placeholder="you@company.com"
                icon="user"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />

          <Button type="submit" variant="primary" loading={isPending} style={{ width: "100%" }}>
            Send reset link
          </Button>
        </form>
      )}

      <Link href="/login" className="auth-card__back">
        <Icon name="chevron-left" size={13} />
        Back to sign in
      </Link>
    </div>
  );
}
