"use client";

import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useResetPassword } from "./use-reset-password";
import { useAuthLanguage } from "../auth-language";
import { AuthSimplePanel } from "../auth-simple-panel";
import { AuthTransitionLink } from "../auth-transition-link";
import styles from "../auth-stage.module.css";

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
      <AuthSimplePanel
        title={t.auth.resetPasswordTitle}
        subtitle={t.auth.invalidResetLink}
      >
        <AuthTransitionLink href="/forgot-password" className={styles.backLink}>
          <Icon name="chevron-left" size={13} />
          {t.auth.sendResetLink}
        </AuthTransitionLink>
      </AuthSimplePanel>
    );
  }

  return (
    <AuthSimplePanel
      title={t.auth.resetPasswordTitle}
      subtitle={t.auth.enterNewPassword}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error ? (
          <div className={styles.alertError} role="alert">
            {error}
          </div>
        ) : null}

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.newPassword}
              type="password"
              placeholder="••••••••"
              rightIcon="lock"
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
              rightIcon="lock"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          className={styles.submitBtn}
        >
          {t.auth.resetPassword}
        </Button>
      </form>

      <AuthTransitionLink href="/login" className={styles.backLink}>
        <Icon name="chevron-left" size={13} />
        {t.auth.backToLogin}
      </AuthTransitionLink>
    </AuthSimplePanel>
  );
}
