import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjects } from "@/features/projects/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { ProjectsCC } from "./components/client";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { search = "", page = "1" } = await searchParams;
  const data = await getProjects(search, Math.max(1, Number(page)), session.user.id);

  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "FA";

  return (
    <ProjectsCC
      initialData={data}
      search={search}
      page={Math.max(1, Number(page))}
      currentUserRole={session.user.role}
    />
  );
}
