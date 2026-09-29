"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  localizedZodResolver,
  resolveValidationMessage,
} from "@/lib/validation-message";
import { useRouter } from "next/navigation";
import { resetPasswordSchema } from "@/schemas/auth";
import { resetPassword } from "@/features/auth/actions";
import { useAuthLanguage } from "../auth-language";
import type { ResetPasswordInput } from "@/schemas/auth";

export function useResetPassword(token: string) {
  const { t } = useAuthLanguage();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ResetPasswordInput>({
    resolver: localizedZodResolver(resetPasswordSchema, t),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(data => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("token", data.token);
      fd.append("password", data.password);
      fd.append("confirmPassword", data.confirmPassword);

      const result = await resetPassword(fd);
      if (result.success) {
        router.push("/login?reset=1");
      } else {
        setError(
          resolveValidationMessage(t, result.error ?? "genericError"),
        );
      }
    });
  });

  return { form, onSubmit, error, isPending };
}
