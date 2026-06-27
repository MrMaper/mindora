import type { Metadata } from "next";
import { LoginCC } from "./login-cc";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <LoginCC />;
}
