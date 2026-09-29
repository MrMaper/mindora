"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  localizedZodResolver,
  resolveValidationMessage,
} from "@/lib/validation-message";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPassword } from "@/features/auth/actions";
import { useAuthLanguage } from "../auth-language";
import type { ForgotPasswordInput } from "@/schemas/auth";

export function useForgotPassword() {
  const { t } = useAuthLanguage();
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: localizedZodResolver(forgotPasswordSchema, t),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(data => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", data.email);

      const result = await forgotPassword(fd);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(
          resolveValidationMessage(t, result.error ?? "genericError"),
        );
      }
    });
  });

  return { form, onSubmit, success, error, isPending };
}
