import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { getAdminOpsPayload } from "@/features/admin/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { localizedTitle } from "@/lib/page-title";
import { AdminOverviewCC } from "./admin-cc";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("خلاصه مدیریت", "Admin overview");
}

export default async function AdminPage() {
  const session = await requireAdmin();
  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "FA";
  const ops = await getAdminOpsPayload(language === "EN" ? "EN" : "FA");

  return <AdminOverviewCC ops={ops} language={language} />;
}
