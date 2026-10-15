import * as React from "react";
import type { Metadata } from "next";
import { AuthStage } from "../auth-stage";
import { getSignupEnabled } from "@/features/auth/signup-actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const signupEnabled = await getSignupEnabled();
  const initialMode = mode === "signup" ? "signup" : "login";

  return (
    <React.Suspense>
      <AuthStage initialMode={initialMode} signupEnabled={signupEnabled} />
    </React.Suspense>
  );
}
