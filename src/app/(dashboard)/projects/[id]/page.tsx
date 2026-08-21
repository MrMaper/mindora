import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getProjectById,
  getProjectMembers,
  getProjectTasks,
  getAllUsersForInvite,
} from "@/features/projects/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { ProjectDetailCC } from "./components/client";

export const metadata: Metadata = { title: "Project Details" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [project, members, tasks, availableUsers, preferences] = await Promise.all([
    getProjectById(id),
    getProjectMembers(id),
    getProjectTasks(id),
    getAllUsersForInvite(id),
    getUserPreferences(session.user.id),
  ]);

  if (!project) redirect("/projects");

  const language = preferences?.language ?? "FA";

  return (
    <ProjectDetailCC
      project={project}
      members={members}
      tasks={tasks}
      availableUsers={availableUsers}
      currentUserId={session.user.id}
    />
  );
}
