import type { Metadata } from "next";

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
    <div className="auth-page" dir="ltr">
      {children}
    </div>
  );
}
