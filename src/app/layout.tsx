import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { Providers } from "@/providers/Providers";
import { peyda, geistMono } from "@/lib/font";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadataBase = new URL("https://scrumflow.app");

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
    title: {
      default: isFa
        ? "اسکرام‌فلو - مدیریت پروژه چابک"
        : "ScrumFlow - Modern Agile Project Management",
      template: isFa ? "%s | اسکرام‌فلو" : "%s | ScrumFlow",
    },
    description: isFa
      ? "پلتفرم مدیریت پروژه چابک برای تیم‌های توسعه نرم‌افزار - اسپرینت، بک‌لاگ، کانبان و همکاری بلادرنگ"
      : "Modern Agile Project Management Platform for Software Teams - Sprints, Backlog, Kanban & Real-time Collaboration",
    keywords: isFa
      ? ["مدیریت پروژه", "اسپرینت", "کانبان", "بک‌لاگ", "چابک", "تیم توسعه"]
      : [
          "project management",
          "agile",
          "sprint",
          "kanban",
          "backlog",
          "scrum",
          "team collaboration",
        ],
    authors: [{ name: "ScrumFlow Team" }],
    creator: "ScrumFlow",
    publisher: "ScrumFlow",

    openGraph: {
      type: "website",
      locale: isFa ? "fa_IR" : "en_US",
      url: "https://scrumflow.app",
      siteName: "ScrumFlow",
      title: isFa
        ? "اسکرام‌فلو - مدیریت پروژه چابک"
        : "ScrumFlow - Modern Agile Project Management",
      description: isFa
        ? "پلتفرم مدیریت پروژه چابک برای تیم‌های توسعه نرم‌افزار"
        : "Modern Agile Project Management Platform for Software Teams",
      images: [
        {
          url: "/og-image.svg",
          width: 1200,
          height: 630,
          alt: isFa
            ? "ScrumFlow - مدیریت پروژه چابک"
            : "ScrumFlow - Modern Agile Project Management",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: isFa
        ? "اسکرام‌فلو - مدیریت پروژه چابک"
        : "ScrumFlow - Modern Agile Project Management",
      description: isFa
        ? "پلتفرم مدیریت پروژه چابک برای تیم‌های توسعه نرم‌افزار"
        : "Modern Agile Project Management Platform for Software Teams",
      images: ["/og-image.svg"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          <Providers>
            <ErrorBoundary>{children}</ErrorBoundary>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
