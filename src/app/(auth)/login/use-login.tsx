"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { localizedZodResolver } from "@/lib/validation-message";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/schemas/auth";
import { useAuthLanguage } from "../auth-language";
import type { LoginInput } from "@/schemas/auth";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const { t } = useAuthLanguage();

  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<LoginInput>({
    resolver: localizedZodResolver(loginSchema, t),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(data => {
    setError(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        const code = (result as { code?: string }).code;
        const message = String(result.error);
        if (
          code === "account_locked" ||
          message.toLowerCase().includes("account_locked")
        ) {
          setError(t.errors.accountLocked);
        } else {
          setError(t.errors.invalidEmailOrPassword);
        }
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  });

  const passwordVisible = showPassword;
  const alterVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return { form, onSubmit, error, isPending, passwordVisible, alterVisibility };
}
