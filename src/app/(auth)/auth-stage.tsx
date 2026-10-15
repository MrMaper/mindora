"use client";

import * as React from "react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { localizedZodResolver } from "@/lib/validation-message";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/schemas/auth";
import { selfSignUpAction } from "@/features/auth/signup-actions";
import { useAuthLanguage } from "./auth-language";
import { useLogin } from "./login/use-login";
import { AuthTransitionLink } from "./auth-transition-link";
import { cn } from "@/lib/utils";
import styles from "./auth-stage.module.css";

export type AuthMode = "login" | "signup";

function mapSignupError(code: string, t: ReturnType<typeof useAuthLanguage>["t"]) {
  switch (code) {
    case "signupClosed":
      return t.auth.signupClosed;
    case "emailTaken":
      return t.auth.emailTaken;
    case "signupFull":
      return t.auth.signupFull;
    case "passwordTooShort":
      return t.validation.passwordTooShort;
    case "passwordsDoNotMatch":
      return t.validation.passwordsDoNotMatch;
    case "invalidEmail":
      return t.validation.invalidEmail;
    case "nameTooShort":
      return t.validation.nameTooShort;
    default:
      return t.auth.signupFailed;
  }
}

function LoginFormBody({ onGoSignup }: { onGoSignup: () => void }) {
  const { form, onSubmit, error, isPending, passwordVisible, alterVisibility } =
    useLogin();
  const { t, language } = useAuthLanguage();
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <div className={styles.formCard} key="login-form" dir={language === "FA" ? "rtl" : "ltr"}>
      <h1 className={styles.formTitle}>{t.auth.signIn}</h1>
      <p className={styles.formSubtitle}>{t.auth.loginSubtitle}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
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

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.password}
              type={passwordVisible ? "text" : "password"}
              placeholder="••••••••"
              rightIcon="lock"
              autoComplete="current-password"
              error={errors.password?.message}
              button={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={passwordVisible ? "eye" : "eyeOff"}
                  onClick={alterVisibility}
                  tabIndex={-1}
                />
              }
            />
          )}
        />

        <div className={language === "FA" ? "text-right" : "text-left"}>
          <AuthTransitionLink
            href="/forgot-password"
            className={styles.forgotLink}
          >
            {t.auth.forgotPassword}
          </AuthTransitionLink>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          className={styles.submitBtn}
        >
          {t.auth.signIn}
        </Button>
      </form>

      <div className={styles.formSwitch}>
        <span>{t.auth.noAccount}</span>
        <button type="button" className={styles.formSwitchBtn} onClick={onGoSignup}>
          {t.auth.signUp}
        </button>
      </div>
    </div>
  );
}

function SignupFormBody({
  onGoLogin,
  signupEnabled,
}: {
  onGoLogin: () => void;
  signupEnabled: boolean;
}) {
  const { t, language } = useAuthLanguage();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<SignupInput>({
    resolver: localizedZodResolver(signupSchema, t),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const {
    control,
    formState: { errors },
  } = form;

  const onSubmit = form.handleSubmit(data => {
    if (!signupEnabled) {
      setError(t.auth.signupClosed);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await selfSignUpAction(data);
      if (!result.success) {
        setError(mapSignupError(result.error, t));
        return;
      }
      const signed = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (signed?.error) {
        setError(t.auth.signupOkLoginFailed);
        onGoLogin();
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  });

  return (
    <div className={styles.formCard} key="signup-form" dir={language === "FA" ? "rtl" : "ltr"}>
      <h1 className={styles.formTitle}>{t.auth.signUp}</h1>
      <p className={styles.formSubtitle}>{t.auth.signupSubtitle}</p>

      {!signupEnabled ? (
        <div className={styles.alertWarn}>{t.auth.signupClosed}</div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error ? (
          <div className={styles.alertError} role="alert">
            {error}
          </div>
        ) : null}

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.name}
              placeholder={t.auth.enterName}
              rightIcon="user"
              autoComplete="name"
              disabled={!signupEnabled}
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t.auth.email}
              type="email"
              placeholder={t.auth.enterEmail}
              rightIcon="mail"
              autoComplete="email"
              disabled={!signupEnabled}
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
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              rightIcon="lock"
              autoComplete="new-password"
              disabled={!signupEnabled}
              error={errors.password?.message}
              button={
                <Button
                  variant="ghost"
                  size="sm"
                  icon={showPassword ? "eye" : "eyeOff"}
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                />
              }
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
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              rightIcon="lock"
              autoComplete="new-password"
              disabled={!signupEnabled}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={!signupEnabled}
          className={styles.submitBtn}
        >
          {t.auth.createAccount}
        </Button>
      </form>

      <div className={styles.formSwitch}>
        <span>{t.auth.hasAccount}</span>
        <button type="button" className={styles.formSwitchBtn} onClick={onGoLogin}>
          {t.auth.signIn}
        </button>
      </div>
    </div>
  );
}

export function AuthStage({
  initialMode = "login",
  signupEnabled,
}: {
  initialMode?: AuthMode;
  signupEnabled: boolean;
}) {
  const { t, language } = useAuthLanguage();
  const [mode, setMode] = React.useState<AuthMode>(initialMode);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const goLogin = React.useCallback(() => setMode("login"), []);
  const goSignup = React.useCallback(() => setMode("signup"), []);

  const visualCopy =
    mode === "login"
      ? {
          eyebrow: t.auth.visualLoginEyebrow,
          title: t.auth.visualLoginTitle,
        }
      : {
          eyebrow: t.auth.visualSignupEyebrow,
          title: t.auth.visualSignupTitle,
        };

  React.useEffect(() => {
    const path = mode === "signup" ? "/login?mode=signup" : "/login";
    window.history.replaceState(null, "", path);
  }, [mode]);

  return (
    <div className={styles.stage} dir="ltr">
      <div
        className={cn(styles.shell, styles.shellEnter)}
        data-auth-shell
        data-mode={mode}
      >
        <div className={styles.stageMobileStack}>
          <aside className={styles.visual} aria-hidden={false}>
            <div className={styles.visualMedia}>
              <Image
                src="/auth-visual.jpg"
                alt=""
                fill
                priority
                sizes="220px"
              />
            </div>
            <div className={styles.visualShade} />
            <div className={styles.visualGlow} aria-hidden />
            <div
              className={styles.visualContent}
              dir={language === "FA" ? "rtl" : "ltr"}
            >
              <div className={cn(styles.visualBrand, "text-white [&_span]:text-white")}>
                <BrandMark size="md" className={styles.visualBrandMark} />
              </div>
              <div
                key={mode}
                className={cn(styles.visualCopy, styles.visualCopyAnim)}
              >
                <div className={styles.eyebrow}>{visualCopy.eyebrow}</div>
                <h2 className={styles.headline}>{visualCopy.title}</h2>
              </div>
            </div>
          </aside>

          <div className={styles.forms}>
            <div
              className={cn(styles.pane, mode === "login" && styles.paneHidden)}
            >
              <SignupFormBody
                onGoLogin={goLogin}
                signupEnabled={signupEnabled}
              />
            </div>
            <div
              className={cn(styles.pane, mode === "signup" && styles.paneHidden)}
            >
              <LoginFormBody onGoSignup={goSignup} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
