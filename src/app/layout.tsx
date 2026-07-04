import type { Metadata } from "next";
import { Providers } from "@/providers/Providers";
import { peyda, geistMono } from "@/lib/font";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ScrumFlow",
    template: "%s | ScrumFlow",
  },
  description: "Lightweight Scrum task management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-theme="light"
      className={`${peyda.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
