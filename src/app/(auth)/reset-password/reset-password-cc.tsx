"use client";

import * as React from "react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { BrandMark } from "@/components/brand-mark";
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

  const brand = (
    <div className="mb-6 flex justify-center">
      <BrandMark size="md" />
    </div>
  );

  if (!token) {
    return (
      <div className="w-full max-w-[360px] bg-card border border-border rounded-xl shadow-md p-8">
        {brand}
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg mb-4" role="alert">
          {t.auth.invalidResetLink}
        </div>
        <Link href="/forgot-password" className="inline-flex items-center justify-center gap-1.5 text-sm text-primary hover:underline">
          <Icon name="chevron-left" size={13} />
          {t.auth.sendResetLink}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] bg-card border border-border rounded-xl shadow-md p-8">
      {brand}

      <div className="mb-5">
        <div className="text-lg font-semibold text-foreground mb-1">{t.auth.resetPasswordTitle}</div>
        <div className="text-sm text-muted-foreground">{t.auth.enterNewPassword}</div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
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

        <Button type="submit" variant="primary" loading={isPending} className="w-full">
          {t.auth.resetPassword}
        </Button>
      </form>

      <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-sm text-primary hover:underline mt-4">
        <Icon name="chevron-left" size={13} />
        {t.auth.backToLogin}
      </Link>
    </div>
  );
}