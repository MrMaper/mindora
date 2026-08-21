import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getTeamById,
  getAvailableRoles,
  getAllUsersForInvite,
} from "@/features/teams/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { TeamDetailCC } from "./components/client";

export const metadata: Metadata = { title: "Team Details" };

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [team, roles, availableUsers, preferences] = await Promise.all([
    getTeamById(id),
    getAvailableRoles(),
    getAllUsersForInvite(id),
    getUserPreferences(session.user.id),
  ]);

  if (!team) notFound();

  const language = preferences?.language ?? "FA";

  const callerMember = team.members.find(m => m.userId === session.user.id);
  const callerRole = callerMember?.roleName ?? null;

  return (
    <TeamDetailCC
      team={team}
      roles={roles}
      availableUsers={availableUsers}
      callerRole={callerRole}
      currentUserId={session.user.id}
      language={language}
    />
  );
}
