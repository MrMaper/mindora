import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Mindora — فکر کن. برنامه بریز. رشد کن",
  description:
    "سیستم شخصی برای کار، پژوهش، یادگیری زبان و برنامه‌ریزی روزانه — Think. Plan. Grow",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  // ?preview=1 keeps the marketing page visible even when logged in
  if (preview !== "1") {
    const session = await auth();
    if (session?.user) {
      redirect(session.user.role === "ADMIN" ? "/users" : "/dashboard");
    }
  }

  return <LandingPage />;
}
