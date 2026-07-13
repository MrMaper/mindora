import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { auth } from "@/auth";
import { getUsers } from "@/features/users/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { getTeams } from "@/features/teams/queries";
import { UsersCC } from "./users-cc";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  const { search = "", page = "1" } = await searchParams;
  const data = await getUsers(search, Math.max(1, Number(page)));

  const [preferences, teamsData] = await Promise.all([
    getUserPreferences(session.user.id),
    getTeams("", 1),
  ]);
  const language = preferences?.language ?? "EN";
  const teams = teamsData.teams.map(t => ({ id: t.id, name: t.name }));

  return (
    <UsersCC
      initialData={data}
      search={search}
      page={Math.max(1, Number(page))}
      language={language}
      teams={teams}
    />
  );
}
