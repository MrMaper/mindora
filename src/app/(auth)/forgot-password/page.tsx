import type { Metadata } from "next";
import { ForgotPasswordCC } from "./forgot-password-cc";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordCC />;
}
