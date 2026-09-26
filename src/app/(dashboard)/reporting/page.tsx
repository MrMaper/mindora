import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/features/settings/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { ReportingCC } from "./reporting-cc";
import { SelectProvider } from "@/components/ui-kit/forms/common";

export const metadata: Metadata = { title: "Reporting" };

export default async function ReportingPage() {
  await requireModule("reporting");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [users, preferences] = await Promise.all([
    getAllActiveUsers(),
    getUserPreferences(session.user.id),
  ]);

  const language = preferences?.language ?? "FA";

  return (
    <SelectProvider language={language}>
      <ReportingCC users={users} language={language} />
    </SelectProvider>
  );
}
