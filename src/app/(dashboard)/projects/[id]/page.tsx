import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getProjectById,
  getProjectMembers,
  getProjectTasks,
  getAllUsersForInvite,
} from "@/features/projects/queries";
import { ProjectDetailCC } from "./components/client";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("جزئیات مسیر", "Path details");
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [project, members, tasks, availableUsers] = await Promise.all([
    getProjectById(id, session.user.id),
    getProjectMembers(id),
    getProjectTasks(id),
    getAllUsersForInvite(id),
  ]);

  if (!project) redirect("/projects");

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
