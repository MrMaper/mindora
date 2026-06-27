import type { Metadata } from "next";
import { ResetPasswordCC } from "./reset-password-cc";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordCC token={token} />;
}
