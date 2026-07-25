import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { getUsers } from "@/features/users/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { getTeams } from "@/features/teams/queries";
import { UsersCC } from "./components/client";
import type { UserFilters } from "./components/hooks/use-users";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    role?: string;
    status?: string;
    teamId?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const session = await requireAdmin();
  if (!session?.user) redirect("/login");

  const {
    search = "",
    page = "1",
    role = "",
    status = "",
    teamId = "",
    sort = "createdAt",
    order = "desc",
  } = await searchParams;

  const [preferences, teamsData, users] = await Promise.all([
    getUserPreferences(session.user.id),
    getTeams("", 1),
    getUsers(
      search,
      Math.max(1, Number(page)),
      role,
      status,
      teamId,
      sort,
      order,
    ),
  ]);
  const language = preferences?.language ?? "EN";
  const teams = teamsData.teams.map(t => ({ id: t.id, name: t.name }));

  return (
    <UsersCC
      initialData={users}
      page={Math.max(1, Number(page))}
      language={language}
      teams={teams}
      filters={{ search, role, status, teamId }}
    />
  );
}
