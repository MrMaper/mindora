import type { Metadata } from "next";
import { AuthLanguageProvider, AuthLanguageSwitch } from "./auth-language";
import styles from "./auth-stage.module.css";

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
      <div className={styles.authRoot}>
        <AuthLanguageSwitch />
        {children}
      </div>
    </AuthLanguageProvider>
  );
}
