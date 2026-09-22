import type { Metadata } from "next";
import { AuthLanguageProvider, AuthLanguageSwitch } from "./auth-language";

export const metadata: Metadata = {
  title: {
    default: "ورود",
    template: "%s | Mindora",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLanguageProvider>
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-6" dir="rtl">
        <AuthLanguageSwitch />
        {children}
      </div>
    </AuthLanguageProvider>
  );
}