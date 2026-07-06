"use client";

import * as React from "react";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useLogin } from "./use-login";
import { useAuthLanguage } from "../auth-language";

export function LoginCC() {
  const { form, onSubmit, error, isPending } = useLogin();
  const {
    control,
    formState: { errors },
  } = form;

  const { t } = useAuthLanguage();

  return (
    <div className="w-full max-w-[360px] bg-card border border-border rounded-xl shadow-md p-8">
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="flex items-center justify-center size-7 bg-primary rounded-lg text-primary-foreground flex-shrink-0">
          <Icon name="zap" size={14} strokeWidth={2.5} />
        </span>
        <span className="text-base font-semibold text-foreground tracking-tight">ScrumFlow</span>
      </div>

      <div className="mb-5">
        <div className="text-lg font-semibold text-foreground mb-1">{t.auth.signIn}</div>
        <div className="text-sm text-muted-foreground">{t.auth.login}</div>
      </div>

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

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.password}
              type="password"
              placeholder="••••••••"
              icon="lock"
              autoComplete="current-password"
              error={errors.password?.message}
            />
          )}
        />

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            {t.auth.forgotPassword}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          className="w-full"
        >
          {t.auth.signIn}
        </Button>
      </form>
    </div>
  );
}