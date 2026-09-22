import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { Providers } from "@/providers/Providers";
import { peyda, geistMono } from "@/lib/font";
import "./globals.css";

export const metadataBase = new URL("https://mindora.app");

async function getLanguage(): Promise<"EN" | "FA"> {
  try {
    const session = await auth();
    if (!session?.user?.id) return "FA";

    const prefs = await getUserPreferences(session.user.id);
    return prefs?.language ?? "FA";
  } catch {
    return "FA";
  }
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
          alt: isFa
            ? "Mindora — Think. Plan. Grow"
            : "Mindora — Think. Plan. Grow",
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
        { url: "/logo.png", type: "image/png" },
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
      ],
      apple: "/logo.png",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers language={language}>{children}</Providers>
      </body>
    </html>
  );
}
