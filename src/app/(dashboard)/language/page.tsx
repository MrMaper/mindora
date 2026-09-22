import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import {
  getLanguageHubData,
  listLangProjects,
  parseLanguageProjectScope,
} from "@/features/language/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { LanguageCC } from "./language-cc";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  if (!session?.user) return { title: "Language" };
  const prefs = await getUserPreferences(session.user.id);
  return {
    title: prefs?.language === "EN" ? "Language" : "زبان",
  };
}

export default async function LanguagePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspace(session.user.id);

  const { project: projectParam } = await searchParams;
  const scope = parseLanguageProjectScope(projectParam);
  const projects = await listLangProjects(session.user.id);

  const safeScope =
    scope !== "all" &&
    scope !== "inbox" &&
    !projects.some(p => p.id === scope)
      ? "all"
      : scope;

  const hub = await getLanguageHubData(session.user.id, safeScope);

  return (
    <LanguageCC hub={hub} scope={safeScope} projects={projects} />
  );
}
