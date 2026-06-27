"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPassword } from "@/features/auth/actions";
import type { ForgotPasswordInput } from "@/schemas/auth";

export function useForgotPassword() {
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("email", data.email);

      const result = await forgotPassword(fd);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  });

  return { form, onSubmit, success, error, isPending };
}
