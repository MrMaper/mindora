import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { auth } from "@/auth";
import { getTeams } from "@/features/teams/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { TeamsCC } from "./teams-cc";

export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  const { search = "", page = "1" } = await searchParams;
  const data = await getTeams(search, Math.max(1, Number(page)));

  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "EN";

  return (
    <TeamsCC
      initialData={data}
      search={search}
      page={Math.max(1, Number(page))}
      language={language}
    />
  );
}