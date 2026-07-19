import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjects } from "@/features/projects/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { ProjectsCC } from "./projects-cc";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { search = "", page = "1" } = await searchParams;
  const data = await getProjects(search, Math.max(1, Number(page)));

  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "EN";

  return <ProjectsCC initialData={data} search={search} page={Math.max(1, Number(page))} language={language} />;
}