import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  ensurePersonalWorkspaceCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import {
  getLanguageHubData,
  listLangProjects,
  parseLanguageProjectScope,
} from "@/features/language/queries";
import type { LanguageTab } from "@/features/language/types";
import { LanguageCC } from "./language-cc";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  if (!session?.user) return { title: "Language" };
  const prefs = await getUserPreferencesCached(session.user.id);
  return {
    title: prefs?.language === "EN" ? "Language" : "زبان",
  };
}

function parseTab(raw: string | undefined): LanguageTab {
  const allowed: LanguageTab[] = [
    "today",
    "skills",
    "vocab",
    "listening",
    "exams",
    "notes",
  ];
  if (raw && (allowed as string[]).includes(raw)) return raw as LanguageTab;
  return "today";
}

export default async function LanguagePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspaceCached(session.user.id);

  const { project: projectParam, tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);
  const scope = parseLanguageProjectScope(projectParam);
  const projects = await listLangProjects(session.user.id);

  const safeScope =
    scope !== "all" &&
    scope !== "inbox" &&
    !projects.some(p => p.id === scope)
      ? "all"
      : scope;

  const hub = await getLanguageHubData(session.user.id, safeScope, { tab });

  return (
    <LanguageCC hub={hub} scope={safeScope} projects={projects} />
  );
}
