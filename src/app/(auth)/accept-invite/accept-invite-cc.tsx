"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import {
  localizedZodResolver,
  resolveValidationMessage,
} from "@/lib/validation-message";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
import { acceptInvite } from "@/features/auth/actions";
import { useAuthLanguage } from "../auth-language";

export function AcceptInviteCC({
  token,
  tokenValid,
}: {
  token: string;
  tokenValid: boolean;
}) {
  const { t, language } = useAuthLanguage();
  const fa = language === "FA";
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ResetPasswordInput>({
    resolver: localizedZodResolver(resetPasswordSchema, t),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const {
    control,
    formState: { errors },
  } = form;

  const onSubmit = form.handleSubmit(data => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("token", data.token);
      fd.append("password", data.password);
      fd.append("confirmPassword", data.confirmPassword);
      const result = await acceptInvite(fd);
      if (!result.success || !result.email) {
        setError(
          result.error === "inviteInvalid"
            ? fa
              ? "لینک منقضی شده یا قبلاً استفاده شده. از مدیر لینک جدید بخواه."
              : "This link has expired or was already used. Ask your admin for a new one."
            : resolveValidationMessage(t, result.error ?? "genericError"),
        );
        return;
      }
      const signed = await signIn("credentials", {
        email: result.email,
        password: data.password,
        redirect: false,
      });
      if (signed?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  });

  const brand = (
    <div className="mb-6 flex justify-center">
      <BrandMark size="md" />
    </div>
  );

  if (!tokenValid) {
    return (
      <div className="w-full max-w-[360px] rounded-xl border border-border bg-card p-8 shadow-md">
        {brand}
        <div
          className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {fa
            ? "لینک منقضی شده یا قبلاً استفاده شده. از مدیر لینک جدید بخواه."
            : "This link has expired or was already used. Ask your admin for a new one."}
        </div>
        <Link href="/login" className="text-sm text-primary hover:underline">
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px] rounded-xl border border-border bg-card p-8 shadow-md">
      {brand}
      <div className="mb-5">
        <div className="mb-1 text-lg font-semibold text-foreground">
          {fa ? "خوش آمدی" : "Welcome"}
        </div>
        <div className="text-sm text-muted-foreground">
          {fa
            ? "حساب تو ساخته شده؛ یک رمز برای خودت انتخاب کن."
            : "Your account is ready. Choose a password for yourself."}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
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
        <Button type="submit" variant="primary" loading={isPending} className="w-full">
          {fa ? "ورود به Mindora" : "Continue to Mindora"}
        </Button>
      </form>
    </div>
  );
}
