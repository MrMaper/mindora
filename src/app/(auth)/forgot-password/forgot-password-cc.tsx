"use client";

import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useForgotPassword } from "./use-forgot-password";
import { useAuthLanguage } from "../auth-language";
import { AuthSimplePanel } from "../auth-simple-panel";
import { AuthTransitionLink } from "../auth-transition-link";
import styles from "../auth-stage.module.css";

export function ForgotPasswordCC() {
  const { form, onSubmit, success, error, isPending } = useForgotPassword();
  const {
    control,
    formState: { errors },
  } = form;
  const { t } = useAuthLanguage();

  return (
    <AuthSimplePanel
      title={t.auth.forgotPasswordTitle}
      subtitle={t.auth.forgotPasswordDescription}
      visualEyebrow={t.auth.visualLoginEyebrow}
      visualTitle={t.auth.visualLoginTitle}
    >
      {success ? (
        <div className={styles.alertOk} role="status">
          {t.auth.passwordResetSent}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? (
            <div className={styles.alertError} role="alert">
              {error}
            </div>
          ) : null}

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label={t.auth.email}
                type="email"
                placeholder={t.auth.enterEmail}
                rightIcon="user"
                autoComplete="email"
                error={errors.email?.message}
              />
            )}
          />

          <Button
            type="submit"
            variant="primary"
            loading={isPending}
            className={styles.submitBtn}
          >
            {t.auth.sendResetLink}
          </Button>
        </form>
      )}

      <AuthTransitionLink href="/login" className={styles.backLink}>
        <Icon name="chevron-left" size={13} />
        {t.auth.backToLogin}
      </AuthTransitionLink>
    </AuthSimplePanel>
  );
}
