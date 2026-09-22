"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useForgotPassword } from "./use-forgot-password";
import { useAuthLanguage } from "../auth-language";

export function ForgotPasswordCC() {
  const { form, onSubmit, success, error, isPending } = useForgotPassword();
  const {
    control,
    formState: { errors },
  } = form;
  const { t } = useAuthLanguage();

  return (
    <div className="w-full max-w-[360px] bg-card border border-border rounded-xl shadow-md p-8">
        <div className="flex flex-col items-center justify-center gap-1 mb-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Mindora" width={24} height={24} />
            <span className="text-base font-semibold text-foreground tracking-tight">Mindora</span>
          </div>
          <span className="text-[10px] text-muted-foreground tracking-wide">Think. Plan. Grow</span>
        </div>

      <div className="mb-5">
        <div className="text-lg font-semibold text-foreground mb-1">{t.auth.forgotPasswordTitle}</div>
        <div className="text-sm text-muted-foreground">{t.auth.forgotPasswordDescription}</div>
      </div>

      {success ? (
        <div className="flex items-center gap-2 p-3 text-sm text-success bg-success/10 border border-success/20 rounded-lg mb-4" role="status">
          {t.auth.passwordResetSent}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
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

          <Button type="submit" variant="primary" loading={isPending} className="w-full">
            {t.auth.sendResetLink}
          </Button>
        </form>
      )}

      <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-sm text-primary hover:underline mt-4">
        <Icon name="chevron-left" size={13} />
        {t.auth.backToLogin}
      </Link>
    </div>
  );
}