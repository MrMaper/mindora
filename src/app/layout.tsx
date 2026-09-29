import type { Metadata } from "next";
import {
  getSessionCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import { Providers } from "@/providers/Providers";
import { peyda, geistMono } from "@/lib/font";
import { loadTranslations } from "@/i18n/load";
import { themeBootScript } from "@/lib/theme";
import type { Theme } from "@/types/db";
import "./globals.css";

export const metadataBase = new URL("https://mindora.app");

async function getLanguageAndTheme(): Promise<{
  language: "EN" | "FA";
  theme: Theme;
}> {
  try {
    const session = await getSessionCached();
    if (!session?.user?.id) return { language: "FA", theme: "SYSTEM" };
    const prefs = await getUserPreferencesCached(session.user.id);
    return {
      language: prefs?.language ?? "FA",
      theme: prefs?.theme ?? "SYSTEM",
    };
  } catch {
    return { language: "FA", theme: "SYSTEM" };
  }
}

async function getLanguage(): Promise<"EN" | "FA"> {
  return (await getLanguageAndTheme()).language;
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLanguage();
  const isFa = lang === "FA";

  return {
    title: {
      default: isFa
        ? "Mindora — فکر کن. برنامه بریز. رشد کن"
        : "Mindora — Think. Plan. Grow",
      template: isFa ? "%s | Mindora" : "%s | Mindora",
    },
    description: isFa
      ? "سیستم شخصی برای کار، پژوهش، یادگیری زبان و برنامه‌ریزی روزانه — Think. Plan. Grow"
      : "Personal life OS for tasks, research, language practice, and daily planning — Think. Plan. Grow",
    keywords: isFa
      ? ["Mindora", "مدیریت کار", "پژوهش", "یادگیری زبان", "تقویم شمسی", "کانبان"]
      : [
          "Mindora",
          "life OS",
          "tasks",
          "research",
          "language learning",
          "kanban",
          "Jalali calendar",
        ],
    authors: [{ name: "Mindora" }],
    creator: "Mindora",
    publisher: "Mindora",
    openGraph: {
      type: "website",
      locale: isFa ? "fa_IR" : "en_US",
      url: "https://mindora.app",
      siteName: "Mindora",
      title: isFa
        ? "Mindora — فکر کن. برنامه بریز. رشد کن"
        : "Mindora — Think. Plan. Grow",
      description: isFa
        ? "سیستم شخصی برای کار، پژوهش و رشد"
        : "Personal life OS for tasks, research, and growth",
      images: [
        {
          url: "/logo.png",
          width: 512,
          height: 512,
          alt: "Mindora — Think. Plan. Grow",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isFa
        ? "Mindora — فکر کن. برنامه بریز. رشد کن"
        : "Mindora — Think. Plan. Grow",
      description: isFa
        ? "سیستم شخصی برای کار، پژوهش و رشد"
        : "Personal life OS for tasks, research, and growth",
      images: ["/logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/assets/favicon/favicon.ico" },
        {
          url: "/assets/favicon/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/favicon/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        { url: "/logo.png", type: "image/png", sizes: "any" },
      ],
      apple: [
        { url: "/assets/favicon/apple-touch-icon.png", sizes: "180x180" },
        { url: "/logo.png" },
      ],
    },
    manifest: "/site.webmanifest",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, theme } = await getLanguageAndTheme();
  const translations = await loadTranslations(language);
  const dir = language === "FA" ? "rtl" : "ltr";
  const lang = language === "FA" ? "fa" : "en";

  return (
    <html
      lang={lang}
      dir={dir}
      data-theme="light"
      suppressHydrationWarning
      className={`${peyda.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootScript(theme) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers language={language} translations={translations}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
