import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectById, getProjectMembers, getProjectTasks } from "@/features/projects/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { ProjectDetailCC } from "./project-detail-cc";

export const metadata: Metadata = { title: "Project Details" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [project, members, tasks, preferences] = await Promise.all([
    getProjectById(id),
    getProjectMembers(id),
    getProjectTasks(id),
    getUserPreferences(session.user.id),
  ]);

  if (!project) redirect("/projects");

  const language = preferences?.language ?? "EN";

  return (
    <ProjectDetailCC
      project={project}
      members={members}
      tasks={tasks}
      currentUserId={session.user.id}
      language={language}
    />
  );
}