import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { Providers } from "@/providers/Providers";
import { peyda, geistMono } from "@/lib/font";
import "./globals.css";

async function getLanguage(): Promise<"EN" | "FA"> {
  try {
    const session = await auth();
    if (!session?.user?.id) return "EN";

    const prefs = await getUserPreferences(session.user.id);
    return prefs?.language ?? "EN";
  } catch {
    return "EN";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLanguage();
  const isFa = lang === "FA";

  return {
    title: isFa ? "اسکرام‌فلو - مدیریت پروژه چابک" : "ScrumFlow - Modern Agile Project Management",
    description: isFa
      ? "پلتفرم مدیریت پروژه چابک برای تیم‌های توسعه نرم‌افزار"
      : "Modern Agile Project Management Platform for Software Teams",

    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },

    manifest: "/site.webmanifest",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getLanguage();
  const dir = language === "FA" ? "rtl" : "ltr";
  const lang = language === "FA" ? "fa" : "en";

  return (
    <html
      lang={lang}
      dir={dir}
      data-theme="light"
      className={`${peyda.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
