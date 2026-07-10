"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/schemas/auth";
import type { LoginInput } from "@/schemas/auth";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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
        setError("Invalid email or password.");
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
