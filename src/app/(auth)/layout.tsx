import type { Metadata } from "next";
import { AuthLanguageProvider, AuthLanguageSwitch } from "./auth-language";

export const metadata: Metadata = {
  title: {
    default: "Sign in",
    template: "%s | ScrumFlow",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLanguageProvider>
      <div className="auth-page">
        {/* <AuthLanguageSwitch /> */}
        {children}
      </div>
    </AuthLanguageProvider>
  );
}
