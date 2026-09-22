import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectsHub } from "@/features/projects/queries";
import { ProjectsCC } from "./components/client";

export const metadata: Metadata = { title: "Areas & paths" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { search = "" } = await searchParams;
  const data = await getProjectsHub(session.user.id, search);

  return <ProjectsCC initialData={data} search={search} />;
}
