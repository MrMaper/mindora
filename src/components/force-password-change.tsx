"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { changePassword } from "@/features/users/actions";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth";
import { localizedZodResolver } from "@/lib/validation-message";
import { useTranslation } from "@/i18n/provider";

/**
 * Shown instead of the app while `mustChangePassword` is set
 * (temporary password issued by the admin). docs/AREAS.md §8.3.
 */
export function ForcePasswordChange({ language }: { language: "FA" | "EN" }) {
  const fa = language === "FA";
  const t = useTranslation();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: localizedZodResolver(changePasswordSchema, t),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(data => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("currentPassword", data.currentPassword);
      fd.append("password", data.password);
      fd.append("confirmPassword", data.confirmPassword);
      const res = await changePassword(fd);
      if (!res.success) {
        setError(res.error ?? (fa ? "ذخیره نشد" : "Could not save"));
        return;
      }
      router.refresh();
    });
  });

  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background p-4"
      dir={fa ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-[380px] rounded-xl border border-border bg-card p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <BrandMark size="md" />
        </div>
        <h1 className="mb-1 text-lg font-semibold text-foreground">
          {fa ? "اول یک رمز برای خودت انتخاب کن" : "Choose your own password first"}
        </h1>
        <p className="mb-5 text-sm text-muted-foreground">
          {fa
            ? "رمز فعلی را مدیر برایت ساخته. برای امنیت حسابت، رمز خودت را بگذار؛ بعد وارد می‌شوی."
            : "Your admin set your current password. For your security, pick your own, then you will be taken in."}
        </p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? (
            <div
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}
          <Controller
            name="currentPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type="password"
                autoComplete="current-password"
                label={t.profile.currentPassword}
                error={fieldState.error?.message}
                disabled={pending}
              />
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type="password"
                autoComplete="new-password"
                label={t.profile.newPassword}
                error={fieldState.error?.message}
                disabled={pending}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                type="password"
                autoComplete="new-password"
                label={t.profile.confirmNewPassword}
                error={fieldState.error?.message}
                disabled={pending}
              />
            )}
          />
          <Button type="submit" variant="primary" loading={pending} className="w-full">
            {t.profile.changePasswordSubmit}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline"
        >
          {fa ? "خروج" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
