import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getNotifications } from "@/features/notifications/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { NotificationsCC } from "./notifications-cc";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("اعلان‌ها", "Notifications");
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page));

  const [data, preferences] = await Promise.all([
    getNotifications(session.user.id, pageNum),
    getUserPreferences(session.user.id),
  ]);

  const language = preferences?.language ?? "FA";

  return <NotificationsCC initialData={data} page={pageNum} language={language} />;
}
